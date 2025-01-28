import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ObjectId } from 'mongoose';

export type ChannelsMetadataDocument = HydratedDocument<ChannelsMetadata>;

@Schema({ timestamps: true, autoIndex: true })
export class ChannelsMetadata {
  @Prop({
    required: true,
    unique: true,
    type: Types.ObjectId,
    ref: 'Conversation',
  })
  conversation: Types.ObjectId;

  @Prop({ default: false, type: Boolean })
  verified?: boolean;

  @Prop({ default: 0, type: Number })
  subscriberCount?: number;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Message' }] })
  broadcastHistory?: Types.ObjectId[];

  @Prop({
    type: {
      views: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
    },
  })
  analytics?: {
    views: number;
    shares: number;
  };
}

export const ChannelsMetadataSchema =
  SchemaFactory.createForClass(ChannelsMetadata);
