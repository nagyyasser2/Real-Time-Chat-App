import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CreateChannelsMetadataDto } from './dto/create-channels-metadata.dto';
import { UpdateChannelsMetadataDto } from './dto/update-channels-metadata.dto';
import { ChannelsMetadataDocument } from './schemas/channels-metadata.schema';
import { Types } from 'mongoose';
import { ChannelsMetadataRepository } from './channels-metadata.repository';

@Injectable()
export class ChannelsMetadataService {
  constructor(private readonly conversationRepo: ChannelsMetadataRepository) { }

  async create(
    createDto: CreateChannelsMetadataDto,
  ): Promise<ChannelsMetadataDocument> {
    try {
      return await this.conversationRepo.createChannelMetadata(
        createDto.conversation,
      );
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Channel metadata already exists');
      }
      throw error;
    }
  }

  async findOne(
    conversationId: Types.ObjectId,
  ): Promise<ChannelsMetadataDocument> {
    const channel = await this.conversationRepo.findChannelMetadataById(
      conversationId,
    );
    if (!channel) {
      throw new NotFoundException('Channel metadata not found');
    }
    return channel;
  }

  async update(
    conversationId: Types.ObjectId,
    updateDto: UpdateChannelsMetadataDto,
  ): Promise<ChannelsMetadataDocument> {
    const channel = await this.conversationRepo.findChannelMetadataById(
      conversationId,
    );
    if (!channel) {
      throw new NotFoundException('Channel metadata not found');
    }

    if (updateDto.verified !== undefined) {
      channel.verified = updateDto.verified;
    }

    await channel.save();
    return channel;
  }

  async remove(conversationId: Types.ObjectId): Promise<boolean> {
    const result = await this.conversationRepo.deleteChannelMetadata(
      conversationId,
    );
    if (!result) {
      throw new NotFoundException('Channel metadata not found');
    }
    return result;
  }

  async incrementSubscriberCount(
    conversationId: Types.ObjectId,
  ): Promise<ChannelsMetadataDocument> {
    const channel = await this.conversationRepo.incrementSubscriberCount(
      conversationId,
    );
    if (!channel) {
      throw new NotFoundException('Channel metadata not found');
    }
    return channel;
  }

  async decrementSubscriberCount(
    conversationId: Types.ObjectId,
  ): Promise<ChannelsMetadataDocument> {
    const channel = await this.conversationRepo.decrementSubscriberCount(
      conversationId,
    );
    if (!channel) {
      throw new NotFoundException('Channel metadata not found');
    }
    return channel;
  }

  async addBroadcastMessage(
    conversationId: Types.ObjectId,
    messageId: Types.ObjectId,
  ): Promise<ChannelsMetadataDocument> {
    const channel = await this.conversationRepo.addBroadcastMessage(
      conversationId,
      messageId,
    );
    if (!channel) {
      throw new NotFoundException('Channel metadata not found');
    }
    return channel;
  }

  async incrementViews(
    conversationId: Types.ObjectId,
  ): Promise<ChannelsMetadataDocument> {
    const channel = await this.conversationRepo.incrementViews(conversationId);
    if (!channel) {
      throw new NotFoundException('Channel metadata not found');
    }
    return channel;
  }

  async incrementShares(
    conversationId: Types.ObjectId,
  ): Promise<ChannelsMetadataDocument> {
    const channel = await this.conversationRepo.incrementShares(conversationId);
    if (!channel) {
      throw new NotFoundException('Channel metadata not found');
    }
    return channel;
  }

  async getBroadcastHistory(
    conversationId: Types.ObjectId,
    limit = 20,
  ): Promise<Types.ObjectId[]> {
    return this.conversationRepo.getBroadcastHistory(conversationId, limit);
  }
}