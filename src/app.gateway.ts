import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UnauthorizedException } from '@nestjs/common';

import { RedisStoreService } from './modules/chat/services/redis-store.service';


export abstract class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    protected server: Server;

    constructor(protected readonly redisStoreService: RedisStoreService) {}

    async handleConnection(client: Socket): Promise<void> {
        const userId = this.getUserIdFromSocket(client);

        if (!userId) {
            throw new UnauthorizedException();
        }

        this.redisStoreService.addUser(userId, client.id);
        await this.handleUserConnect(userId, client);
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

    protected abstract handleUserConnect(userId: string, client: Socket): Promise<void>;
    protected abstract handleUserDisconnect(userId: string): Promise<void>;
}
