import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { Socket } from 'socket.io';
import { RedisStoreService } from './redis-store.service';
import { ConversationsService } from './conversations.service';
import { MessagesService } from './messages.service';
import { UsersService } from '../../users/services/users.service';
import { ChatEvents } from '../events/chat.events';
import { CreateConversationDto } from '../dtos/create-conversation.dto';
import { SendMessageDto } from '../dtos/send-message.dto';
import { MissedEvent } from '../interfaces/missed-event.interface';
import { MessageStatus } from '../enums/message-status.enum';
import { CreateMessageDto } from '../dtos/create-message.dto';
import { Server } from 'socket.io';

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

  async processMissedEvents(userId: string): Promise<void> {
    this.logger.debug(`Processing missed events for user: ${userId}...`);

    const missedEvents = (await this.redisStore.getMissedEvents(userId)) || [];

    if (missedEvents.length === 0) {
      this.logger.debug(`No missed events found for user: ${userId}`);
      return;
    }

    missedEvents.sort((a, b) => a.timestamp - b.timestamp);

    this.logger.debug(
      `Found ${missedEvents.length} missed events for user: ${userId}`,
    );

    await this.server
      .in(userId)
      .fetchSockets()
      .then(async (sockets) => {
        if (sockets.length === 0) {
          this.logger.warn(`User ${userId} is not in a room. Joining now...`);
          this.server.socketsJoin(userId);
        }
      });

    await new Promise((resolve) => setTimeout(resolve, 100));

    for (const event of missedEvents) {
      this.logger.debug(
        `Sending missed event to ${userId}: ${event.eventName}`,
      );
      this.server.to(userId).emit(event.eventName, event.payload);
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
    this.logger.debug('notifyingContactsWithUserStauts....');
    try {
      const user = await this.usersService.findOne(userId);
      if (!user) return;

      const contacts: any =
        user.contacts?.filter((contact) => !contact.blocked) || [];

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
      await this.processMissedEvents(userId);
      await this.joinUserRooms(userId, client);
      await this.notifyContactsWithUserStatus(userId, 'online');
      await this.notifyUserWithOnlineContacts(userId, client);
    } catch (error) {
      this.logger.error(`Connection error for user ${userId}:`, error);
      client.disconnect();
    }
  }

  async handleUserDisconnect(userId: string): Promise<void> {
    this.logger.log(`User disconnected: ${userId}`);
    await this.notifyContactsWithUserStatus(userId, 'offline');
    await this.redisStore.removeUser(userId);
  }

  async createConversation(
    senderId: string,
    payload: CreateConversationDto,
    client: Socket,
  ): Promise<void> {
    const { participant2 } = payload;

    try {
      let conversation = await this.conversationsService.create(
        senderId,
        participant2,
      );

      client.emit(ChatEvents.CONVERSATION_CREATED, conversation);
      this.server
        .to(participant2)
        .emit(ChatEvents.NEW_CONVERSATION, conversation);

      const participantOnline =
        await this.redisStore.isUserOnline(participant2);

      if (!participantOnline) {
        const missedEvent: MissedEvent = {
          eventName: ChatEvents.NEW_CONVERSATION,
          payload: conversation,
          timestamp: Date.now(),
          conversationId: conversation.id,
        };

        await this.redisStore.storeMissedEvent(participant2, missedEvent);
      }
    } catch (error) {
      client.emit(ChatEvents.ERROR, { message: error.message });
    }
  }

  async sendMessage(
    senderId: string,
    payload: SendMessageDto,
    client: Socket,
  ): Promise<void> {
    try {
      let conversation;
      const receiverId = new Types.ObjectId(payload.receiverId);

      if (payload.conversationId) {
        try {
          const conversationId = new Types.ObjectId(payload.conversationId);
          conversation =
            await this.conversationsService.findOne(conversationId);
        } catch (error) {
          conversation = null;
        }
      }

      if (!conversation) {
        conversation = await this.conversationsService.create(
          senderId,
          receiverId.toString(),
        );
        payload.conversationId = conversation._id.toString();
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

      const messagePayload: CreateMessageDto = {
        ...payload,
        senderId: senderId?.toString(),
      };

      const message = await this.messagesService.create(messagePayload);

      const receiverOnline = await this.redisStore.isUserOnline(
        receiverId?.toString(),
      );

      if (!receiverOnline) {
        const missedEvent: MissedEvent = {
          eventName: ChatEvents.RECEIVE_MESSAGE,
          payload: message,
          timestamp: Date.now(),
          conversationId: conversation._id.toString(),
        };
        await this.redisStore.storeMissedEvent(
          receiverId?.toString(),
          missedEvent,
        );
      }

      if (receiverOnline) {
        this.server
          .to(receiverId?.toString())
          .emit(ChatEvents.RECEIVE_MESSAGE, message);

        await this.messagesService.updateStatus(
          message._id,
          MessageStatus.DELIVERED,
        );
      }
      
      client.emit(ChatEvents.MESSAGE_DELIVERED, {
        messageId: message._id,
        conversationId: conversation._id.toString(),
      });

      this.server
      .to(senderId?.toString())
      .emit(ChatEvents.RECEIVE_MESSAGE, message);
     
    } catch (error) {
      this.logger.error(
        `Message handling error: ${error.message}`,
        error.stack,
      );
      client.emit(ChatEvents.ERROR, {
        message:
          error instanceof BadRequestException
            ? error.message
            : 'Message send failed',
      });
    }
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
        await this.conversationsService.findOne(conversationId);
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
}