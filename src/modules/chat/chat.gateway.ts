import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { ChatEvents } from './events/chat.events';
import { SendMessageDto } from './dtos/send-message.dto';
import { AppGateway } from '../../app.gateway';
import { RedisStoreService } from './services/redis-store.service';
import {
  Logger,
  UsePipes,
  ValidationPipe,
  BadRequestException,
} from '@nestjs/common';
import { MissedEvent } from './interfaces/missed-event.interface';
import { ConversationsService } from './services/conversations.service';
import { Types } from 'mongoose';
import { MessagesService } from './services/messages.service';
import { MessageStatus } from './enums/message-status.enum';
import { UsersService } from '../users/services/users.service';
import { CreateConversationDto } from './dtos/create-conversation.dto';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'chat',
})
@UsePipes(new ValidationPipe())
export class ChatGateway extends AppGateway implements OnGatewayInit {
  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly redisStore: RedisStoreService,
    private readonly conversationsService: ConversationsService,
    private readonly messagesService: MessagesService,
    protected readonly usersService: UsersService,
  ) {
    super(redisStore);
  }

  async afterInit(): Promise<void> {
    await this.redisStore.subscribe('chat:message', (message) => {
      this.handleRedisMessage(message);
    });
  }

  private async handleRedisMessage(message: any): Promise<void> {
    try {
      if (message.event === ChatEvents.RECEIVE_MESSAGE) {
        const conversation = await this.conversationsService.findOne(
          new Types.ObjectId(message.conversationId),
        );

        if (
          conversation &&
          !conversation.blockedBy.includes(message.receiverId)
        ) {
          this.server
            .to(message.conversationId)
            .emit(ChatEvents.RECEIVE_MESSAGE, message.payload);
        }
      }
    } catch (error) {
      this.logger.error('Error handling Redis message:', error);
    }
  }

  private async processMissedEvents(userId: any): Promise<void> {
    const missedEvents = await this.redisStore.getMissedEvents(userId);
    if (missedEvents.length > 0) {
      missedEvents.sort((a, b) => a.timestamp - b.timestamp);

      for (const event of missedEvents) {
        this.server.to(userId).emit(event.eventName, event.payload);
      }

      await this.redisStore.clearMissedEvents(userId);
    }
  }

  private async joinUserRooms(userId: any, client: Socket): Promise<void> {
    client.join(userId);

    const user = await this.usersService.findOne(userId);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    user.contacts.forEach((contact) => {
      if (!contact.blocked) {
        if (contact.room) {
          client.join(contact.room.toString());
        }
        if (contact.user) {
          client.join(contact.user.toString());
        }
      }
    });
  }

  protected async handleUserConnect(
    userId: any,
    client: Socket,
  ): Promise<void> {
    try {
      this.logger.log(`User connected: ${client.id}`);
      await this.joinUserRooms(userId, client);
      await this.processMissedEvents(userId);
    } catch (error) {
      this.logger.error(`Connection error for user ${userId}:`, error);
    }
  }

  protected async handleUserDisconnect(userId: string): Promise<void> {
    this.logger.log(`User disconnected: ${userId}`);
    await this.redisStore.removeUser(userId);
  }

  @SubscribeMessage(ChatEvents.CREATE_CONVERSATION)
  async handleCreateConversation(
    client: Socket,
    payload: CreateConversationDto,
  ): Promise<void> {
    const senderId = this.getUserIdFromSocket(client);
    if (!senderId) return;

    const { participant2 } = payload;
    const participantObjectId = new Types.ObjectId(participant2);
    const senderObjectId = new Types.ObjectId(senderId);

    try {
      // Ensure participant is not the sender
      if (senderId === participant2) {
        client.emit(ChatEvents.ERROR, {
          message: 'Cannot create a conversation with yourself',
        });
        return;
      }

      // Check if a conversation already exists
      const existingConversation =
        await this.conversationsService.findUserConversations(senderId, 0, 100);
      const conversation = existingConversation.data.find(
        (c) =>
          (c.participant1.toString() === senderId &&
            c.participant2.toString() === senderId) ||
          (c.participant1.toString() === senderId &&
            c.participant2.toString() === senderId),
      );

      if (conversation) {
        client.emit(ChatEvents.CONVERSATION_EXISTS, conversation);
        return;
      }

      // Create a new conversation
      const newConversation = await this.conversationsService.create(
        senderId ,
        participant2,
      );

      // Notify both users
      client.emit(ChatEvents.CONVERSATION_CREATED, newConversation);
      this.server
        .to(senderId.toString())
        .emit(ChatEvents.NEW_CONVERSATION, newConversation);
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
