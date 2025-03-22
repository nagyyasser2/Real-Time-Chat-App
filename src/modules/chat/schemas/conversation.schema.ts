import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ConversationDocument = HydratedDocument<Conversation>;

@Schema({ timestamps: true, autoIndex: true })
export class Conversation {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  participant1: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  participant2: Types.ObjectId;

  @Prop({ type: String,  required: true })
  conversationKey: string;

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

// Middleware to generate a unique conversationKey before saving
ConversationSchema.pre('validate', function (next) {
  const ids = [this.participant1.toString(), this.participant2.toString()].sort();
  this.conversationKey = `${ids[0]}_${ids[1]}`;
  next();
});

// Indexes for efficient queries
ConversationSchema.index({ conversationKey: 1 }, { unique: true });
ConversationSchema.index({ lastActivityAt: -1 });
ConversationSchema.index({ isActive: 1 });
