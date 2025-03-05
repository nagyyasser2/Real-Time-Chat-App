import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { RedisStoreService } from './modules/chat/services/redis-store.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export abstract class AppGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger();

  @WebSocketServer()
  protected server: Server;

  constructor(
    protected readonly redisStoreService: RedisStoreService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    const userId = await this.authenticateClient(client);
    if (userId) {
      client.data = { userId };

      await this.onClientAuthenticated(client, userId);
    } else {
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket): Promise<void> {
    const userId = this.getUserIdFromSocket(client);
    if (userId) {
      client.leave(userId);
      this.redisStoreService.removeUser(userId);
      await this.handleUserDisconnect(userId);
    }
  }

  protected getUserIdFromSocket(client: Socket): string | null {
    return client.data?.userId || null;
  }

  // Common methods
  protected async authenticateClient(client: Socket): Promise<string | null> {
    try {
      const authHeader = client.handshake.headers.authorization;
      const token =
        client.handshake.auth?.token ||
        (authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null);

      if (!token) {
        this.logger.error('Authentication token not provided');
        client.disconnect();
        return null;
      }

      try {
        const payload = await this.jwtService.verifyAsync(token, {
          secret: this.configService.get('jwt')?.secret,
        });

        const userId = payload.sub;
        client.data = { userId };

        // Now proceed with the regular connection flow
        this.redisStoreService.addUser(userId, client.id);
        // await this.handleUserConnect(userId, client);

        return userId;
      } catch (err) {
        this.logger.error('Invalid authentication token', err);
        client.disconnect();
        return null;
      }
    } catch (error) {
      this.logger.error('Connection error:', error);
      client.disconnect();
      return null;
    }
  }

  // Hook methods for child classes
  protected abstract onClientAuthenticated(
    client: Socket,
    userId: string,
  ): Promise<void>;
  protected abstract handleUserConnect(
    userId: string,
    client: Socket,
  ): Promise<void>;
  protected abstract handleUserDisconnect(userId: string): Promise<void>;
}
