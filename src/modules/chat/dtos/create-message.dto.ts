import { Types } from "mongoose";
import { MessageType } from "../../chat/enums/message-type.enum";
import { MessageStatus } from "../../chat/enums/message-status.enum";

export class CreateMessageDto {
  conversationId: Types.ObjectId; // Keep as string for validation
  senderId: Types.ObjectId;
  content: {
    text?: string;
    media?: Array<{
      url: string;
      type: string;
      caption?: string;
    }>;
  };
  type: MessageType;
  status?: MessageStatus; // Optional, defaults to DELIVERED in schema
  parentMessageId?: string;
  reactions?: Array<{ user: string; emoji: string }>;
  metadata?: {
    forwarded?: boolean;
    forwardedFrom?: string;
  };
  timestamp?: Date; // Optional, defaults to Date.now in schema
  isDeleted?: boolean; // Optional, defaults to false in schema
  editedAt?: Date | null; // Optional, defaults to null in schema
}
