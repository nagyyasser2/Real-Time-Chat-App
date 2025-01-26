import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ObjectId } from 'mongoose';
import { ParticipantRole } from '../enums/participant-role.enum';

export type ParticipantDocument = HydratedDocument<Participant>;

@Schema({ timestamps: true, autoIndex: true })
export class Participant {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Conversation' })
  conversation: ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  user: ObjectId;

  @Prop({
    type: String,
    enum: [
      ParticipantRole.ADMIN,
      ParticipantRole.MEMBER,
      ParticipantRole.OWNER,
    ],
    default: ParticipantRole.MEMBER,
  })
  role: string;

  @Prop({ default: Date.now })
  joinedAt: Date;

  @Prop({ required: false })
  mutedUntil?: Date;

  @Prop({ type: Types.ObjectId, ref: 'Message' })
  lastReadMessage?: ObjectId;

  @Prop({
    type: {
      mute: { type: Boolean, default: false },
      customSound: { type: String, required: false },
    },
  })
  customNotifications?: {
    mute: boolean;
    customSound?: string;
  };
}

export const ParticipantSchema = SchemaFactory.createForClass(Participant);
