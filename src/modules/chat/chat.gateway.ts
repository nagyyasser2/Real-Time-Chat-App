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
import { Logger, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RedisStoreService } from './services/redis-store.service';
import { ChatEvents } from './chat.events';
import { CreateConversationDto } from './dtos/create-conversation.dto';
import { SendMessageDto } from './dtos/send-message.dto';
import { ChatService } from './services/chat.service';

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
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async afterInit(): Promise<void> {
    this.chatService.setServer(this.server);
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
        client.data = { userId };

        this.redisStore.addUser(userId, client.id);
        await this.chatService.handleUserConnect(userId, client);
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
      await this.chatService.handleUserDisconnect(userId);
      client.leave(userId);
      this.redisStore.removeUser(userId);
    }
  }

  protected getUserIdFromSocket(client: Socket): string | null {
    return client.data?.userId || null;
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

    await this.chatService.sendMessage(senderId, payload, client);
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

    await this.chatService.handleTypingStatus(senderId, payload, true, client);
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

    await this.chatService.handleTypingStatus(senderId, payload, false, client);
  }

  @SubscribeMessage(ChatEvents.READ_CONVERSATION)
  async handleConversationRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string; senderId: string },
  ): Promise<void> {
    const userId = this.getUserIdFromSocket(client);
    if (!userId) {
      client.emit(ChatEvents.ERROR, { message: 'Unauthorized' });
      return;
    }

    await this.chatService.markConversationMessagesAsRead(
      userId,
      payload,
      client,
    );
  }

  @SubscribeMessage(ChatEvents.LAST_SEEN)
  async handleLastSeen(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { userId: string },
  ) {
    const requestingUserId = this.getUserIdFromSocket(client);
  
    if (!requestingUserId) {
      client.emit(ChatEvents.ERROR, { message: 'Unauthorized' });
      return;
    }
  
    try {
      const result = await this.chatService.handleLastSeen(requestingUserId, payload.userId);
      client.emit(ChatEvents.LAST_SEEN, { lastSeen: result });
    } catch (error) {
      client.emit(ChatEvents.ERROR, { message: 'Failed to retrieve last seen status' });
    }
  }
}
