import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Participant,
  ParticipantDocument,
} from '../schemas/participant.schema';

@Injectable()
export class ParticipantsRepository {
  constructor(
    @InjectModel(Participant.name)
    private readonly participantModel: Model<ParticipantDocument>,
  ) {}

  async findByUserAndConversation(
    user: string,
    conversation: string,
  ): Promise<ParticipantDocument | null> {
    return this.participantModel.findOne({ user, conversation }).exec();
  }

  async create(
    participant: Partial<Participant>,
  ): Promise<ParticipantDocument> {
    const newParticipant = new this.participantModel(participant);
    return newParticipant.save();
  }

  async updateById(
    id: string,
    updateData: Partial<Participant>,
  ): Promise<ParticipantDocument | null> {
    return this.participantModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  async deleteById(id: string): Promise<ParticipantDocument | null> {
    return this.participantModel.findByIdAndDelete(id).exec();
  }
}
