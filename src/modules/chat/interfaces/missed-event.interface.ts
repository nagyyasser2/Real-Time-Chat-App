export interface MissedEvent {
    eventName: string;
    payload: any;
    timestamp: number;
    conversationId?: string;
}