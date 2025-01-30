import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Types } from 'mongoose';
import { ParticipantsRepository } from '../repositories/participants.repository';
import { ConversationRepository } from '../repositories/conversation.repository';
import { CreateParticipantDto } from '../dtos/create-participant.dto';
import { ParticipantDocument } from '../schemas/participant.schema';
import { UpdateParticipantDto } from '../dtos/update-participant.dto';
import { ParticipantRole } from '../enums/participant-role.enum';

@Injectable()
export class ParticipantsService {
  constructor(
    private readonly participantsRepository: ParticipantsRepository,
    private readonly conversationsRepository: ConversationRepository,
  ) { }

  async create(
    createDto: CreateParticipantDto,
  ): Promise<ParticipantDocument> {
    // Check if participant already exists
    const existing = await this.participantsRepository.findByUserAndConversation(
      createDto.user,
      createDto.conversation,
    );

    if (existing) {
      throw new ConflictException('Participant already exists in conversation');
    }

    // Verify conversation exists
    const conversation = await this.conversationsRepository.findById(
      createDto.conversation,
    );
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Create participant
    const participant = await this.participantsRepository.create(createDto);

    // Update conversation participant count
    await this.conversationsRepository.incrementParticipantCount(
      createDto.conversation,
    );

    return participant;
  }

  async findAllByConversation(
    conversationId: string,
  ): Promise<ParticipantDocument[]> {
    return this.participantsRepository.find({ conversation: conversationId });
  }

  async findOne(id: Types.ObjectId): Promise<ParticipantDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid participant ID format');
    }

    const participant = await this.participantsRepository.findById(id);
    if (!participant) {
      throw new NotFoundException(`Participant with ID ${id} not found`);
    }
    return participant;
  }

  async update(
    id: Types.ObjectId,
    updateDto: UpdateParticipantDto,
  ): Promise<ParticipantDocument> {
    const updated = await this.participantsRepository.updateById(id, updateDto);
    if (!updated) {
      throw new NotFoundException(`Participant with ID ${id} not found`);
    }
    return updated;
  }

  async remove(id: Types.ObjectId): Promise<ParticipantDocument> {
    const participant = await this.findOne(id);
    const deleted = await this.participantsRepository.deleteById(id);
    if (!deleted) {
      throw new NotFoundException(`Participant with ID ${id} not found`);
    }

    // Update conversation participant count
    await this.conversationsRepository.incrementParticipantCount(
      participant.conversation,
      -1,
    );

    return deleted;
  }

  async updateLastReadMessage(
    participantId: Types.ObjectId,
    messageId: Types.ObjectId,
  ): Promise<ParticipantDocument> {
    const updatedParticipant = await this.participantsRepository.updateById(participantId, {
      lastReadMessage: messageId,
    });
    if (!updatedParticipant) {
      throw new NotFoundException(`Participant with ID ${participantId} not found`);
    }
    return updatedParticipant;
  }

  async setMute(
    participantId: Types.ObjectId,
    mutedUntil: Date,
  ): Promise<any> {
    return this.participantsRepository.updateById(participantId, {
      mutedUntil,
    });
  }

  async checkUserPermission(
    userId: Types.ObjectId,
    conversationId: Types.ObjectId,
    requiredRole: ParticipantRole,
  ): Promise<boolean> {
    const participant = await this.participantsRepository.findByUserAndConversation(
      userId,
      conversationId,
    );

    if (!participant) return false;

    const roleHierarchy = {
      [ParticipantRole.OWNER]: 3,
      [ParticipantRole.ADMIN]: 2,
      [ParticipantRole.MEMBER]: 1,
    };

    return roleHierarchy[participant.role] >= roleHierarchy[requiredRole];
  }

  async getConversationRole(
    userId: Types.ObjectId,
    conversationId: Types.ObjectId,
  ): Promise<ParticipantRole | null> {
    const participant = await this.participantsRepository.findByUserAndConversation(
      userId,
      conversationId,
    );
    return participant ? (participant.role as ParticipantRole) : null;
  }
}