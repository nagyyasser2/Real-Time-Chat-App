import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Country } from './enums/countries.enum';
import { LastSeenVisibility } from './enums/lastSeenVisibility.enum';
import { PhotoVisibility } from './enums/profile-photo.enum';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true, autoIndex: true })
export class User {
  _id: string;

  @Prop({ type: String, required: true, unique: true })
  phoneNumber: string;

  @Prop({ type: String, required: true, unique: true })
  username: string;

  @Prop({ type: String, required: true, enum: Object.values(Country) }) // Use Enum
  country: Country;

  @Prop({ type: String, required: true })
  password: string;

  @Prop({
    type: String,
    default:
      'data:image/png;base64,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',
  })
  profilePic: string;

  @Prop({ type: String, default: 'foucs' })
  status: string;

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
        user: { type: Types.ObjectId, ref: 'User' },
        blocked: { type: Boolean, default: false },
        removedByContact: { type: Boolean, default: false }, // New field
      },
    ],
    default: [],
  })
  contacts: Array<{
    user: Types.ObjectId;
    blocked: boolean;
    removedByContact: boolean;
  }>;

  @Prop({
    type: [
      {
        room: { type: Types.ObjectId, ref: 'Room' },
        blocked: { type: Boolean, default: false },
      },
    ],
    default: [],
  })
  rooms: Array<{
    roomId: Types.ObjectId;
    blocked: boolean;
  }>;

  @Prop({
    type: [
      {
        channel: { type: Types.ObjectId, ref: 'Channel' },
        blocked: { type: Boolean, default: false },
      },
    ],
    default: [],
  })
  channels: Array<{
    channelId: Types.ObjectId;
    blocked: boolean;
  }>;
}

export const UserSchema = SchemaFactory.createForClass(User);
