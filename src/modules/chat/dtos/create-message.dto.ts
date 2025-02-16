import { Types } from "mongoose";
import { MessageType } from "../../chat/enums/message-type.enum";

export class CreateMessageDto {
    conversationId: string; // Keep as string for validation
    senderId: string;
    content: {
        text?: string;
        media?: Array<{
            url: string;
            type: string;
            caption?: string;
        }>;
    };
    type: MessageType;
    parentMessageId?: string;
    metadata?: {
        forwarded?: boolean;
        forwardedFrom?: string;
    };
}
