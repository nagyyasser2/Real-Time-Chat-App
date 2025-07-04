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
import { ChatService } from './services/chat.service';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';

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
        await this.chatService.notifyContactsWithUserStatus(userId, true);
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

  @SubscribeMessage(ChatEvents.TYPING)
  async handleStartTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: { chatId: string; receiverId: string; isTyping: boolean },
  ): Promise<void> {
    const senderId = this.getUserIdFromSocket(client);
    if (!senderId) {
      client.emit(ChatEvents.ERROR, { message: 'Unauthorized' });
      return;
    }

    await this.chatService.handleTypingStatus(
      senderId,
      payload,
      payload.isTyping,
      client,
    );
  }

  @SubscribeMessage(ChatEvents.READ_CONVERSATION)
  async handleConversationRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string; receiverId: string },
  ): Promise<any> {
    const userId = this.getUserIdFromSocket(client);
    if (!userId) {
      client.emit(ChatEvents.ERROR, { message: 'Unauthorized' });
      return;
    }

    try {
      const result = await this.chatService.markMessagesAsRead(
        payload.conversationId,
        userId,
      );

      // Emit success event back to the client
      client.emit(ChatEvents.READ_CONVERSATION_SUCCESS, {
        conversationId: payload.conversationId,
        modifiedCount: result.modifiedCount,
      });

      // Notify other users in the conversation
      this.server.to(payload.receiverId).emit(ChatEvents.MESSAGES_READ, {
        conversationId: payload.conversationId,
        userId: userId,
      });
    } catch (error) {
      this.logger.error(`Error marking messages as read: ${error.message}`);
      client.emit(ChatEvents.ERROR, {
        message: 'Failed to mark messages as read',
        conversationId: payload.conversationId,
      });
    }
  }

  @SubscribeMessage(ChatEvents.USER_STATUS_CHECK)
  async handleCheckUserStatus(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { userId: string },
  ): Promise<any> {
    const userId = this.getUserIdFromSocket(client);
    if (!userId) {
      client.emit(ChatEvents.ERROR, { message: 'Unauthorized' });
      return;
    }

    try {
      const userOnline = await this.redisStore.isUserOnline(payload.userId);

      client.emit(ChatEvents.USER_STATUS_UPDATE, {
        userId: payload.userId,
        status: userOnline,
      });
    } catch (error) {
      this.logger.error(`Error marking messages as read: ${error.message}`);
    }
  }

  @SubscribeMessage(ChatEvents.READ_MESSAGE)
  async handleReadMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: { messageId: string; receiverId: string; conversationId: string },
  ) {
    await this.chatService.markMessageAsRead(payload.messageId);
    client.emit(ChatEvents.MESSAGE_READ_SUCCESS);

    this.server.to(payload.receiverId).emit(ChatEvents.MESSAGE_READ, {
      messageId: payload.messageId,
      conversationId: payload.conversationId,
    });
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
      const result = await this.chatService.handleLastSeen(
        requestingUserId,
        payload.userId,
      );
      client.emit(ChatEvents.LAST_SEEN, { lastSeen: result });
    } catch (error) {
      client.emit(ChatEvents.ERROR, {
        message: 'Failed to retrieve last seen status',
      });
    }
  }

  @SubscribeMessage(ChatEvents.UPDATE_BLOCK_STATUS)
  async handleUpdateBlockStatus(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
    @CurrentUser() user: any,
  ) {
    const senderId = this.getUserIdFromSocket(client);
    if (!senderId) {
      client.emit(ChatEvents.ERROR, { message: 'Unauthorized' });
      return;
    }
    const { conversationId, receiverId, blockStatus } = payload;

    const canSendMessages = blockStatus.canSendMessages;

    const updatedBlockedStatusForReceiver = {
      isBlockedByMe: canSendMessages ? false : !blockStatus.isBlockedByMe,
      isBlockedByOther: canSendMessages ? false : !blockStatus.isBlockedByOther,
      canSendMessages: canSendMessages,
    };

    this.server.to(receiverId.toString()).emit(ChatEvents.UPDATE_BLOCK_STATUS, {
      conversationId,
      blockStatus: updatedBlockedStatusForReceiver,
    });

    // this.server.to(senderId.toString()).emit(ChatEvents.UPDATE_BLOCK_STATUS, {
    //   conversationId,
    //   blockStatus,
    // });
  }
}
