import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ObjectId } from 'mongoose';

export type ParticipantDocument = HydratedDocument<Participant>;

@Schema({ timestamps: true })
export class Participant {
    @Prop({ required: true, type: Types.ObjectId, ref: 'conversations' })
    conversation: ObjectId;

    @Prop({ required: true, type: Types.ObjectId, ref: 'users' })
    user: ObjectId;

    @Prop({ enum: ['member', 'admin', 'owner'], default: 'member' })
    role: string;

    @Prop({ default: Date.now })
    joinedAt: Date;

    @Prop({ required: false })
    mutedUntil?: Date; // Muted notifications until a specific date

    @Prop({ type: Types.ObjectId, ref: 'messages' })
    lastReadMessage?: ObjectId; // Last read message reference

    @Prop({
        type: {
            mute: { type: Boolean, default: false }, // Mute notifications for the conversation
            customSound: { type: String, required: false }, // Custom notification sound
        },
    })
    customNotifications?: {
        mute: boolean;
        customSound?: string;
    };
}

export const ParticipantSchema = SchemaFactory.createForClass(Participant);
