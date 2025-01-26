import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
export type ConversationDocument = HydratedDocument<Conversation>;

export enum ConversationType {
    PRIVATE = 'private',
    GROUP = 'group',
    CHANNEL = 'channel',
}

@Schema({ timestamps: true })
export class Conversation {
    @Prop({
        required: true,
        enum: ConversationType,
        type: String,
    })
    type: ConversationType;

    @Prop()
    name?: string;

    @Prop()
    description?: string;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    creator?: User;

    @Prop({ default: false })
    isBroadcast?: boolean;

    @Prop()
    avatar?: string;

    @Prop({ type: Types.ObjectId, ref: 'Message' })
    lastMessage?: Types.ObjectId;

    @Prop({ default: 0 })
    participantCount?: number;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);