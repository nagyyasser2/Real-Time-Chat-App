import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Types } from 'mongoose';

export type GroupsMetadataDocument = HydratedDocument<GroupsMetadata>;

@Schema({ timestamps: true })
export class GroupsMetadata {
    @Prop({ required: true, unique: true, type: Types.ObjectId, ref: 'conversations' })
    conversation: Types.ObjectId;

    @Prop({ required: true, enum: ['open', 'approval'] })
    joinSettings: string;

    @Prop({ required: false })
    announcement?: string; // Pinned group announcement

    @Prop({ type: [{ type: Types.ObjectId, ref: 'users' }] })
    bannedUsers?: Types.ObjectId[]; // List of banned users

    @Prop({ default: false })
    adminOnlyPosts?: boolean; // Restrict posting to admins
}

export const GroupsMetadataSchema = SchemaFactory.createForClass(GroupsMetadata);
