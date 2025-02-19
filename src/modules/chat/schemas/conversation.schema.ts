import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ConversationDocument = HydratedDocument<Conversation>;

@Schema({ timestamps: true, autoIndex: true })
export class Conversation {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  participant1: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  participant2: Types.ObjectId;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: Date })
  lastActivityAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'Message' })
  lastMessage?: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }] })
  blockedBy: Types.ObjectId[];

  @Prop({ type: Map, of: Date })
  lastReadAt: Map<string, Date>;

  @Prop({ type: Boolean, default: false })
  isArchived: boolean;

  @Prop({ type: Number, default: 0 })
  messageCount: number;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);

// Indexes for common queries
ConversationSchema.index({ participant1: 1, participant2: 1 }, { unique: true });
ConversationSchema.index({ lastActivityAt: -1 });
ConversationSchema.index({ isActive: 1 });