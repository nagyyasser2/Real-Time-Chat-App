import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Message, MessageDocument } from './schemas/message.schema';
import { MessageStatus } from './enums/message-status.enum';

@Injectable()
export class MessageRepository {
  constructor(
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
  ) { }

  async create(messageData: Partial<Message>): Promise<MessageDocument> {
    return this.messageModel.create(messageData);
  }

  async findByConversation(
    conversationId: Types.ObjectId,
    skip = 0,
    limit = 20,
  ): Promise<MessageDocument[]> {
    return this.messageModel
      .find({
        conversation: conversationId,
        isDeleted: false,
      })
      .sort({ timestamp: 1 })
      .skip(skip)
      .limit(limit)
      .exec();
  }

  async findMessagesByUserAfterDate(
    userId: Types.ObjectId,
    date: Date,
  ): Promise<MessageDocument[]> {
    return this.messageModel
      .find({
        sender: userId,
        timestamp: { $gte: date },
        isDeleted: false,
      })
      .sort({ timestamp: -1 }) // Newest first
      .exec();
  }

  async findById(messageId: Types.ObjectId): Promise<MessageDocument | null> {
    return this.messageModel
      .findOne({ _id: messageId, isDeleted: false })
      .exec();
  }

  async updateStatus(
    messageId: Types.ObjectId,
    status: MessageStatus,
  ): Promise<MessageDocument | null> {
    return this.messageModel
      .findByIdAndUpdate(
        messageId,
        { $set: { status } },
        { new: true }, // Return updated document
      )
      .exec();
  }

  async delete(messageId: Types.ObjectId): Promise<MessageDocument | null> {
    return this.messageModel
      .findByIdAndUpdate(
        messageId,
        { $set: { isDeleted: true } },
        { new: true },
      )
      .exec();
  }

  async addReaction(
    messageId: Types.ObjectId,
    userId: Types.ObjectId,
    emoji: string,
  ): Promise<MessageDocument | null> {
    return this.messageModel
      .findByIdAndUpdate(
        messageId,
        {
          $push: {
            reactions: { user: userId, emoji },
          },
        },
        { new: true },
      )
      .exec();
  }

  async editMessageContent(
    messageId: Types.ObjectId,
    newContent: any,
  ): Promise<MessageDocument | null> {
    return this.messageModel
      .findByIdAndUpdate(
        messageId,
        {
          $set: {
            content: newContent,
            editedAt: new Date(),
          },
        },
        { new: true },
      )
      .exec();
  }

  async countMessagesInConversation(
    conversationId: Types.ObjectId,
  ): Promise<number> {
    return this.messageModel
      .countDocuments({
        conversation: conversationId,
        isDeleted: false,
      })
      .exec();
  }
}