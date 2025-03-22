import { Injectable, NotFoundException, forwardRef, Inject } from '@nestjs/common';
import { Types } from 'mongoose';
import { ConversationsService } from './conversations.service';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from '../dtos/create-message.dto';
import { MessageDocument } from '../schemas/message.schema';
import { ConversationDocument } from '../schemas/conversation.schema';
import { MessageStatus } from '../enums/message-status.enum';
import { MessageType } from '../enums/message-type.enum';

@Injectable()
export class ChatService {
  constructor(
    private readonly conversationsService: ConversationsService,
    @Inject(forwardRef(() => MessagesService))
    private readonly messagesService: MessagesService,
  ) {}
 
  // reviewed successfuly
  async startConversation(
    participant1Id: string,
    participant2Id: string,
  ): Promise<ConversationDocument> {
    return this.conversationsService.create(participant1Id, participant2Id);
  }

  async sendMessage(
    conversationId: Types.ObjectId,
    senderId: Types.ObjectId,
    content: {
      text?: string;
      media?: Array<{
        url: string;
        type: string;
        caption?: string;
      }>;
    },
    type: MessageType = MessageType.TEXT,
    parentMessageId?: string,
    metadata?: {
      forwarded?: boolean;
      forwardedFrom?: Types.ObjectId;
    }
  ): Promise<MessageDocument> {
    // Verify conversation exists and user is a participant
    const conversation = await this.conversationsService.findOne(conversationId);
    if (!this.conversationsService['isParticipant'](conversation, senderId)) {
      throw new NotFoundException('User is not a participant in this conversation');
    }

    // Validate content based on message type
    if (type === MessageType.TEXT && (!content.text || content.text.trim() === '')) {
      throw new NotFoundException('Text content is required for text messages');
    }
    if (type === MessageType.MEDIA && (!content.media || content.media.length === 0)) {
      throw new NotFoundException('Media content is required for media messages');
    }

    // Create message DTO
    const createMessageDto: CreateMessageDto = {
      conversationId: conversationId.toString(),
      senderId : senderId.toString(),
      content,
      type,
      parentMessageId,
      metadata:{

      },
    };

    // Create message and update conversation
    const message = await this.messagesService.create(createMessageDto);
    await this.conversationsService.setLastMessage(conversationId, message._id);

    return message;
  }

  async getConversationMessages(
    conversationId: Types.ObjectId,
    userId: Types.ObjectId,
    skip = 0,
    limit = 20,
  ): Promise<MessageDocument[]> {
    const conversation = await this.conversationsService.findOne(conversationId);
    if (!this.conversationsService['isParticipant'](conversation, userId)) {
      throw new NotFoundException('User is not authorized to view this conversation');
    }

    const messages = await this.messagesService.findAllForConversation(
      conversationId,
      skip,
      limit,
    );
    
    await this.conversationsService.markAsDelivred(conversationId, userId);
    return messages;
  }

  async getUserChats(
    userId: string,
    skip = 0,
    limit = 10,
    includeArchived = false,
  ): Promise<{ data: ConversationDocument[]; total: number }> {
    return this.conversationsService.findUserConversations(
      userId,
      skip,
      limit,
      includeArchived,
    );
  }

  async reactToMessage(
    messageId: Types.ObjectId,
    userId: Types.ObjectId,
    emoji: string,
  ): Promise<MessageDocument> {
    const message = await this.messagesService.findOne(messageId);
    const conversation = await this.conversationsService.findOne(message.conversation);
    
    if (!this.conversationsService['isParticipant'](conversation, userId)) {
      throw new NotFoundException('User is not authorized to react to this message');
    }

    return this.messagesService.addReaction(
      messageId,
      new Types.ObjectId(userId),
      emoji,
    );
  }

  async markConversationAsRead(
    conversationId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<ConversationDocument> {
    return this.conversationsService.markAsRead(conversationId, userId);
  }

  async blockConversation(
    conversationId: Types.ObjectId,
    userId: string,
  ): Promise<ConversationDocument> {
    return this.conversationsService.block(conversationId, new Types.ObjectId(userId));
  }

  async unblockConversation(
    conversationId: Types.ObjectId,
    userId: string,
  ): Promise<ConversationDocument> {
    return this.conversationsService.unblock(conversationId, new Types.ObjectId(userId));
  }

  async deleteMessage(
    messageId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<MessageDocument> {
    const message = await this.messagesService.findOne(messageId);
    const conversation = await this.conversationsService.findOne(message.conversation);
    
    if (message.sender !== userId) {
      throw new NotFoundException('Only the sender can delete this message');
    }

    return this.messagesService.remove(messageId);
  }

  async getChatHistory(
    userId: string,
    days = 30,
  ): Promise<MessageDocument[]> {
    return this.messagesService.getMessageHistory(new Types.ObjectId(userId), days);
  }

  async forwardMessage(
    originalMessageId: Types.ObjectId,
    targetConversationId: Types.ObjectId,
    senderId: Types.ObjectId,
  ): Promise<MessageDocument> {
    const originalMessage = await this.messagesService.findOne(originalMessageId);
    const targetConversation = await this.conversationsService.findOne(targetConversationId);

    if (!this.conversationsService['isParticipant'](targetConversation, senderId)) {
      throw new NotFoundException('User is not a participant in the target conversation');
    }

    return this.sendMessage(
      targetConversationId,
      senderId,
      originalMessage.content,
      originalMessage.type = MessageType.TEXT,
      undefined,
      {
        forwarded: true,
        forwardedFrom: originalMessage.sender,
      }
    );
  }
}