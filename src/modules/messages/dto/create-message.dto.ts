import { Types } from "mongoose";
import { MessageType } from "../enums/message-type.enum";

// Typical CreateMessageDto
export class CreateMessageDto {
    conversation: Types.ObjectId;
    sender: Types.ObjectId;
    content: {
        text?: string;
        media?: Array<{
            url: string;
            type: string;
            caption?: string;
        }>;
    };
    type: MessageType;
    parentMessage?: Types.ObjectId;
    metadata?: {
        forwarded?: boolean;
        forwardedFrom?: Types.ObjectId;
    };
}

