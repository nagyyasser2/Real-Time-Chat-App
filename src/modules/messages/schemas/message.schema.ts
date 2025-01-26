import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ObjectId } from 'mongoose';

export type MessageDocument = HydratedDocument<Message>;

@Schema({ timestamps: true })
export class Message {
    @Prop({ required: true, type: Types.ObjectId, ref: 'conversations' })
    conversation: ObjectId;

    @Prop({ required: true, type: Types.ObjectId, ref: 'users' })
    sender: ObjectId;

    @Prop({
        required: true,
        type: Object,
        validate: {
            validator: (value: any) => {
                return typeof value.text === 'string' || (Array.isArray(value.media) && value.media.every(item => typeof item.url === 'string' && typeof item.type === 'string'));
            },
            message: 'Content should be either text or media'
        }
    })
    content: {
        text?: string; // Message text content
        media?: Array<{
            url: string; // Media file URL
            type: string; // 'image', 'video', 'document'
            caption?: string; // Optional media caption
        }>;
    };

    @Prop({ required: true, enum: ['text', 'media', 'system'] })
    type: string;

    @Prop({ default: Date.now })
    timestamp: Date;

    @Prop({ enum: ['sent', 'delivered', 'read'], default: 'sent' })
    status: string;

    @Prop({ default: false })
    deleted: boolean;

    @Prop()
    editedAt?: Date; // Timestamp for message edits

    @Prop({ type: Types.ObjectId, ref: 'messages' })
    parentMessage?: ObjectId; // For replies/threads

    @Prop({
        type: [{
            user: { type: Types.ObjectId, ref: 'users' },
            emoji: String // Emoji reaction
        }]
    })
    reactions?: Array<{ user: ObjectId; emoji: string }>;

    @Prop({
        type: {
            forwarded: Boolean, // Whether the message was forwarded
            forwardedFrom: Types.ObjectId // Original sender reference
        }
    })
    metadata?: {
        forwarded?: boolean;
        forwardedFrom?: ObjectId;
    };
}

export const MessageSchema = SchemaFactory.createForClass(Message);
