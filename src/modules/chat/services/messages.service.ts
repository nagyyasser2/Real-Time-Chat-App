import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { MessageRepository } from '../repositories/message.repository';
import { MessageDocument } from '../schemas/message.schema';
import { CreateMessageDto } from '../dtos/create-message.dto';
import { MessageStatus } from '../enums/message-status.enum';
import { UpdateMessageDto } from '../dtos/update-message.dto';

@Injectable()
export class MessagesService {
  constructor(private readonly messageRepository: MessageRepository) {}

  async findMany(arg0: any) {
    return await this.messageRepository.findMany(arg0);
  }

  async create(createMessageDto: CreateMessageDto): Promise<MessageDocument> {
    const message = await this.messageRepository.create({
      ...createMessageDto,
      senderId: new Types.ObjectId(createMessageDto.senderId),
      conversationId: new Types.ObjectId(createMessageDto.conversationId),
    });
    return message;
  }

  async findAllForConversation(
    userId: any,
    conversationId: Types.ObjectId,
    skip: number,
    limit: number,
  ): Promise<any> {
    const result = await this.messageRepository.findByConversation(
      conversationId,
      skip,
      limit,
    );

    const unreadMessageIds = result
      .filter(
        (message) =>
          !message.senderId.equals(userId) &&
          message.status !== MessageStatus.READ,
      )
      .map((message) => message._id);

    if (unreadMessageIds.length > 0) {
      await this.markMultipleAsRead(unreadMessageIds);
    }

    return { messages: result, readMessageIds: unreadMessageIds };
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
    const message = await this.messageRepository.updateStatus(
      messageId,
      status,
    );
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

  async removeMessagesByConversation(
    conversationId: Types.ObjectId,
  ): Promise<void> {
    await this.messageRepository.deleteMany(conversationId);
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

    return this.messageRepository.findMessagesByUserAfterDate(userId, date);
  }

  async markMessageAsRead(
    messageId: Types.ObjectId | string,
  ): Promise<MessageDocument | null> {
    return this.messageRepository.findByIdAndUpdate(
      messageId,
      { status: MessageStatus.READ },
      { new: true },
    );
  }

  async markMultipleAsRead(
    messageIds: (Types.ObjectId | string)[],
  ): Promise<void> {
    await this.messageRepository.updateMany(
      { _id: { $in: messageIds } },
      { status: MessageStatus.READ },
    );
  }

  async markMessagesAsRead(conversationId: string, userId: string) {
    return await this.messageRepository.markMessagesAsRead(
      conversationId,
      userId,
    );
  }
}
