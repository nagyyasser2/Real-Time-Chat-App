import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ObjectId } from 'mongoose';

export type ChannelsMetadataDocument = HydratedDocument<ChannelsMetadata>;

@Schema({ timestamps: true })
export class ChannelsMetadata {
    @Prop({ required: true, unique: true, type: Types.ObjectId, ref: 'conversations' })
    conversation: ObjectId;

    @Prop({ default: false })
    verified?: boolean; // Indicates if the channel is verified

    @Prop({ default: 0 })
    subscriberCount?: number; // Cached subscriber count

    @Prop({ type: [{ type: Types.ObjectId, ref: 'messages' }] })
    broadcastHistory?: ObjectId[]; // List of broadcast messages

    @Prop({
        type: {
            views: { type: Number, default: 0 }, // Total views
            shares: { type: Number, default: 0 }, // Total shares
        },
    })
    analytics?: {
        views: number;
        shares: number;
    };
}

export const ChannelsMetadataSchema = SchemaFactory.createForClass(ChannelsMetadata);
