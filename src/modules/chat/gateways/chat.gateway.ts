import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  Logger,
  BadRequestException,
  UseGuards,
  ConflictException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RedisStoreService } from '../services/redis-store.service';
import { ConversationsService } from '../services/conversations.service';
import { MessagesService } from '../services/messages.service';
import { UsersService } from '../../users/services/users.service';
import { ChatEvents } from '../events/chat.events';
import { WsAuthGuard } from '../guards/ws-auth.guard';
import { CreateConversationDto } from '../dtos/create-conversation.dto';
import { SendMessageDto } from '../dtos/send-message.dto';
import { MissedEvent } from '../interfaces/missed-event.interface';
import { MessageStatus } from '../enums/message-status.enum';
import { CreateMessageDto } from '../dtos/create-message.dto';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'chat',
})
export class ChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  protected server: Server;

  constructor(
    private readonly redisStore: RedisStoreService,
    private readonly conversationsService: ConversationsService,
    private readonly messagesService: MessagesService,
    protected readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async afterInit(): Promise<void> {
    // Initialize any required resources here
  }

  async handleConnection(client: Socket): Promise<void> {
    try {
      const authHeader = client.handshake.headers.authorization;
      const token =
        client.handshake.auth?.token ||
        (authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null);

      if (!token) {
        this.logger.error('Authentication token not provided');
        client.disconnect();
        return;
      }

      try {
        const payload = await this.jwtService.verifyAsync(token, {
          secret: this.configService.get('jwt')?.secret,
        });

        const userId = payload.sub;
        client.data = { userId }

        this.redisStore.addUser(userId, client.id);
        await this.handleUserConnect(userId, client);
      } catch (err) {
        this.logger.error('Invalid authentication token', err);
        client.disconnect();
        return;
      }
    } catch (error) {
      this.logger.error('Connection error:', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket): Promise<void> {
    const userId = this.getUserIdFromSocket(client);
    if (userId) {
      await this.handleUserDisconnect(userId);
      client.leave(userId);
      this.redisStore.removeUser(userId);
    }
  }

  protected getUserIdFromSocket(client: Socket): string | null {
    return client.data?.userId || null;
  }

  private async processMissedEvents(userId: any): Promise<void> {
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

  private async joinUserRooms(userId: any, client: Socket): Promise<void> {
    this.logger.debug('joiningUserRooms...');
    client.join(userId);

    const user = await this.usersService.findOne(userId);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    user.contacts?.forEach((contact) => {
      if (!contact.blocked) {
        if (contact.user) {
          client.join(contact?.user?.toString());
        }
      }
    });

    user.rooms?.forEach((contact) => {
      if (!contact.blocked) {
        if (contact.roomId) {
          client.join(contact?.roomId.toString());
        }
      }
    });

    user.channels?.forEach((contact) => {
      if (!contact.blocked) {
        if (contact.channelId) {
          client.join(contact?.channelId.toString());
        }
      }
    });
  }

  private async notifyContactsWithUserStatus(
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

  private async notifyUserWithOnlineContacts(
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

  protected async handleUserConnect(
    userId: any,
    client: Socket,
  ): Promise<void> {
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

  protected async handleUserDisconnect(userId: string): Promise<void> {
    this.logger.log(`User disconnected: ${userId}`);
    await this.notifyContactsWithUserStatus(userId, 'offline');
    await this.redisStore.removeUser(userId);
  }

  @SubscribeMessage(ChatEvents.START_CONVERSATION)
  async handleCreateConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: CreateConversationDto,
  ): Promise<void> {
    const senderId = this.getUserIdFromSocket(client);
    if (!senderId) return;

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

  @SubscribeMessage(ChatEvents.SEND_MESSAGE)
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SendMessageDto,
  ): Promise<void> {
    const senderId = this.getUserIdFromSocket(client);
    if (!senderId) {
      client.emit(ChatEvents.ERROR, { message: 'Unauthorized' });
      return;
    }

    try {
      const conversationId = new Types.ObjectId(payload.conversationId);
      const receiverId = new Types.ObjectId(payload.receiverId);

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

      const messagePayload: CreateMessageDto = {
        ...payload,
        senderId: senderId?.toString(),
      };

      const message = await this.messagesService.create(messagePayload);

      await this.conversationsService.setLastMessage(
        conversationId,
        message._id,
      );

      const receiverOnline = await this.redisStore.isUserOnline(
        receiverId?.toString(),
      );

      if (!receiverOnline) {
        const missedEvent: MissedEvent = {
          eventName: ChatEvents.RECEIVE_MESSAGE,
          payload: message,
          timestamp: Date.now(),
          conversationId: payload.conversationId,
        };
        await this.redisStore.storeMissedEvent(
          receiverId?.toString(),
          missedEvent,
        );

        this.server.to(senderId?.toString()).emit(ChatEvents.MESSAGE_DELIVERED, {
          messageId: message._id,
          conversationId: payload.conversationId,
        });
      }

      if (receiverOnline) {
        this.server
          .to(receiverId?.toString())
          .emit(ChatEvents.RECEIVE_MESSAGE, message);

        await this.messagesService.updateStatus(
          message._id,
          MessageStatus.DELIVERED,
        );

        this.server.to(senderId?.toString()).emit(ChatEvents.MESSAGE_DELIVERED, {
          messageId: message._id,
          conversationId: payload.conversationId,
        });
      }
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

  @SubscribeMessage(ChatEvents.USER_TYPING)
  async handleStartTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string; receiverId: string },
  ): Promise<void> {
    const senderId = this.getUserIdFromSocket(client);
    if (!senderId) {
      client.emit(ChatEvents.ERROR, { message: 'Unauthorized' });
      return;
    }

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
          isTyping: true,
        });
      }
    } catch (error) {
      this.logger.error(`Start typing error: ${error.message}`, error.stack);
      client.emit(ChatEvents.ERROR, {
        message:
          error instanceof BadRequestException
            ? error.message
            : 'Failed to process typing indicator',
      });
    }
  }

  @SubscribeMessage(ChatEvents.USER_STOP_TYPING)
  async handleStopTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string; receiverId: string },
  ): Promise<void> {
    const senderId = this.getUserIdFromSocket(client);
    if (!senderId) {
      client.emit(ChatEvents.ERROR, { message: 'Unauthorized' });
      return;
    }

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

      // Emit stop typing event to the receiver
      const receiverOnline = await this.redisStore.isUserOnline(
        receiverId?.toString(),
      );
      if (receiverOnline) {
        this.server.to(receiverId?.toString()).emit(ChatEvents.USER_TYPING, {
          conversationId: payload.conversationId,
          userId: senderId,
          isTyping: false,
        });
      }
    } catch (error) {
      this.logger.error(`Stop typing error: ${error.message}`, error.stack);
      client.emit(ChatEvents.ERROR, {
        message:
          error instanceof BadRequestException
            ? error.message
            : 'Failed to process typing indicator',
      });
    }
  }
}
