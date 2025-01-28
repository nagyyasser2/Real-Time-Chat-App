import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { GroupsMetadata, GroupsMetadataDocument } from './schemas/groups-metadata.schema';
import { JoinSettings } from './enums/join-settings.enum';

@Injectable()
export class GroupsMetadataRepository {
  constructor(
    @InjectModel(GroupsMetadata.name)
    private readonly conversationModel: Model<GroupsMetadataDocument>,
  ) { }

  async createGroupMetadata(
    conversationId: Types.ObjectId,
    joinSettings: JoinSettings = JoinSettings.OPEN
  ): Promise<GroupsMetadataDocument> {
    return this.conversationModel.create({
      conversation: conversationId,
      joinSettings,
      bannedUsers: [],
      adminOnlyPosts: false
    });
  }

  async findGroupMetadataById(
    conversationId: Types.ObjectId
  ): Promise<GroupsMetadataDocument | null> {
    return this.conversationModel.findOne({ conversation: conversationId }).exec();
  }

  async updateJoinSettings(
    conversationId: Types.ObjectId,
    newSettings: JoinSettings
  ): Promise<GroupsMetadataDocument | null> {
    return this.conversationModel.findOneAndUpdate(
      { conversation: conversationId },
      { $set: { joinSettings: newSettings } },
      { new: true }
    ).exec();
  }

  async updateAnnouncement(
    conversationId: Types.ObjectId,
    announcement: string
  ): Promise<GroupsMetadataDocument | null> {
    return this.conversationModel.findOneAndUpdate(
      { conversation: conversationId },
      { $set: { announcement } },
      { new: true }
    ).exec();
  }

  async toggleAdminOnlyPosts(
    conversationId: Types.ObjectId
  ): Promise<GroupsMetadataDocument | null> {
    return this.conversationModel.findOneAndUpdate(
      { conversation: conversationId },
      [{ $set: { adminOnlyPosts: { $not: "$adminOnlyPosts" } } }],
      { new: true }
    ).exec();
  }

  async banUser(
    conversationId: Types.ObjectId,
    userId: Types.ObjectId
  ): Promise<GroupsMetadataDocument | null> {
    return this.conversationModel.findOneAndUpdate(
      { conversation: conversationId },
      { $addToSet: { bannedUsers: userId } },
      { new: true }
    ).exec();
  }

  async unbanUser(
    conversationId: Types.ObjectId,
    userId: Types.ObjectId
  ): Promise<GroupsMetadataDocument | null> {
    return this.conversationModel.findOneAndUpdate(
      { conversation: conversationId },
      { $pull: { bannedUsers: userId } },
      { new: true }
    ).exec();
  }

  async deleteGroupMetadata(
    conversationId: Types.ObjectId
  ): Promise<boolean> {
    const result = await this.conversationModel.deleteOne({ conversation: conversationId }).exec();
    return result.deletedCount > 0;
  }

  async isUserBanned(
    conversationId: Types.ObjectId,
    userId: Types.ObjectId
  ): Promise<boolean> {
    const group = await this.conversationModel.findOne({
      conversation: conversationId,
      bannedUsers: userId
    }).select('_id').lean().exec();

    return !!group;
  }
}