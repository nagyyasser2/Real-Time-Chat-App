import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ObjectId } from 'mongoose';
import { MessageType } from '../enums/message-type.enum';
import { MessageStatus } from '../enums/message-status.enum';

export type MessageDocument = HydratedDocument<Message>;

@Schema({ timestamps: true, autoIndex: true })
export class Message {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Conversation' })
  conversationId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  senderId: Types.ObjectId;

  @Prop({
    required: true,
    type: Types.ObjectId,
  })
  content: {
    text?: string;
    media?: Array<{
      url: string;
      type: string;
      caption?: string;
    }>;
  };

  @Prop({
    required: true,
    enum: [MessageType.TEXT, MessageType.MEDIA, MessageType.SYSTEM],
    default: MessageType.TEXT,
  })
  type: string;

  @Prop({
    enum: [MessageStatus.DELIVERED, MessageStatus.READ, MessageStatus.SENT],
    default: MessageStatus.DELIVERED,
  })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'Message' })
  parentMessageId?: Types.ObjectId;

  @Prop({
    type: [
      {
        user: { type: Types.ObjectId, required: true, ref: 'User' },
        emoji: String,
      },
    ],
  })
  reactions?: Array<{ user: Types.ObjectId; emoji: string }>;

  @Prop({
    type: {
      forwarded: Boolean,
      forwardedFrom: Types.ObjectId,
    },
  })
  metadata?: {
    forwarded?: boolean;
    forwardedFrom?: Types.ObjectId;
  };

  @Prop({ default: Date.now })
  timestamp: Date;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ type: Date, default: null })
  editedAt?: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
