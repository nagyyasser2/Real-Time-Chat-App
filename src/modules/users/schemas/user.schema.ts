import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
    @Prop({ required: true, unique: true })
    phoneNumber: string;

    @Prop()
    username?: string;

    @Prop()
    profilePic?: string;

    @Prop()
    status?: string;

    @Prop()
    lastSeen?: Date;

    @Prop({
        type: {
            lastSeenVisibility: String, // 'everyone', 'contacts', 'nobody'
            profilePhotoVisibility: String,
        },
        _id: false
    })
    privacySettings?: {
        lastSeenVisibility: string;
        profilePhotoVisibility: string;
    };
}

export const UserSchema = SchemaFactory.createForClass(User);