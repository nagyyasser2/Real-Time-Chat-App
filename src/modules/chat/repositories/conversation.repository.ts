import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery, ProjectionType, QueryOptions, Types } from 'mongoose';
import { Conversation, ConversationDocument } from '../schemas/conversation.schema';

@Injectable()
export class ConversationRepository {
  constructor(
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<ConversationDocument>,
  ) { }

  // Create
  async create(conversation: Partial<Conversation>): Promise<ConversationDocument> {
    return this.conversationModel.create(conversation);
  }

  // Read
  async findById(id: Types.ObjectId): Promise<ConversationDocument | null> {
    return this.conversationModel.findById(id).exec();
  }

  async findOne(
    filter: FilterQuery<Conversation>,
    projection?: ProjectionType<Conversation>,
    options?: QueryOptions,
  ): Promise<ConversationDocument | null> {
    return this.conversationModel.findOne(filter, projection, options).exec();
  }

  async find(
    filter: FilterQuery<Conversation>,
    projection?: ProjectionType<Conversation>,
    options?: QueryOptions,
  ): Promise<ConversationDocument[]> {
    return this.conversationModel.find(filter, projection, options).exec();
  }

  // Update
  async updateById(
    id: Types.ObjectId,
    update: Partial<Conversation>,
  ): Promise<ConversationDocument | null> {
    return this.conversationModel
      .findByIdAndUpdate(id, update, { new: true })
      .exec();
  }

  // Delete
  async deleteById(id: Types.ObjectId): Promise<ConversationDocument | null> {
    return this.conversationModel.findByIdAndDelete(id).exec();
  }

  // Specific conversation operations
  async findByName(name: string): Promise<ConversationDocument | null> {
    return this.conversationModel.findOne({ name }).exec();
  }

  async incrementParticipantCount(
    id: Types.ObjectId,
    incrementBy = 1,
  ): Promise<ConversationDocument | null> {
    return this.conversationModel
      .findByIdAndUpdate(
        id,
        { $inc: { participantCount: incrementBy } },
        { new: true },
      )
      .exec();
  }

  async setLastMessage(
    conversationId: Types.ObjectId,
    messageId: Types.ObjectId,
  ): Promise<ConversationDocument | null> {
    return this.conversationModel
      .findByIdAndUpdate(
        conversationId,
        { lastMessage: messageId },
        { new: true },
      )
      .exec();
  }

  // Pagination support
  async findAllPaginated(
    filter: FilterQuery<Conversation>,
    skip: number,
    limit: number,
    sort?: Record<string, 1 | -1>,
  ): Promise<{ data: ConversationDocument[]; total: number }> {
    const [data, total] = await Promise.all([
      this.conversationModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .exec(),
      this.conversationModel.countDocuments(filter).exec(),
    ]);

    return { data, total };
  }

  // Utility methods
  async exists(filter: FilterQuery<Conversation>): Promise<boolean> {
    const count = await this.conversationModel.countDocuments(filter).exec();
    return count > 0;
  }
}