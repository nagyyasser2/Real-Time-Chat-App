import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConversationRepository } from '../repositories/conversation.repository';
import { ConversationDocument } from '../schemas/conversation.schema';
import { FilterQuery, Types } from 'mongoose';
import { UsersService } from 'src/modules/users/services/users.service';

@Injectable()
export class ConversationsService {
  constructor(
    private readonly conversationRepository: ConversationRepository,
    private readonly usersService : UsersService
  ) { }

  async create(
    participant1Id: string, 
    participant2Id: string
  ): Promise<ConversationDocument> {
    try {
      if (participant1Id === participant2Id) {
        throw new BadRequestException('Cannot create a conversation with yourself');
      }
  
      // Convert participant IDs to ObjectId
      const objectId1 = new Types.ObjectId(participant1Id);
      const objectId2 = new Types.ObjectId(participant2Id);
  
      // Ensure a consistent order for storage
      const [sortedParticipant1, sortedParticipant2] = 
        [objectId1.toString(), objectId2.toString()].sort();
      const participant1 = new Types.ObjectId(sortedParticipant1);
      const participant2 = new Types.ObjectId(sortedParticipant2);
  
      // Generate a unique conversation key
      const conversationKey = `${sortedParticipant1}_${sortedParticipant2}`;
  
      // Check if a conversation already exists using the repository method
      const existingConversation = await this.conversationRepository.findOne({ conversationKey });
      if (existingConversation) {
        return existingConversation;
      }
      
      await this.usersService.addContact(participant1Id, participant2Id);
  
      // Create and save the conversation
      const newconversation = await this.conversationRepository.create({
        participant1,
        participant2,
        conversationKey, // Ensure uniqueness
        lastActivityAt: new Date(),
        isActive: true,
        messageCount: 0,
        blockedBy: [],
        lastReadAt: new Map<string, Date>([
          [participant1Id, new Date()],
          [participant2Id, new Date()],
        ]),
      });


      return newconversation;

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
    userId: Types.ObjectId
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
    userId: Types.ObjectId
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
    userId: Types.ObjectId
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
    userId: Types.ObjectId
  ): Promise<ConversationDocument> {
    const conversation = await this.findOne(conversationId);

    if (!this.isParticipant(conversation, userId)) {
      throw new BadRequestException('User is not a participant in this conversation');
    }

    const lastReadAt = conversation.lastReadAt || new Map();
    lastReadAt.set(userId.toString(), new Date());

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
    userId: Types.ObjectId
  ): Promise<ConversationDocument> {
    const conversation = await this.findOne(conversationId);

    if (!this.isParticipant(conversation, userId)) {
      throw new BadRequestException('User is not a participant in this conversation');
    }

    const lastReadAt = conversation.lastReadAt || new Map();
    lastReadAt.set(userId.toString(), new Date());

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
  private isParticipant(conversation: ConversationDocument, userId: Types.ObjectId): boolean {
    return conversation.participant1 === userId ||
      conversation.participant2 === userId;
  }
}