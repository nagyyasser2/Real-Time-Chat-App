import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery, UpdateQuery } from 'mongoose';

import { MessageStatus } from '../enums/message-status.enum';
import { Message, MessageDocument } from '../schemas/message.schema';
import { CreateMessageDto } from '../dtos/create-message.dto';

@Injectable()
export class MessageRepository {
  constructor(
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
  ) {}

  async create(messageData: CreateMessageDto): Promise<MessageDocument> {
    return this.messageModel.create({
      ...messageData,
      senderId: new Types.ObjectId(messageData.senderId),
      conversationId: new Types.ObjectId(messageData.conversationId),
    });
  }

  async findByConversation(
    conversationId: Types.ObjectId,
    skip = 0,
    limit = 20,
  ): Promise<MessageDocument[]> {
    return await this.messageModel
      .find({
        conversationId: new Types.ObjectId(conversationId),
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
    return await this.messageModel
      .find({
        sender: userId,
        timestamp: { $gte: date },
        isDeleted: false,
      })
      .sort({ timestamp: -1 }) // Newest first
      .exec();
  }

  async findById(messageId: Types.ObjectId): Promise<MessageDocument | null> {
    return await this.messageModel
      .findOne({ _id: messageId, isDeleted: false })
      .exec();
  }

  async findByIdAndUpdate(
    messageId: Types.ObjectId | string,
    update: UpdateQuery<MessageDocument>,
    options = { new: true },
  ): Promise<MessageDocument | null> {
    return await this.messageModel
      .findByIdAndUpdate(messageId, update, options)
      .exec();
  }

  async updateMany(
    filter: FilterQuery<MessageDocument>,
    update: UpdateQuery<MessageDocument>,
  ): Promise<any> {
    return await this.messageModel.updateMany(filter, update).exec();
  }

  async findMany(
    filter: FilterQuery<MessageDocument>,
  ): Promise<MessageDocument[]> {
    return await this.messageModel.find(filter).exec();
  }

  async updateStatus(
    messageId: Types.ObjectId,
    status: MessageStatus,
  ): Promise<MessageDocument | null> {
    return await this.messageModel
      .findByIdAndUpdate(messageId, { $set: { status } }, { new: true })
      .exec();
  }

  async delete(messageId: Types.ObjectId): Promise<MessageDocument | null> {
    return await this.messageModel.findByIdAndDelete(messageId).exec();
  }

  async deleteMany(conversationId: Types.ObjectId): Promise<void> {
    await await this.messageModel.deleteMany({ conversationId }).exec();
  }

  async addReaction(
    messageId: Types.ObjectId,
    userId: Types.ObjectId,
    emoji: string,
  ): Promise<MessageDocument | null> {
    return await this.messageModel
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
    return await this.messageModel
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
    return await this.messageModel
      .countDocuments({
        conversation: conversationId,
        isDeleted: false,
      })
      .exec();
  }

  async markMessagesAsRead(conversationId: string, userId: string) {
    const result = await this.messageModel
      .updateMany(
        {
          conversationId: new Types.ObjectId(conversationId),
          senderId: { $ne: new Types.ObjectId(userId) },
          status: { $ne: MessageStatus.READ },
        },
        { $set: { status: MessageStatus.READ } },
      )
      .exec();
    return { modifiedCount: result.modifiedCount };
  }
}
