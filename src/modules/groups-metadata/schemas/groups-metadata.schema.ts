import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Types } from 'mongoose';
import { JoinSettings } from '../enums/join-settings.enum';

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
