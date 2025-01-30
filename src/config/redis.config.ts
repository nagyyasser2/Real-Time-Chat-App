import { createClient } from 'redis';

export const redisConfig = {
    createClients: () => ({
        pubClient: createClient({ url: 'redis://localhost:6379' }),
        subClient: createClient({ url: 'redis://localhost:6379' }).duplicate()
    })
};