import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { ConversationType } from '../enums/conv-type.enum';
export type ConversationDocument = HydratedDocument<Conversation>;

@Schema({ timestamps: true, autoIndex: true })
export class Conversation {
  @Prop({
    required: true,
    enum: ConversationType,
    type: String,
  })
  type: ConversationType;

  @Prop({ type: String, unique: true, required: true })
  name?: string;

  @Prop({ type: String, default: null })
  description?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  creator?: User;

  @Prop({ default: false })
  isBroadcast?: boolean;

  @Prop({ type: String, default: null })
  avatar?: string;

  @Prop({ type: Types.ObjectId, ref: 'Message' })
  lastMessage?: Types.ObjectId;

  @Prop({ default: 0 })
  participantCount?: number;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
