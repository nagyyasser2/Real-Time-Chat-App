import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { Socket } from 'socket.io';
import { RedisStoreService } from './redis-store.service';
import { ConversationsService } from './conversations.service';
import { MessagesService } from './messages.service';
import { UsersService } from '../../users/users.service';
import { ChatEvents } from '../chat.events';
import { SendMessageDto } from '../dtos/send-message.dto';
import { MissedEvent } from '../interfaces/missed-event.interface';
import { MessageStatus } from '../enums/message-status.enum';
import { CreateMessageDto } from '../dtos/create-message.dto';
import { Server } from 'socket.io';
import { MessageDocument } from '../schemas/message.schema';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private server: Server;

  constructor(
    private readonly redisStore: RedisStoreService,
    private readonly conversationsService: ConversationsService,
    private readonly messagesService: MessagesService,
    private readonly usersService: UsersService,
  ) {}

  setServer(server: Server): void {
    this.server = server;
  }

  async processMissedEvents(userId: string, client?: Socket): Promise<void> {
    this.logger.debug(`Processing missed events for user: ${userId}...`);

    const missedEvents = (await this.redisStore.getMissedEvents(userId)) || [];

    if (missedEvents.length === 0) {
      this.logger.debug(`No missed events found for user: ${userId}`);
      return;
    }

    // this.logger.debug(`Missed events data:`, missedEvents);

    // Sort events by timestamp to process them in chronological order
    missedEvents.sort((a, b) => a.timestamp - b.timestamp);

    this.logger.debug(
      `Found ${missedEvents.length} missed events for user: ${userId}`,
    );

    for (const event of missedEvents) {
      this.logger.debug(
        `Sending missed event to ${userId}: ${event.eventName}`,
      );

      // If client socket is provided, emit directly to it
      // This ensures the event reaches the client even if room joining is delayed
      if (client) {
        client.emit(event.eventName, event.payload);
      } else {
        // Fall back to room-based emission if no specific client is provided
        this.server.to(userId).emit(event.eventName, event.payload);
      }
    }

    await this.redisStore.clearMissedEvents(userId);
    this.logger.debug(`Cleared missed events for user: ${userId}`);
  }

  async joinUserRooms(userId: string, client: Socket): Promise<void> {
    this.logger.debug('joiningUserRooms...');
    client.join(userId);

    const user = await this.usersService.findOne(userId);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    user.rooms?.forEach((room) => {
      if (!room.blocked && room.roomId) {
        client.join(room.roomId.toString());
      }
    });

    user.channels?.forEach((channel) => {
      if (!channel.blocked && channel.channelId) {
        client.join(channel.channelId.toString());
      }
    });
  }

  async notifyContactsWithUserStatus(
    userId: string,
    status: 'online' | 'offline',
  ): Promise<void> {
    this.logger.debug('notifyingContactsWithUserStatus....');
    try {
      const user = await this.usersService.findOne(userId);
      if (!user) return;

      // Only notify contacts who haven't removed the user AND aren't blocked
      const contacts: any =
        user.contacts?.filter(
          (contact) => !contact.blocked && !contact.removedByContact,
        ) || [];

      for (const contact of contacts) {
        if (contact.user) {
          this.server
            .to(contact.user?.toString())
            .emit(
              status === 'online'
                ? ChatEvents.USER_ONLINE
                : ChatEvents.USER_OFLINE,
              {
                userId,
                status,
              },
            );
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to notify contacts about user ${userId} status:`,
        error,
      );
    }
  }

  async notifyUserWithOnlineContacts(
    userId: string,
    client: Socket,
  ): Promise<void> {
    this.logger.debug('notifyingUserWithOnlineContacts...');
    try {
      const user: any = await this.usersService.findOne(userId);
      if (!user) return;

      const onlineContacts: any = [];
      const contacts =
        user.contacts?.filter((contact) => !contact.blocked) || [];

      for (const contact of contacts) {
        const isOnline = await this.redisStore.isUserOnline(
          contact.user?.toString(),
        );

        if (isOnline) {
          onlineContacts.push(contact.user?.toString());
        }
      }

      client.emit(ChatEvents.ONLINE_CONTACTS, { onlineContacts });
    } catch (error) {
      this.logger.error(
        `Failed to notify user ${userId} with online contacts:`,
        error,
      );
    }
  }

  async handleUserConnect(userId: string, client: Socket): Promise<void> {
    try {
      this.logger.debug(`User connected: ${userId}`);
      await this.usersService.updateLastSeen(userId);
      await this.joinUserRooms(userId, client);
      await this.processMissedEvents(userId);
      await this.notifyContactsWithUserStatus(userId, 'online');
      await this.notifyUserWithOnlineContacts(userId, client);
    } catch (error) {
      this.logger.error(`Connection error for user ${userId}:`, error);
      client.disconnect();
    }
  }

  async handleUserDisconnect(userId: string): Promise<void> {
    this.logger.log(`User disconnected: ${userId}`);
    await this.usersService.updateLastSeen(userId),
      await this.notifyContactsWithUserStatus(userId, 'offline');
    await this.redisStore.removeUser(userId);
  }

  async sendMessage(
    senderId: string,
    payload: SendMessageDto,
    client: Socket,
  ): Promise<void> {
    try {
      // Input validation
      if (!payload.receiverId) {
        throw new BadRequestException('Missing required sender or receiver ID');
      }
  
      const receiverId = this.validateObjectId(payload.receiverId);
      let conversation: any = null;
      
      // Try to find existing conversation
      if (payload.conversationId) {
        try {
          const conversationId = this.validateObjectId(payload.conversationId);
          conversation = await this.conversationsService.findOneById(conversationId);
        } catch (error) {
          this.logger.debug(`Invalid conversation ID: ${error.message}`);
        }
      }
  
      // Create new conversation if needed
      if (!conversation) {
        conversation = await this.createNewConversation(senderId, receiverId.toString());
        payload.conversationId = conversation._id.toString();
      }
  
      // Validate user permissions and conversation state
      this.validateConversationAccess(conversation, senderId, receiverId);
  
      // Create and send the message
      const message = await this.createMessage(senderId, payload);
  
      // Update conversation and notify participants
      await this.updateConversationAndNotify(conversation, message, senderId, receiverId);
  
      return;
    } catch (error) {
      this.handleSendMessageError(error, client);
    }
  }
  
  private validateObjectId(id: string): Types.ObjectId {
    try {
      return new Types.ObjectId(id);
    } catch (error) {
      throw new BadRequestException(`Invalid ID format: ${id}`);
    }
  }
  
  private async createNewConversation(
    senderId: string, 
    receiverId: string
  ): Promise<any> {
    const conversation = await this.conversationsService.create(senderId, receiverId);
    
    // Notify both participants about the new conversation
     this.server.to(receiverId).emit(ChatEvents.NEW_CONVERSATION, conversation);
     this.server.to(senderId).emit(ChatEvents.NEW_CONVERSATION, conversation);
    
    return conversation;
  }
  
  private validateConversationAccess(
    conversation: any, 
    senderId: string, 
    receiverId: Types.ObjectId
  ): void {
    // Check if user is a participant
    if (
      !conversation.participant1.equals(senderId) &&
      !conversation.participant2.equals(senderId)
    ) {
      throw new BadRequestException('Not a conversation participant');
    }
  
    // Check if conversation is blocked
    if (
      conversation.blockedBy.some(
        (id) => id.equals(senderId) || id.equals(receiverId),
      )
    ) {
      throw new BadRequestException('Conversation is blocked');
    }
  }
  
  private async createMessage(
    senderId: string, 
    payload: SendMessageDto
  ): Promise<any> {
    const messagePayload: CreateMessageDto = {
      ...payload,
      senderId: new Types.ObjectId(senderId),
      conversationId: new Types.ObjectId(payload.conversationId),
    };
  
    return this.messagesService.create(messagePayload);
  }
  
  private async updateConversationAndNotify(
    conversation: any,
    message: any,
    senderId: string,
    receiverId: Types.ObjectId
  ): Promise<void> {
    // Update last message in conversation
    await this.conversationsService.setLastMessage(conversation._id, message._id);
    
    // Always send message to sender
    this.server.to(senderId).emit(ChatEvents.RECEIVE_MESSAGE, message);
    
    // Check if receiver is online and notify them
    const receiverOnline = await this.redisStore.isUserOnline(receiverId.toString());
    
    if (receiverOnline) {
      this.server.to(receiverId.toString()).emit(ChatEvents.RECEIVE_MESSAGE, message);
      
      // Mark as delivered and notify sender
      const updatedMsg = await this.messagesService.updateStatus(
        message._id,
        MessageStatus.DELIVERED,
      );
      
      this.server.to(senderId).emit(ChatEvents.MESSAGE_DELIVERED, updatedMsg);
    } else {
      // Optional: Queue for push notification or other offline delivery mechanism
      await this.queueOfflineNotification(receiverId.toString(), message);
    }
  }
  
  private async queueOfflineNotification(receiverId: string, message: any): Promise<void> {
    try {
      // Implementation would depend on your notification system
      // E.g., this.notificationService.queuePushNotification(receiverId, {
      //   title: "New message",
      //   body: message.content.substring(0, 100),
      //   data: { conversationId: message.conversationId }
      // });
    } catch (error) {
      this.logger.warn(`Failed to queue offline notification: ${error.message}`);
      // Don't throw - this is a non-critical failure
    }
  }
  
  private handleSendMessageError(error: any, client: Socket): void {
    const errorCode = error.code || 'UNKNOWN_ERROR';
    const statusCode = error instanceof BadRequestException ? 400 : 500;
    
    this.logger.error(
      `Message handling error [${errorCode}]: ${error.message}`,
      error.stack,
    );
    
    client.emit(ChatEvents.ERROR, {
      code: errorCode,
      status: statusCode,
      message: error instanceof BadRequestException 
        ? error.message 
        : 'Message send failed',
    });
  }

  async handleTypingStatus(
    senderId: string,
    payload: { conversationId: string; receiverId: string },
    isTyping: boolean,
    client: Socket,
  ): Promise<void> {
    try {
      const conversationId = new Types.ObjectId(payload.conversationId);
      const receiverId = new Types.ObjectId(payload.receiverId);

      // Verify conversation exists and user is a participant
      const conversation =
        await this.conversationsService.findOneById(conversationId);
      if (!conversation) {
        throw new BadRequestException('Conversation not found');
      }

      if (
        !conversation.participant1.equals(senderId) &&
        !conversation.participant2.equals(senderId)
      ) {
        throw new BadRequestException('Not a conversation participant');
      }

      if (
        conversation.blockedBy.some(
          (id) => id.equals(senderId) || id.equals(receiverId),
        )
      ) {
        throw new BadRequestException('Conversation is blocked');
      }

      // Emit typing event to the receiver
      const receiverOnline = await this.redisStore.isUserOnline(
        receiverId?.toString(),
      );
      if (receiverOnline) {
        this.server.to(receiverId?.toString()).emit(ChatEvents.USER_TYPING, {
          conversationId: payload.conversationId,
          userId: senderId,
          isTyping: isTyping,
        });
      }
    } catch (error) {
      this.logger.error(`Typing status error: ${error.message}`, error.stack);
      client.emit(ChatEvents.ERROR, {
        message:
          error instanceof BadRequestException
            ? error.message
            : 'Failed to process typing indicator',
      });
    }
  }

  async markConversationMessagesAsRead(
    userId: string,
    payload: { conversationId: string; senderId: string },
    client: Socket,
  ): Promise<void> {
    try {
      const conversationId = new Types.ObjectId(payload.conversationId);
      const conversation =
        await this.conversationsService.findOneById(conversationId);

      if (!conversation) {
        throw new BadRequestException('Conversation not found');
      }

      const unreadMessages = await this.messagesService.findMany({
        status: { $in: ['delivered', 'sent'] },
        conversationId: payload.conversationId,
      });

      if (unreadMessages.length === 0) {
        return;
      }

      const messageIds = unreadMessages.map((msg) => msg._id);

      await this.messagesService.markMultipleAsRead(messageIds);

      const readPayload = {
        messageIds: messageIds.map((id) => id.toString()),
        conversationId: payload.conversationId,
        readBy: userId,
        readAt: new Date(),
      };

      const senderOnline = await this.redisStore.isUserOnline(payload.senderId);

      if (!senderOnline) {
        const missedEvent: MissedEvent = {
          eventName: ChatEvents.READ_CONVERSATION,
          payload: readPayload,
          timestamp: Date.now(),
          conversationId: payload.conversationId,
        };

        await this.redisStore.storeMissedEvent(payload.senderId, missedEvent);
      } else {
        this.server
          .to(payload.senderId)
          .emit(ChatEvents.READ_CONVERSATION, readPayload);
      }
    } catch (error) {
      this.logger.error(
        `Mark conversation as read error: ${error.message}`,
        error.stack,
      );
      client.emit(ChatEvents.ERROR, {
        message:
          error instanceof BadRequestException
            ? error.message
            : 'Failed to mark conversation as read',
      });
    }
  }

  async handleLastSeen(requestingUserId: string, userId: string) {
    return await this.usersService.checkLastSeenAccess(
      requestingUserId,
      userId,
    );
  }

  async markMessagesAsRead(conversationId: string, userId: string){
    return await this.messagesService.markMessagesAsRead(conversationId, userId)
  }

  async markMessageAsRead(
    messageId: Types.ObjectId | string,
  ): Promise<MessageDocument | null> {
    return await this.messagesService.markMessageAsRead(messageId);
  }
}
