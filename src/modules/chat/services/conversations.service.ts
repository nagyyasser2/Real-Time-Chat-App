import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ConversationRepository } from '../repositories/conversation.repository';
import { ConversationDocument } from '../schemas/conversation.schema';
import { FilterQuery, Types } from 'mongoose';
import { UsersService } from 'src/modules/users/users.service';
import { MessagesService } from './messages.service';

@Injectable()
export class ConversationsService {
  constructor(
    private readonly conversationRepository: ConversationRepository,
    private readonly usersService: UsersService,
    private readonly messagesService: MessagesService,
  ) {}

  async create(senderId: string, receiverId: string): Promise<any> {
    try {
      // Convert participant IDs to ObjectId
      const objectId1 = new Types.ObjectId(senderId);
      const objectId2 = new Types.ObjectId(receiverId);

      // Ensure a consistent order for storage
      const [sortedParticipant1, sortedParticipant2] = [
        objectId1.toString(),
        objectId2.toString(),
      ].sort();
      const participant1 = new Types.ObjectId(sortedParticipant1);
      const participant2 = new Types.ObjectId(sortedParticipant2);

      // Generate a unique conversation key
      const conversationKey = `${sortedParticipant1}_${sortedParticipant2}`;

      // Check if a conversation already exists using the repository method
      const existingConversation = await this.conversationRepository.findOne({
        conversationKey,
      });
      if (existingConversation) {
        return existingConversation;
      }

      await this.usersService.addContact(senderId, receiverId);

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
          [senderId, new Date()],
          [receiverId, new Date()],
        ]),
      });

      const {
        _id,
        isActive,
        lastActivityAt,
        blockedBy,
        isArchived,
        messageCount,
        lastMessage,
        unreadMessagesCount,
      } = newconversation;

      return {
        _id,
        conversationKey,
        isActive,
        lastActivityAt,
        blockedBy,
        isArchived,
        messageCount,
        lastMessage,
        unreadMessagesCount,
      };
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException(
          'Conversation already exists between these users',
        );
      }
      throw error;
    }
  }

  async findUserConversations(
    userId: any,
    skip = 0,
    limit = 10,
    includeArchived = false,
  ): Promise<any> {
    const filter: FilterQuery<ConversationDocument> = {
      $or: [
        { participant1: new Types.ObjectId(userId) },
        { participant2: new Types.ObjectId(userId) },
      ],
      isActive: true,
    };

    if (!includeArchived) {
      filter.isArchived = false;
    }

    // The repository now returns { chats, total }
    return this.conversationRepository.findAllPaginated(
      filter,
      userId,
      skip,
      limit,
      { lastActivityAt: -1 },
    );
  }

  async findOneById(id: Types.ObjectId): Promise<ConversationDocument> {
    const conversation = await this.conversationRepository.findById(id);
    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${id} not found`);
    }
    return conversation;
  }

  async archive(
    id: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<ConversationDocument> {
    const conversation = await this.findOneById(id);

    if (!this.isParticipant(conversation, userId)) {
      throw new BadRequestException(
        'User is not a participant in this conversation',
      );
    }

    const updatedConversation = await this.conversationRepository.updateById(
      id,
      { isArchived: true },
    );
    if (!updatedConversation) {
      throw new NotFoundException(`Conversation with ID ${id} not found`);
    }
    return updatedConversation;
  }

  async block(
    id: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<ConversationDocument> {
    const conversation = await this.findOneById(id);

    if (!this.isParticipant(conversation, userId)) {
      throw new BadRequestException(
        'User is not a participant in this conversation',
      );
    }

    if (conversation.blockedBy.includes(new Types.ObjectId(userId))) {
      throw new BadRequestException(
        'Conversation is already blocked by this user',
      );
    }

    const updatedConversation = await this.conversationRepository.updateOne(
      { _id: id },
      { $push: { blockedBy: userId } },
    );

    if (!updatedConversation) {
      throw new NotFoundException(`Conversation with ID ${id} not found`);
    }

    return updatedConversation;
  }

  async unblock(
    id: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<ConversationDocument> {
    const conversation = await this.findOneById(id);

    if (!this.isParticipant(conversation, userId)) {
      throw new BadRequestException(
        'User is not a participant in this conversation',
      );
    }

    const updatedConversation = await this.conversationRepository.updateOne(
      { _id: id },
      { $pull: { blockedBy: userId } },
    );

    if (!updatedConversation) {
      throw new NotFoundException(`Conversation with ID ${id} not found`);
    }

    return updatedConversation;
  }

  async markAsDelivred(
    conversationId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<ConversationDocument> {
    const conversation = await this.findOneById(conversationId);

    if (!this.isParticipant(conversation, userId)) {
      throw new BadRequestException(
        'User is not a participant in this conversation',
      );
    }

    const lastReadAt = conversation.lastReadAt || new Map();
    lastReadAt.set(userId.toString(), new Date());

    const updatedConversation = await this.conversationRepository.updateById(
      conversationId,
      { lastReadAt },
    );

    if (!updatedConversation) {
      throw new NotFoundException(
        `Conversation with ID ${conversationId} not found`,
      );
    }

    return updatedConversation;
  }

  async markAsRead(
    conversationId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<ConversationDocument> {
    const conversation = await this.findOneById(conversationId);

    if (!this.isParticipant(conversation, userId)) {
      throw new BadRequestException(
        'User is not a participant in this conversation',
      );
    }

    const lastReadAt = conversation.lastReadAt || new Map();
    lastReadAt.set(userId.toString(), new Date());

    const updatedConversation = await this.conversationRepository.updateById(
      conversationId,
      { lastReadAt },
    );

    if (!updatedConversation) {
      throw new NotFoundException(
        `Conversation with ID ${conversationId} not found`,
      );
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
      },
    );

    if (updated) {
      await this.conversationRepository.updateOne(
        { _id: conversationId },
        { $inc: { messageCount: 1 } },
      );
    }

    if (!updated) {
      throw new NotFoundException(
        `Conversation with ID ${conversationId} not found`,
      );
    }

    return updated;
  }

  async deactivate(id: Types.ObjectId): Promise<ConversationDocument> {
    const updated = await this.conversationRepository.updateById(id, {
      isActive: false,
      lastActivityAt: new Date(),
    });

    if (!updated) {
      throw new NotFoundException(`Conversation with ID ${id} not found`);
    }

    return updated;
  }

  private isParticipant(
    conversation: ConversationDocument,
    userId: Types.ObjectId,
  ): boolean {
    return (
      conversation.participant1 === userId ||
      conversation.participant2 === userId
    );
  }

  /**
   * Block a user in a conversation
   */
  async blockUser(
    conversationId: Types.ObjectId,
    blockedByUserId: Types.ObjectId,
    targetUserId: Types.ObjectId,
  ): Promise<ConversationDocument> {
    // Validate that the conversation exists
    const conversation =
      await this.conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Validate that the user blocking is a participant in the conversation
    const isParticipant =
      conversation.participant1.equals(blockedByUserId) ||
      conversation.participant2.equals(blockedByUserId);

    if (!isParticipant) {
      throw new ForbiddenException(
        'You are not a participant in this conversation',
      );
    }

    // Validate that the target user is the other participant
    const isTargetParticipant =
      conversation.participant1.equals(targetUserId) ||
      conversation.participant2.equals(targetUserId);

    if (!isTargetParticipant) {
      throw new BadRequestException(
        'Target user is not a participant in this conversation',
      );
    }

    // Cannot block yourself
    if (blockedByUserId.equals(targetUserId)) {
      throw new BadRequestException('You cannot block yourself');
    }

    // Check if user is already blocked
    const isAlreadyBlocked = await this.conversationRepository.isUserBlocked(
      conversationId,
      blockedByUserId,
    );

    if (isAlreadyBlocked) {
      throw new ConflictException(
        'User is already blocked in this conversation',
      );
    }

    // Perform the block operation
    const updatedConversation = await this.conversationRepository.blockUser(
      conversationId,
      blockedByUserId,
    );

    if (!updatedConversation) {
      throw new NotFoundException('Failed to block user');
    }

    return updatedConversation;
  }

  /**
   * Unblock a user in a conversation
   */
  async unblockUser(
    conversationId: Types.ObjectId,
    unblockedByUserId: Types.ObjectId,
    targetUserId: Types.ObjectId,
  ): Promise<ConversationDocument> {
    // Validate that the conversation exists
    const conversation =
      await this.conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Validate that the user unblocking is a participant in the conversation
    const isParticipant =
      conversation.participant1.equals(unblockedByUserId) ||
      conversation.participant2.equals(unblockedByUserId);

    if (!isParticipant) {
      throw new ForbiddenException(
        'You are not a participant in this conversation',
      );
    }

    // Validate that the target user is the other participant
    const isTargetParticipant =
      conversation.participant1.equals(targetUserId) ||
      conversation.participant2.equals(targetUserId);

    if (!isTargetParticipant) {
      throw new BadRequestException(
        'Target user is not a participant in this conversation',
      );
    }

    // Check if user is actually blocked by the current user
    const isBlocked = await this.conversationRepository.isUserBlocked(
      conversationId,
      unblockedByUserId,
    );

    if (!isBlocked) {
      throw new ConflictException('User is not blocked in this conversation');
    }

    // Perform the unblock operation
    const updatedConversation = await this.conversationRepository.unblockUser(
      conversationId,
      unblockedByUserId,
    );

    if (!updatedConversation) {
      throw new NotFoundException('Failed to unblock user');
    }

    return updatedConversation;
  }

  /**
   * Check if a user is blocked in a conversation
   */
  async isUserBlocked(
    conversationId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<boolean> {
    return this.conversationRepository.isUserBlocked(conversationId, userId);
  }

  /**
   * Get block status for a conversation from current user's perspective
   */
  async getBlockStatus(
    conversationId: Types.ObjectId,
    currentUserId: Types.ObjectId,
  ): Promise<{
    isBlockedByMe: boolean;
    isBlockedByOther: boolean;
    canSendMessages: boolean;
  }> {
    const conversation =
      await this.conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Get the other participant
    const otherParticipant = conversation.participant1.equals(currentUserId)
      ? conversation.participant2
      : conversation.participant1;

    const isBlockedByMe = conversation.blockedBy.some((id) =>
      id.equals(currentUserId),
    );
    const isBlockedByOther = conversation.blockedBy.some((id) =>
      id.equals(otherParticipant),
    );

    return {
      isBlockedByMe,
      isBlockedByOther,
      canSendMessages: !isBlockedByMe && !isBlockedByOther,
    };
  }
}
