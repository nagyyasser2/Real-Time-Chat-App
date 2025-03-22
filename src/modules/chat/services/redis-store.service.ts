import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { SocketUser } from '../interfaces/socket-user.interface';
import { MissedEvent } from '../interfaces/missed-event.interface';
import { redisConfig } from 'src/config/redis.config';

@Injectable()
export class RedisStoreService implements OnModuleInit, OnModuleDestroy {
    private readonly redis: Redis;
    private readonly redisSub: Redis;
    private readonly redisPub: Redis;

    constructor() {
        this.redis = new Redis(redisConfig);
        this.redisSub = new Redis(redisConfig);
        this.redisPub = new Redis(redisConfig);
    }

    async onModuleInit() {
        // Remove all online users from Redis on startup
        const keys = await this.redis.keys('socket:user:*');
        if (keys.length > 0) {
            await this.redis.del(...keys);
        }
    }

    async onModuleDestroy() {
        await this.redis.quit();
        await this.redisSub.quit();
        await this.redisPub.quit();
    }

    private getSocketKey(userId: string): string {
        return `socket:user:${userId}`;
    }

    private getMissedEventsKey(userId: string): string {
        return `missed:events:${userId}`;
    }

    private getChatMembersKey(chatId: string): string {
        return `chat:members:${chatId}`;
    }

    async addUser(userId: string, socketId: string): Promise<void> {
        const userData: SocketUser = { userId, socketId };
        await this.redis.set(
            this.getSocketKey(userId),
            JSON.stringify(userData),
            'EX',
            24 * 60 * 60 // 24 hours expiry
        );
    }

    async removeUser(userId: string): Promise<void> {
        await this.redis.del(this.getSocketKey(userId));
    }

    async getUser(userId: string): Promise<SocketUser | null> {
        const userData = await this.redis.get(this.getSocketKey(userId));
        return userData ? JSON.parse(userData) : null;
    }

    async isUserOnline(userId: string): Promise<boolean> {
        return await this.redis.exists(this.getSocketKey(userId)) === 1;
    }

    async addUserToChat(chatId: string, userId: string): Promise<void> {
        await this.redis.sadd(this.getChatMembersKey(chatId), userId);
    }

    async removeUserFromChat(chatId: string, userId: string): Promise<void> {
        await this.redis.srem(this.getChatMembersKey(chatId), userId);
    }

    async getChatMembers(chatId: string): Promise<string[]> {
        return await this.redis.smembers(this.getChatMembersKey(chatId));
    }

    async storeMissedEvent(userId: string, event: MissedEvent): Promise<void> {
        await this.redis.lpush(
            this.getMissedEventsKey(userId),
            JSON.stringify(event)
        );
        // Keep only last 100 missed events per user
        await this.redis.ltrim(this.getMissedEventsKey(userId), 0, 99);
        // Set expiry for missed events (7 days)
        await this.redis.expire(this.getMissedEventsKey(userId), 7 * 24 * 60 * 60);
    }

    async getMissedEvents(userId: string): Promise<MissedEvent[]> {
        const events = await this.redis.lrange(this.getMissedEventsKey(userId), 0, -1);
        return events.map(event => JSON.parse(event));
    }

    async clearMissedEvents(userId: string): Promise<void> {
        await this.redis.del(this.getMissedEventsKey(userId));
    }

    // Pub/Sub methods for cross-instance communication
    async publish(channel: string, message: any): Promise<void> {
        await this.redisPub.publish(channel, JSON.stringify(message));
    }

    async subscribe(channel: string, callback: (message: any) => void): Promise<void> {
        await this.redisSub.subscribe(channel);
        this.redisSub.on('message', (receivedChannel, message) => {
            if (receivedChannel === channel) {
                callback(JSON.parse(message));
            }
        });
    }
}
