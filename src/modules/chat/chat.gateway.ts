import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { ChatEvents } from './events/chat.events';
import { SendMessageDto } from './dtos/send-message.dto';
import { ChatService } from './services/chat.service';
import { AppGateway } from '../../app.gateway';
import { RedisStoreService } from './services/redis-store.service';
import { Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import { MissedEvent } from './interfaces/missed-event.interface';

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
    private readonly chatService: ChatService,
    private readonly redisStore: RedisStoreService,
  ) {
    super(redisStore);
  }

  async afterInit(): Promise<void> {
    // Subscribe to Redis channels for cross-instance communication
    await this.redisStore.subscribe('chat:message', (message) => {
      this.handleRedisMessage(message);
    });
  }

  private async handleRedisMessage(message: any): Promise<void> {
    // Handle messages from other instances
    if (message.event === ChatEvents.RECEIVE_MESSAGE) {
      this.server.to(message.chatId).emit(ChatEvents.RECEIVE_MESSAGE, message.payload);
    }
  }

  protected async handleUserConnect(userId: string, client: Socket): Promise<void> {
    this.logger.log(`User connected: ${userId}`);

    // Handle missed events when user reconnects
    const missedEvents = await this.redisStore.getMissedEvents(userId);
    if (missedEvents.length > 0) {
      // Sort events by timestamp
      missedEvents.sort((a, b) => a.timestamp - b.timestamp);

      // Emit missed events to the user
      for (const event of missedEvents) {
        client.emit(event.eventName, event.payload);
      }

      // Clear missed events after sending
      await this.redisStore.clearMissedEvents(userId);
    }
  }

  protected async handleUserDisconnect(userId: string): Promise<void> {
    this.logger.log(`User disconnected: ${userId}`);
    // Keep track of user's last known state in Redis
    // This is handled by the TTL set in RedisStoreService
  }

  @SubscribeMessage(ChatEvents.JOIN_CHAT)
  async handleJoinChat(client: Socket, chatId: string): Promise<void> {
    const userId = this.getUserIdFromSocket(client);
    if (!userId) return;

    await client.join(chatId);
    await this.redisStore.addUserToChat(chatId, userId);
    await this.chatService.addUserToChat(chatId, userId);
    this.logger.log(`User ${userId} joined chat: ${chatId}`);
  }

  @SubscribeMessage(ChatEvents.LEAVE_CHAT)
  async handleLeaveChat(client: Socket, chatId: string): Promise<void> {
    const userId = this.getUserIdFromSocket(client);
    if (!userId) return;

    await client.leave(chatId);
    await this.redisStore.removeUserFromChat(chatId, userId);
    await this.chatService.removeUserFromChat(chatId, userId);
    this.logger.log(`User ${userId} left chat: ${chatId}`);
  }

  @SubscribeMessage(ChatEvents.SEND_MESSAGE)
  async handleMessage(client: Socket, payload: SendMessageDto): Promise<void> {
    const senderId = this.getUserIdFromSocket(client);
    if (!senderId) return;

    try {
      const message = await this.chatService.saveMessage(
        senderId,
        payload.receiverId,
        payload.content,
        payload.chatId,
      );

      // Store event for offline users
      const receiverOnline = await this.redisStore.isUserOnline(payload.receiverId);
      if (!receiverOnline) {
        const missedEvent: MissedEvent = {
          eventName: ChatEvents.RECEIVE_MESSAGE,
          payload: message,
          timestamp: Date.now(),
          chatId: payload.chatId,
        };
        await this.redisStore.storeMissedEvent(payload.receiverId, missedEvent);
      }

      // Publish message to Redis for cross-instance communication
      await this.redisStore.publish('chat:message', {
        event: ChatEvents.RECEIVE_MESSAGE,
        chatId: payload.chatId,
        payload: message,
      });

      // Emit to the chat room in this instance
      this.server.to(payload.chatId).emit(ChatEvents.RECEIVE_MESSAGE, message);

      // Handle delivery status
      if (receiverOnline) {
        await this.chatService.markMessageAsDelivered(message.id);
        const receiverSocket = await this.redisStore.getUser(payload.receiverId);
        if (receiverSocket) {
          this.server.to(receiverSocket.socketId).emit(ChatEvents.MESSAGE_DELIVERED, {
            messageId: message.id,
          });
        }
      }
    } catch (error) {
      this.logger.error('Error sending message:', error);
      client.emit('error', { message: 'Failed to send message' });
    }
  }
}