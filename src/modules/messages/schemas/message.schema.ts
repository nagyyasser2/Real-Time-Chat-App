import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ObjectId } from 'mongoose';
import { MessageType } from '../enums/message-type.enum';
import { MessageStatus } from '../enums/message-status.enum';

export type MessageDocument = HydratedDocument<Message>;

@Schema({ timestamps: true, autoIndex: true })
export class Message {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Conversation' })
  conversation: ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  sender: ObjectId;

  //   @Prop({
  //     required: true,
  //     type: Object,
  //     validate: {
  //       validator: (value: any) => {
  //         return (
  //           typeof value.text === 'string' ||
  //           (Array.isArray(value.media) &&
  //             value.media.every(
  //               (item) =>
  //                 typeof item.url === 'string' && typeof item.type === 'string',
  //             ))
  //         );
  //       },
  //       message: 'Content should be either text or media',
  //     },
  //   })
  //   content: {
  //     text?: string;
  //     media?: Array<{
  //       url: string;
  //       type: string;
  //       caption?: string;
  //     }>;
  //   };

  @Prop({
    required: true,
    type: Object,
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
  parentMessage?: ObjectId;

  @Prop({
    type: [
      {
        user: { type: Types.ObjectId, required: true, ref: 'User' },
        emoji: String,
      },
    ],
  })
  reactions?: Array<{ user: ObjectId; emoji: string }>;

  @Prop({
    type: {
      forwarded: Boolean,
      forwardedFrom: Types.ObjectId,
    },
  })
  metadata?: {
    forwarded?: boolean;
    forwardedFrom?: ObjectId;
  };

  @Prop({ default: Date.now })
  timestamp: Date;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ type: Date, default: null })
  editedAt?: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
