export const EVENTS = {
    USER: {
        CONNECTED: 'user:connected',
        DISCONNECTED: 'user:disconnected',
        PRESENCE_CHANGED: 'user:presence_changed',
        TYPING: 'user:typing',
        STOP_TYPING: 'user:stop_typing',
    },
    MESSAGE: {
        SEND: 'message:send',
        RECEIVED: 'message:received',
        DELIVERED: 'message:delivered',
        READ: 'message:read',
        FAILED: 'message:failed',
    },
    CHAT: {
        JOIN: 'chat:join',
        LEAVE: 'chat:leave',
        MEMBER_JOINED: 'chat:member_joined',
        MEMBER_LEFT: 'chat:member_left',
    },
} as const;