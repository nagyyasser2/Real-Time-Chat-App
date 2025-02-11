export interface UserPresence {
    userId: string;
    status: 'online' | 'offline' | 'away';
    lastActive: Date;
    deviceInfo?: {
        client: string;
        version: string;
        os: string;
    };
}