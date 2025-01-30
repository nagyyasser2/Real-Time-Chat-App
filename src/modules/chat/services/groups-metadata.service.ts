import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { GroupsMetadataDocument } from '../schemas/groups-metadata.schema';
import { Types } from 'mongoose';
import { JoinSettings } from '../enums/join-settings.enum';
import { GroupsMetadataRepository } from '../repositories/groups-metadata.repository';
import { CreateGroupsMetadataDto } from '../dtos/create-groups-metadata.dto';
import { UpdateGroupsMetadataDto } from '../dtos/update-groups-metadata.dto';

@Injectable()
export class GroupsMetadataService {
  constructor(private readonly conversationRepo: GroupsMetadataRepository) { }

  async create(
    createDto: CreateGroupsMetadataDto,
  ): Promise<GroupsMetadataDocument> {
    try {
      return await this.conversationRepo.createGroupMetadata(
        createDto.conversation,
        createDto.joinSettings || JoinSettings.OPEN,
      );
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Group metadata already exists');
      }
      throw error;
    }
  }

  async findOne(
    conversationId: Types.ObjectId,
  ): Promise<GroupsMetadataDocument> {
    const group = await this.conversationRepo.findGroupMetadataById(
      conversationId,
    );
    if (!group) {
      throw new NotFoundException('Group metadata not found');
    }
    return group;
  }

  async update(
    conversationId: Types.ObjectId,
    updateDto: UpdateGroupsMetadataDto,
  ): Promise<GroupsMetadataDocument> {
    const group = await this.conversationRepo.findGroupMetadataById(
      conversationId,
    );
    if (!group) {
      throw new NotFoundException('Group metadata not found');
    }

    if (updateDto.joinSettings !== undefined) {
      group.joinSettings = updateDto.joinSettings;
    }
    if (updateDto.announcement !== undefined) {
      group.announcement = updateDto.announcement;
    }
    if (updateDto.adminOnlyPosts !== undefined) {
      group.adminOnlyPosts = updateDto.adminOnlyPosts;
    }

    await group.save();
    return group;
  }

  async remove(conversationId: Types.ObjectId): Promise<boolean> {
    const result = await this.conversationRepo.deleteGroupMetadata(
      conversationId,
    );
    if (!result) {
      throw new NotFoundException('Group metadata not found');
    }
    return result;
  }

  async updateJoinSettings(
    conversationId: Types.ObjectId,
    newSettings: JoinSettings,
  ): Promise<GroupsMetadataDocument> {
    const group = await this.conversationRepo.updateJoinSettings(
      conversationId,
      newSettings,
    );
    if (!group) {
      throw new NotFoundException('Group metadata not found');
    }
    return group;
  }

  async updateAnnouncement(
    conversationId: Types.ObjectId,
    announcement: string,
  ): Promise<GroupsMetadataDocument> {
    const group = await this.conversationRepo.updateAnnouncement(
      conversationId,
      announcement,
    );
    if (!group) {
      throw new NotFoundException('Group metadata not found');
    }
    return group;
  }

  async toggleAdminOnlyPosts(
    conversationId: Types.ObjectId,
  ): Promise<GroupsMetadataDocument> {
    const group = await this.conversationRepo.toggleAdminOnlyPosts(
      conversationId,
    );
    if (!group) {
      throw new NotFoundException('Group metadata not found');
    }
    return group;
  }

  async banUser(
    conversationId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<GroupsMetadataDocument> {
    if (await this.isUserBanned(conversationId, userId)) {
      throw new ConflictException('User already banned');
    }

    const group = await this.conversationRepo.banUser(conversationId, userId);
    if (!group) {
      throw new NotFoundException('Group metadata not found');
    }
    return group;
  }

  async unbanUser(
    conversationId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<GroupsMetadataDocument> {
    const group = await this.conversationRepo.unbanUser(conversationId, userId);
    if (!group) {
      throw new NotFoundException('Group metadata not found');
    }
    return group;
  }

  async isUserBanned(
    conversationId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<boolean> {
    return this.conversationRepo.isUserBanned(conversationId, userId);
  }
}