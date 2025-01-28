import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { ConversationRepository } from './conversation.repository';
import { ConversationDocument } from './schemas/conversation.schema';
import { ConversationType } from './enums/conv-type.enum';
import { FilterQuery, Types } from 'mongoose';
import { User } from '../users/schemas/user.schema';

@Injectable()
export class ConversationsService {
  constructor(
    private readonly conversationRepository: ConversationRepository,
  ) { }

  async create(
    createConversationDto: CreateConversationDto,
    creatorId: string,
  ): Promise<ConversationDocument> {
    try {
      // Check for unique name if provided
      if (createConversationDto.name) {
        const existing = await this.conversationRepository.findByName(
          createConversationDto.name,
        );
        if (existing) {
          throw new ConflictException(
            'Conversation with this name already exists',
          );
        }
      }

      const conversation = await this.conversationRepository.create({
        ...createConversationDto,
        creator: { _id: creatorId } as User,
        participantCount: createConversationDto.type === ConversationType.GROUP ? 1 : 0,
      });

      return conversation;
    } catch (error) {
      if (error.code === 11000) { // MongoDB duplicate key error
        throw new ConflictException('Conversation name must be unique');
      }
      throw error;
    }
  }

  async findAll(
    filter: FilterQuery<ConversationDocument> = {},
    skip = 0,
    limit = 10,
    sort: Record<string, 1 | -1> = { createdAt: -1 },
  ): Promise<{ data: ConversationDocument[]; total: number }> {
    return this.conversationRepository.findAllPaginated(
      filter,
      skip,
      limit,
      sort,
    );
  }

  async findOne(id: Types.ObjectId): Promise<ConversationDocument> {
    const conversation = await this.conversationRepository.findById(id);
    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${id} not found`);
    }
    return conversation;
  }

  async update(
    id: Types.ObjectId,
    updateConversationDto: UpdateConversationDto,
  ): Promise<ConversationDocument> {
    if (updateConversationDto.name) {
      const existing = await this.conversationRepository.findByName(
        updateConversationDto.name,
      );
      if (existing && existing._id !== id) {
        throw new ConflictException(
          'Another conversation with this name already exists',
        );
      }
    }

    const updated = await this.conversationRepository.updateById(
      id,
      updateConversationDto,
    );

    if (!updated) {
      throw new NotFoundException(`Conversation with ID ${id} not found`);
    }

    return updated;
  }

  async remove(id: Types.ObjectId): Promise<ConversationDocument> {
    const deleted = await this.conversationRepository.deleteById(id);
    if (!deleted) {
      throw new NotFoundException(`Conversation with ID ${id} not found`);
    }
    return deleted;
  }

  async incrementParticipantCount(
    conversationId: Types.ObjectId,
  ): Promise<ConversationDocument> {
    const updated = await this.conversationRepository.incrementParticipantCount(
      conversationId,
    );
    if (!updated) {
      throw new NotFoundException(
        `Conversation with ID ${conversationId} not found`,
      );
    }
    return updated;
  }

  async setLastMessage(
    conversationId: Types.ObjectId,
    messageId: Types.ObjectId,
  ): Promise<ConversationDocument> {
    const updated = await this.conversationRepository.setLastMessage(
      conversationId,
      messageId,
    );
    if (!updated) {
      throw new NotFoundException(
        `Conversation with ID ${conversationId} not found`,
      );
    }
    return updated;
  }

  async userIsParticipant(
    conversationId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<boolean> {
    // This would need integration with a participants service/repository
    // Implementation depends on your participant management system
    // This is just a placeholder implementation
    const conversation = await this.findOne(conversationId);
    return (conversation.participantCount ?? 0) > 0; // Simplified check
  }
}