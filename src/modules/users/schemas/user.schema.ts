import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { LastSeenVisibility } from '../enums/lastSeenVisibility.enum';
import { PhotoVisibility } from '../enums/profile-photo.enum';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true, autoIndex: true })
export class User {
  @Prop({ type: String, required: true, unique: true })
  phoneNumber: string;

  @Prop({ type: String, required: true, unique: true })
  username: string;

  @Prop({ type: String })
  profilePic?: string;

  @Prop({ type: String, default: null })
  status?: string;

  @Prop({ type: String, default: null })
  lastSeen?: Date;

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
}

export const UserSchema = SchemaFactory.createForClass(User);
