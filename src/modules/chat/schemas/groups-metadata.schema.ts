import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { JoinSettings } from '../enums/join-settings.enum';
import { User } from '../../users/schemas/user.schema';

export type GroupsMetadataDocument = HydratedDocument<GroupsMetadata>;

@Schema({ timestamps: true, autoIndex: true })
export class GroupsMetadata {
  @Prop({
    required: true,
    unique: true,
    type: Types.ObjectId,
    ref: 'Conversation',
  })
  conversation: Types.ObjectId;

  @Prop({
    required: true,
    type: String,
  })
  type: string;

  @Prop({ type: String, unique: true, required: true })
  name: string;

  @Prop({ type: String, default: null })
  description?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  creator: Types.ObjectId;

  @Prop({ type: String, default: null })
  avatar?: string;

  @Prop({ type: Types.ObjectId, ref: 'Message' })
  lastMessage?: Types.ObjectId;

  @Prop({ default: 0 })
  participantCount?: number;

  @Prop({
    required: true,
    enum: [JoinSettings.OPEN, JoinSettings.APPROVAL],
    default: JoinSettings.OPEN,
  })
  joinSettings: string;

  @Prop({ required: false, type: String })
  announcement?: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }] })
  bannedUsers?: Types.ObjectId[];

  @Prop({ default: false, type: Boolean })
  adminOnlyPosts?: boolean;
}

export const GroupsMetadataSchema =
  SchemaFactory.createForClass(GroupsMetadata);
