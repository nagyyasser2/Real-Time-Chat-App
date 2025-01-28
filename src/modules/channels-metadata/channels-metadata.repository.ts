import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ChannelsMetadata, ChannelsMetadataDocument } from './schemas/channels-metadata.schema';

@Injectable()
export class ChannelsMetadataRepository {
  constructor(
    @InjectModel(ChannelsMetadata.name)
    private readonly conversationModel: Model<ChannelsMetadataDocument>,
  ) { }

  async createChannelMetadata(
    conversationId: Types.ObjectId,
  ): Promise<ChannelsMetadataDocument> {
    return this.conversationModel.create({
      conversation: conversationId,
      verified: false,
      subscriberCount: 0,
      broadcastHistory: [],
      analytics: { views: 0, shares: 0 }
    });
  }

  async findChannelMetadataById(
    conversationId: Types.ObjectId,
  ): Promise<ChannelsMetadataDocument | null> {
    return this.conversationModel.findOne({ conversation: conversationId }).exec();
  }

  async updateVerifiedStatus(
    conversationId: Types.ObjectId,
    verified: boolean,
  ): Promise<ChannelsMetadataDocument | null> {
    return this.conversationModel.findOneAndUpdate(
      { conversation: conversationId },
      { $set: { verified } },
      { new: true }
    ).exec();
  }

  async incrementSubscriberCount(
    conversationId: Types.ObjectId,
  ): Promise<ChannelsMetadataDocument | null> {
    return this.conversationModel.findOneAndUpdate(
      { conversation: conversationId },
      { $inc: { subscriberCount: 1 } },
      { new: true }
    ).exec();
  }

  async decrementSubscriberCount(
    conversationId: Types.ObjectId,
  ): Promise<ChannelsMetadataDocument | null> {
    return this.conversationModel.findOneAndUpdate(
      { conversation: conversationId },
      { $inc: { subscriberCount: -1 } },
      { new: true }
    ).exec();
  }

  async addBroadcastMessage(
    conversationId: Types.ObjectId,
    messageId: Types.ObjectId,
  ): Promise<ChannelsMetadataDocument | null> {
    return this.conversationModel.findOneAndUpdate(
      { conversation: conversationId },
      { $push: { broadcastHistory: messageId } },
      { new: true }
    ).exec();
  }

  async incrementViews(
    conversationId: Types.ObjectId,
  ): Promise<ChannelsMetadataDocument | null> {
    return this.conversationModel.findOneAndUpdate(
      { conversation: conversationId },
      { $inc: { 'analytics.views': 1 } },
      { new: true }
    ).exec();
  }

  async incrementShares(
    conversationId: Types.ObjectId,
  ): Promise<ChannelsMetadataDocument | null> {
    return this.conversationModel.findOneAndUpdate(
      { conversation: conversationId },
      { $inc: { 'analytics.shares': 1 } },
      { new: true }
    ).exec();
  }

  async deleteChannelMetadata(
    conversationId: Types.ObjectId,
  ): Promise<boolean> {
    const result = await this.conversationModel.deleteOne({ conversation: conversationId }).exec();
    return result.deletedCount > 0;
  }

  async getBroadcastHistory(
    conversationId: Types.ObjectId,
    limit = 20,
  ): Promise<Types.ObjectId[]> {
    const channel = await this.conversationModel.findOne(
      { conversation: conversationId },
      { broadcastHistory: { $slice: -limit } }
    ).exec();

    return channel?.broadcastHistory || [];
  }
}