import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery, ProjectionType, QueryOptions, Types, UpdateQuery } from 'mongoose';
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
  async findById(
    id: Types.ObjectId,
    projection?: ProjectionType<Conversation>,
  ): Promise<ConversationDocument | null> {
    return this.conversationModel.findById(id, projection).exec();
  }

  async findOne(
    filter: FilterQuery<Conversation>,
    projection?: ProjectionType<Conversation>,
    options?: QueryOptions,
  ): Promise<ConversationDocument | null> {
    return this.conversationModel.findOne(filter, projection, options).exec();
  }

  async findActiveConversation(
    participant1Id: Types.ObjectId,
    participant2Id: Types.ObjectId,
  ): Promise<ConversationDocument | null> {
    const [sortedParticipant1, sortedParticipant2] = [participant1Id, participant2Id].sort();
    return this.conversationModel.findOne({
      participant1: sortedParticipant1,
      participant2: sortedParticipant2,
      isActive: true,
    }).exec();
  }

  async findUserConversations(
    userId: Types.ObjectId,
    isArchived: boolean = false,
  ): Promise<ConversationDocument[]> {
    return this.conversationModel.find({
      $or: [{ participant1: userId }, { participant2: userId }],
      isActive: true,
      isArchived,
    })
      .sort({ lastActivityAt: -1 })
      .exec();
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

  async updateOne(
    filter: FilterQuery<Conversation>,
    update: UpdateQuery<Conversation>,
    options: QueryOptions = { new: true }
  ): Promise<ConversationDocument | null> {
    return this.conversationModel
      .findOneAndUpdate(filter, update, options)
      .exec();
  }

  async updateLastMessage(
    conversationId: Types.ObjectId,
    messageId: Types.ObjectId,
  ): Promise<ConversationDocument | null> {
    return this.conversationModel
      .findByIdAndUpdate(
        conversationId,
        {
          lastMessage: messageId,
          lastActivityAt: new Date(),
          $inc: { messageCount: 1 },
        },
        { new: true },
      )
      .exec();
  }

  async markAsRead(
    conversationId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<ConversationDocument | null> {
    return this.conversationModel
      .findByIdAndUpdate(
        conversationId,
        {
          $set: { [`lastReadAt.${userId}`]: new Date() },
        },
        { new: true },
      )
      .exec();
  }

  async blockConversation(
    conversationId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<ConversationDocument | null> {
    return this.conversationModel
      .findByIdAndUpdate(
        conversationId,
        {
          $addToSet: { blockedBy: userId },
        },
        { new: true },
      )
      .exec();
  }

  async unblockConversation(
    conversationId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<ConversationDocument | null> {
    return this.conversationModel
      .findByIdAndUpdate(
        conversationId,
        {
          $pull: { blockedBy: userId },
        },
        { new: true },
      )
      .exec();
  }

  async archiveConversation(
    conversationId: Types.ObjectId,
  ): Promise<ConversationDocument | null> {
    return this.conversationModel
      .findByIdAndUpdate(
        conversationId,
        {
          isArchived: true,
          lastActivityAt: new Date(),
        },
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
        .sort(sort || { lastActivityAt: -1 })
        .exec(),
      this.conversationModel.countDocuments(filter).exec(),
    ]);

    return { data, total };
  }

  // Utility methods
  async isParticipant(
    conversationId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<boolean> {
    const count = await this.conversationModel.countDocuments({
      _id: conversationId,
      $or: [{ participant1: userId }, { participant2: userId }],
    }).exec();
    return count > 0;
  }

  async isBlocked(
    conversationId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<boolean> {
    const count = await this.conversationModel.countDocuments({
      _id: conversationId,
      blockedBy: userId,
    }).exec();
    return count > 0;
  }
}