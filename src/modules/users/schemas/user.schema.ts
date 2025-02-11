import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { LastSeenVisibility } from '../enums/lastSeenVisibility.enum';
import { PhotoVisibility } from '../enums/profile-photo.enum';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true, autoIndex: true })
export class User {
  _id: string;

  @Prop({ type: String, required: true, unique: true })
  phoneNumber: string;

  @Prop({ type: String, required: true, unique: true })
  username: string;

  @Prop({ type: String, required: true })
  password: string;

  @Prop({ type: String })
  profilePic?: string;

  @Prop({ type: String, default: null })
  status?: string;

  @Prop({ type: String, default: null })
  lastSeen?: Date;

  @Prop({ type: String, default: null })
  refreshToken: string;

  @Prop({
    type: {
      lastSeenVisibility: {
        type: String,
        enum: LastSeenVisibility,
        default: LastSeenVisibility.Everyone,
      },
      profilePhotoVisibility: {
        type: String,
        enum: PhotoVisibility,
        default: PhotoVisibility.Everyone,
      },
    },
    _id: false,
  })
  privacySettings?: {
    lastSeenVisibility?: LastSeenVisibility;
    profilePhotoVisibility?: PhotoVisibility;
  };

  @Prop({
    type: [
      {
        contactUser: { type: Types.ObjectId, ref: 'User', required: true },
        assignedConversation: { type: Types.ObjectId, ref: 'Conversation', required: true },
        blocked: { type: Boolean, default: false },
      },
    ],
    default: [],
  })
  contacts: Array<{
    contactUser: Types.ObjectId;
    assignedConversation: Types.ObjectId;
    blocked: boolean;
  }>;
}

export const UserSchema = SchemaFactory.createForClass(User);
