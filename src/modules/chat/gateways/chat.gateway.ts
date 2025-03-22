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
      // Handle authentication directly in the connection method
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
        client.data = { userId };

        // Now proceed with the regular connection flow
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
      client.leave(userId);
      this.redisStore.removeUser(userId);
      await this.handleUserDisconnect(userId);
    }
  }

  protected getUserIdFromSocket(client: Socket): string | null {
    return client.data?.userId || null;
  }

  private async processMissedEvents(userId: any): Promise<void> {
    this.logger.debug(`Processing missed events for user: ${userId}...`);

    // Ensure missedEvents is always an array
    const missedEvents = (await this.redisStore.getMissedEvents(userId)) || [];

    if (missedEvents.length === 0) {
      this.logger.debug(`No missed events found for user: ${userId}`);
      return;
    }

    // Sort events chronologically
    missedEvents.sort((a, b) => a.timestamp - b.timestamp);

    this.logger.debug(
      `Found ${missedEvents.length} missed events for user: ${userId}`,
    );

    // Ensure the user is in their own room before emitting events
    await this.server
      .in(userId)
      .fetchSockets()
      .then(async (sockets) => {
        if (sockets.length === 0) {
          this.logger.warn(`User ${userId} is not in a room. Joining now...`);
          this.server.socketsJoin(userId);
        }
      });

    // Small delay to ensure the user is ready to receive events
    await new Promise((resolve) => setTimeout(resolve, 100));

    for (const event of missedEvents) {
      this.logger.debug(
        `Sending missed event to ${userId}: ${event.eventName}`,
      );
      this.server.to(userId).emit(event.eventName, event.payload);
    }

    // Clear missed events after successfully sending them
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
        if (contact.userId) {
          client.join(contact.userId.toString());
        }
      }
    });

    user.rooms?.forEach((contact) => {
      if (!contact.blocked) {
        if (contact.roomId) {
          client.join(contact.roomId.toString());
        }
      }
    });

    user.channels?.forEach((contact) => {
      if (!contact.blocked) {
        if (contact.channelId) {
          client.join(contact.channelId.toString());
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

      const contacts =
        user.contacts?.filter((contact) => !contact.blocked) || [];

      for (const contact of contacts) {
        if (contact.userId) {
          this.server.to(contact.userId.toString()).emit('user-status', {
            userId,
            status,
          });
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
      const user = await this.usersService.findOne(userId);
      if (!user) return;

      const onlineContacts: any = [];
      const contacts =
        user.contacts?.filter((contact) => !contact.blocked) || [];

      for (const contact of contacts) {
        const isOnline = await this.redisStore.isUserOnline(
          contact.userId.toString(),
        );
        if (isOnline) {
          onlineContacts.push(contact.userId);
        }
      }

      client.emit('online-contacts', { onlineContacts });
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
      this.logger.verbose(`User connected: ${userId}`);
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
    await this.redisStore.removeUser(userId);
    await this.notifyContactsWithUserStatus(userId, 'offline');
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

      // Check if participant2 is online
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
  async handleMessage(client: Socket, payload: SendMessageDto): Promise<void> {
    const senderId = this.getUserIdFromSocket(client);
    if (!senderId) return;

    try {
      const conversation = await this.conversationsService.findOne(
        new Types.ObjectId(payload.conversationId),
      );

      if (!conversation) {
        throw new BadRequestException('Conversation not found');
      }

      if (
        !conversation.participant1.equals(senderId) &&
        !conversation.participant2.equals(senderId)
      ) {
        throw new BadRequestException('Not a conversation participant');
      }

      if (conversation.blockedBy.some((id) => id.equals(payload.receiverId))) {
        throw new BadRequestException('Conversation blocked');
      }

      const message = await this.messagesService.create(payload);

      await this.conversationsService.setLastMessage(
        new Types.ObjectId(payload.conversationId),
        message._id,
      );

      // Check receiver availability
      const receiverOnline = await this.redisStore.isUserOnline(
        payload.receiverId,
      );
      if (!receiverOnline) {
        const missedEvent: MissedEvent = {
          eventName: ChatEvents.RECEIVE_MESSAGE,
          payload: message,
          timestamp: Date.now(),
          conversationId: payload.conversationId,
        };
        await this.redisStore.storeMissedEvent(payload.receiverId, missedEvent);
      }

      // Cross-instance communication
      await this.redisStore.publish('chat:message', {
        event: ChatEvents.RECEIVE_MESSAGE,
        conversationId: payload.conversationId,
        receiverId: payload.receiverId,
        payload: message,
      });

      // Emit to conversation room
      this.server
        .to(payload.conversationId)
        .emit(ChatEvents.RECEIVE_MESSAGE, message);

      // Update delivery status
      if (receiverOnline) {
        await this.messagesService.updateStatus(
          message._id,
          MessageStatus.DELIVERED,
        );
        this.server.to(payload.senderId).emit(ChatEvents.MESSAGE_DELIVERED, {
          messageId: message._id,
          conversationId: payload.conversationId,
        });
      }
    } catch (error) {
      this.logger.error('Message handling error:', error);
      client.emit('error', {
        message:
          error instanceof BadRequestException
            ? error.message
            : 'Message send failed',
      });
    }
  }
}
