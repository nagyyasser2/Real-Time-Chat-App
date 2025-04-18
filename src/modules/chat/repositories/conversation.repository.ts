import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Model,
  FilterQuery,
  ProjectionType,
  QueryOptions,
  Types,
  UpdateQuery,
} from 'mongoose';
import {
  Conversation,
  ConversationDocument,
} from '../schemas/conversation.schema';
import { MessageStatus } from '../enums/message-status.enum';
import { MessageDocument } from '../schemas/message.schema';

@Injectable()
export class ConversationRepository {
  constructor(
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<ConversationDocument>,
  ) {}

  async create(
    conversation: Partial<Conversation>,
  ): Promise<ConversationDocument> {
    return this.conversationModel.create(conversation);
  }

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
    const [sortedParticipant1, sortedParticipant2] = [
      participant1Id,
      participant2Id,
    ].sort();
    return this.conversationModel
      .findOne({
        participant1: sortedParticipant1,
        participant2: sortedParticipant2,
        isActive: true,
      })
      .exec();
  }

  async findUserConversations(
    userId: Types.ObjectId,
    isArchived: boolean = false,
  ): Promise<ConversationDocument[]> {
    return this.conversationModel
      .find({
        $or: [{ participant1: userId }, { participant2: userId }],
        isActive: true,
        isArchived,
      })
      .sort({ lastActivityAt: -1 })
      .exec();
  }

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
    options: QueryOptions = { new: true },
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

  async findAllPaginated(
    filter: FilterQuery<ConversationDocument>,
    userId: string,
    skip = 0,
    limit = 10,
    sort: any = { lastActivityAt: -1 },
  ) {
    const userObjectId = new Types.ObjectId(userId);

    const conversations = await this.conversationModel.aggregate([
      { $match: filter },
      { $sort: sort },
      { $skip: skip },
      { $limit: limit },

      // Populate participant1
      {
        $lookup: {
          from: 'users',
          localField: 'participant1',
          foreignField: '_id',
          as: 'participant1',
        },
      },
      { $unwind: '$participant1' },

      // Populate participant2
      {
        $lookup: {
          from: 'users',
          localField: 'participant2',
          foreignField: '_id',
          as: 'participant2',
        },
      },
      { $unwind: '$participant2' },

      // Populate lastMessage
      {
        $lookup: {
          from: 'messages', // REPLACE WITH ACTUAL COLLECTION NAME IF DIFFERENT
          localField: 'lastMessage',
          foreignField: '_id',
          as: 'lastMessage',
        },
      },
      {
        $unwind: {
          path: '$lastMessage',
          preserveNullAndEmptyArrays: true,
        },
      },

      // Add userLastReadAt
      {
        $addFields: {
          userLastReadAt: {
            $ifNull: [
              { $getField: { field: userId.toString(), input: '$lastReadAt' } },
              new Date(0),
            ],
          },
        },
      },

      // Lookup unread messages
      {
        $lookup: {
          from: 'messages', // REPLACE WITH ACTUAL COLLECTION NAME IF DIFFERENT
          let: {
            convoId: '$_id',
            userLastReadAt: '$userLastReadAt',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$conversationId', '$$convoId'] },
                    { $ne: ['$senderId', userObjectId] },
                    { $eq: ['$isRead', false] },
                    { $eq: ['$isDeleted', false] },
                  ],
                },
              },
            },
          ],
          as: 'unreadMessages',
        },
      },

      // Add unread count field
      {
        $addFields: {
          unreadMessagesCount: { $size: '$unreadMessages' },
        },
      },

      // Add otherParticipant field
      {
        $addFields: {
          otherParticipant: {
            $let: {
              vars: {
                participant1Selected: {
                  _id: '$participant1._id',
                  username: '$participant1.username',
                },
                participant2Selected: {
                  _id: '$participant2._id',
                  username: '$participant2.username',
                },
              },
              in: {
                $cond: {
                  if: { $eq: ['$participant1._id', userObjectId] },
                  then: '$$participant2Selected',
                  else: '$$participant1Selected',
                },
              },
            },
          },
        },
      },

      // Final projection
      {
        $project: {
          allMessages: 0,
          userLastReadAt: 0,
          unreadMessages: 0,
          participant1: 0,
          participant2: 0,
        },
      },
    ]);

    return conversations;
  }

  async isParticipant(
    conversationId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<boolean> {
    const count = await this.conversationModel
      .countDocuments({
        _id: conversationId,
        $or: [{ participant1: userId }, { participant2: userId }],
      })
      .exec();
    return count > 0;
  }

  async isBlocked(
    conversationId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<boolean> {
    const count = await this.conversationModel
      .countDocuments({
        _id: conversationId,
        blockedBy: userId,
      })
      .exec();
    return count > 0;
  }
}
