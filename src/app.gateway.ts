import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsAuthGuard } from './modules/chat/guards/ws-auth.guard';
import { RedisStoreService } from './modules/chat/services/redis-store.service';

@UseGuards(WsAuthGuard)
export abstract class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    protected server: Server;

    constructor(protected readonly redisStoreService: RedisStoreService) { }

    async handleConnection(client: Socket): Promise<void> {
        const userId = this.getUserIdFromSocket(client);
        if (userId) {
            client.join(userId);
            this.redisStoreService.addUser(userId, client.id);
            await this.handleUserConnect(userId, client);
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
        return client.handshake.auth.userId || null;
    }

    protected abstract handleUserConnect(userId: string, client: Socket): Promise<void>;
    protected abstract handleUserDisconnect(userId: string): Promise<void>;
}