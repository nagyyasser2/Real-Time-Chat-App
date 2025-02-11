export interface ChatMessage {
    id: string;
    chatId: string;
    senderId: string;
    content: string;
    type: 'text' | 'image' | 'file' | 'system';
    metadata?: Record<string, any>;
    replyTo?: string;
    createdAt: Date;
    updatedAt: Date;
    status: 'sent' | 'delivered' | 'read' | 'failed';
}