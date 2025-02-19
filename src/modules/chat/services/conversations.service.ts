import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConversationRepository } from '../repositories/conversation.repository';
import { ConversationDocument } from '../schemas/conversation.schema';
import { FilterQuery, Types } from 'mongoose';

@Injectable()
export class ConversationsService {
  constructor(
    private readonly conversationRepository: ConversationRepository,
  ) { }



  async create(
    participant1Id: string, // Accept strings as input
    participant2Id: string
  ): Promise<ConversationDocument> {
    try {
      if (participant1Id === participant2Id) {
        throw new BadRequestException('Cannot create conversation with yourself');
      }
  
      // Convert string to ObjectId
      const objectId1 = new Types.ObjectId(participant1Id);
      const objectId2 = new Types.ObjectId(participant2Id);
  
      // Sort participant IDs to ensure consistent uniqueness check
      const [sortedParticipant1, sortedParticipant2] = [objectId1, objectId2].sort();
  
      const existingConversation = await this.conversationRepository.findOne({
        participant1: sortedParticipant1,
        participant2: sortedParticipant2,
      });
  
      if (existingConversation) {
        throw new ConflictException('Conversation already exists between these users');
      }
  
      const conversation = await this.conversationRepository.create({
        participant1: sortedParticipant1,
        participant2: sortedParticipant2,
        lastActivityAt: new Date(),
        isActive: true,
        messageCount: 0,
        blockedBy: [],
        lastReadAt: new Map<string, Date>([
          [participant1Id, new Date()],
          [participant2Id, new Date()],
        ]),
      });
  
      return conversation;
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Conversation already exists between these users');
      }
      throw error;
    }
  }
  

  async findUserConversations(
    userId: string,
    skip = 0,
    limit = 10,
    includeArchived = false
  ): Promise<{ data: ConversationDocument[]; total: number }> {
    const filter: FilterQuery<ConversationDocument> = {
      $or: [
        { participant1: userId },
        { participant2: userId }
      ],
      isActive: true
    };

    if (!includeArchived) {
      filter.isArchived = false;
    }

    return this.conversationRepository.findAllPaginated(
      filter,
      skip,
      limit,
      { lastActivityAt: -1 }
    );
  }

  async findOne(id: Types.ObjectId): Promise<ConversationDocument> {
    const conversation = await this.conversationRepository.findById(id);
    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${id} not found`);
    }
    return conversation;
  }

  async archive(
    id: Types.ObjectId,
    userId: string
  ): Promise<ConversationDocument> {
    const conversation = await this.findOne(id);

    if (!this.isParticipant(conversation, userId)) {
      throw new BadRequestException('User is not a participant in this conversation');
    }

    const updatedConversation = await this.conversationRepository.updateById(id, { isArchived: true });
    if (!updatedConversation) {
      throw new NotFoundException(`Conversation with ID ${id} not found`);
    }
    return updatedConversation;
  }

  async block(
    id: Types.ObjectId,
    userId: string
  ): Promise<ConversationDocument> {
    const conversation = await this.findOne(id);

    if (!this.isParticipant(conversation, userId)) {
      throw new BadRequestException('User is not a participant in this conversation');
    }

    if (conversation.blockedBy.includes(new Types.ObjectId(userId))) {
      throw new BadRequestException('Conversation is already blocked by this user');
    }

    const updatedConversation = await this.conversationRepository.updateOne(
      { _id: id },
      { $push: { blockedBy: userId } }
    );

    if (!updatedConversation) {
      throw new NotFoundException(`Conversation with ID ${id} not found`);
    }

    return updatedConversation;
  }

  async unblock(
    id: Types.ObjectId,
    userId: string
  ): Promise<ConversationDocument> {
    const conversation = await this.findOne(id);

    if (!this.isParticipant(conversation, userId)) {
      throw new BadRequestException('User is not a participant in this conversation');
    }

    const updatedConversation = await this.conversationRepository.updateOne(
      { _id: id },
      { $pull: { blockedBy: userId } }
    );

    if (!updatedConversation) {
      throw new NotFoundException(`Conversation with ID ${id} not found`);
    }

    return updatedConversation;
  }

  async markAsDelivred(
    conversationId: Types.ObjectId,
    userId: string
  ): Promise<ConversationDocument> {
    const conversation = await this.findOne(conversationId);

    if (!this.isParticipant(conversation, userId)) {
      throw new BadRequestException('User is not a participant in this conversation');
    }

    const lastReadAt = conversation.lastReadAt || new Map();
    lastReadAt.set(userId, new Date());

    const updatedConversation = await this.conversationRepository.updateById(
      conversationId,
      { lastReadAt }
    );

    if (!updatedConversation) {
      throw new NotFoundException(`Conversation with ID ${conversationId} not found`);
    }

    return updatedConversation;
  }

  async markAsRead(
    conversationId: Types.ObjectId,
    userId: string
  ): Promise<ConversationDocument> {
    const conversation = await this.findOne(conversationId);

    if (!this.isParticipant(conversation, userId)) {
      throw new BadRequestException('User is not a participant in this conversation');
    }

    const lastReadAt = conversation.lastReadAt || new Map();
    lastReadAt.set(userId, new Date());

    const updatedConversation = await this.conversationRepository.updateById(
      conversationId,
      { lastReadAt }
    );

    if (!updatedConversation) {
      throw new NotFoundException(`Conversation with ID ${conversationId} not found`);
    }

    return updatedConversation;
  }

  async setLastMessage(
    conversationId: Types.ObjectId,
    messageId: Types.ObjectId,
  ): Promise<ConversationDocument> {
    const updated = await this.conversationRepository.updateById(
      conversationId,
      {
        lastMessage: messageId,
        lastActivityAt: new Date(),
      }
    );

    if (updated) {
      await this.conversationRepository.updateOne(
        { _id: conversationId },
        { $inc: { messageCount: 1 } }
      );
    }

    if (!updated) {
      throw new NotFoundException(`Conversation with ID ${conversationId} not found`);
    }

    return updated;
  }

  async deactivate(id: Types.ObjectId): Promise<ConversationDocument> {
    const updated = await this.conversationRepository.updateById(id, {
      isActive: false,
      lastActivityAt: new Date()
    });

    if (!updated) {
      throw new NotFoundException(`Conversation with ID ${id} not found`);
    }

    return updated;
  }

  private isParticipant(conversation: ConversationDocument, userId: string): boolean {
    return conversation.participant1.toString() === userId ||
      conversation.participant2.toString() === userId;
  }
}