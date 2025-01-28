import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import {
  Participant,
  ParticipantDocument,
} from './schemas/participant.schema';

@Injectable()
export class ParticipantsRepository {
  constructor(
    @InjectModel(Participant.name)
    private readonly participantModel: Model<ParticipantDocument>,
  ) { }
  // Add this method
  async find(filter: FilterQuery<Participant>): Promise<ParticipantDocument[]> {
    return this.participantModel.find(filter).exec();
  }

  async findById(id: Types.ObjectId | string): Promise<ParticipantDocument | null> {
    return this.participantModel.findById(id).exec();
  }

  async findByUserAndConversation(
    user: Types.ObjectId,
    conversation: Types.ObjectId,
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
    id: Types.ObjectId,
    updateData: Partial<Participant>,
  ): Promise<ParticipantDocument | null> {
    return this.participantModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  async deleteById(id: Types.ObjectId): Promise<ParticipantDocument | null> {
    return this.participantModel.findByIdAndDelete(id).exec();
  }
}
