import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';

import { Types } from 'mongoose';
import { MessageRepository } from '../repositories/message.repository';
import { MessageDocument } from '../schemas/message.schema';
import { CreateMessageDto } from '../dtos/create-message.dto';
import { MessageStatus } from '../enums/message-status.enum';
import { UpdateMessageDto } from '../dtos/update-message.dto';

@Injectable()
export class MessagesService {
  constructor(private readonly messageRepository: MessageRepository) { }

  async create(createMessageDto: CreateMessageDto): Promise<MessageDocument> {
    const message = await this.messageRepository.create({
      ...createMessageDto,
      status: MessageStatus.SENT,
      timestamp: new Date(),
    });
    return message;
  }

  async findAllForConversation(
    conversationId: Types.ObjectId,
    skip = 0,
    limit = 20,
  ): Promise<MessageDocument[]> {
    return this.messageRepository.findByConversation(conversationId, skip, limit);
  }

  async findOne(messageId: Types.ObjectId): Promise<MessageDocument> {
    const message = await this.messageRepository.findById(messageId);
    if (!message) {
      throw new NotFoundException('Message not found');
    }
    return message;
  }

  async update(
    messageId: Types.ObjectId,
    updateMessageDto: UpdateMessageDto,
  ): Promise<MessageDocument> {
    const updatedMessage = await this.messageRepository.editMessageContent(
      messageId,
      updateMessageDto.content,
    );
    if (!updatedMessage) {
      throw new NotFoundException('Message not found or cannot be updated');
    }
    return updatedMessage;
  }

  async updateStatus(
    messageId: Types.ObjectId,
    status: MessageStatus,
  ): Promise<MessageDocument> {
    const message = await this.messageRepository.updateStatus(messageId, status);
    if (!message) {
      throw new NotFoundException('Message not found');
    }
    return message;
  }

  async remove(messageId: Types.ObjectId): Promise<MessageDocument> {
    const deletedMessage = await this.messageRepository.delete(messageId);
    if (!deletedMessage) {
      throw new NotFoundException('Message not found');
    }
    return deletedMessage;
  }

  async addReaction(
    messageId: Types.ObjectId,
    userId: Types.ObjectId,
    emoji: string,
  ): Promise<MessageDocument> {
    const message = await this.messageRepository.addReaction(
      messageId,
      userId,
      emoji,
    );
    if (!message) {
      throw new NotFoundException('Message not found');
    }
    return message;
  }

  async countMessagesInConversation(
    conversationId: Types.ObjectId,
  ): Promise<number> {
    return this.messageRepository.countMessagesInConversation(conversationId);
  }

  async getMessageHistory(
    userId: Types.ObjectId,
    days = 30,
  ): Promise<MessageDocument[]> {
    const date = new Date();
    date.setDate(date.getDate() - days);

    return this.messageRepository.findMessagesByUserAfterDate(
      userId,
      date,
    );
  }
}