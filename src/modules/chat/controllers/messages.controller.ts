import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query
} from '@nestjs/common';
import { MessagesService } from '../services/messages.service';
import { CreateMessageDto } from '../dtos/create-message.dto';
import { UpdateMessageDto } from '../dtos/update-message.dto';
import { Types } from 'mongoose';
import { MessageStatus } from '../enums/message-status.enum';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) { }

  @Post()
  async create(@Body() createMessageDto: CreateMessageDto) {
    return this.messagesService.create(createMessageDto);
  }

  @Get('conversation/:conversationId')
  async findAllForConversation(
    @Param('conversationId') conversationId: string,
    @Query('skip') skip: string,
    @Query('limit') limit: string,
  ) {
    return this.messagesService.findAllForConversation(
      new Types.ObjectId(conversationId),
      parseInt(skip, 10) || 0,
      parseInt(limit, 10) || 20,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.messagesService.findOne(new Types.ObjectId(id));
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateMessageDto: UpdateMessageDto,
  ) {
    return this.messagesService.update(new Types.ObjectId(id), updateMessageDto);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: MessageStatus,
  ) {
    return this.messagesService.updateStatus(new Types.ObjectId(id), status);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.messagesService.remove(new Types.ObjectId(id));
  }

  @Post(':id/reactions')
  async addReaction(
    @Param('id') id: string,
    @Body('userId') userId: string,
    @Body('emoji') emoji: string,
  ) {
    return this.messagesService.addReaction(
      new Types.ObjectId(id),
      new Types.ObjectId(userId),
      emoji,
    );
  }

  @Get('conversation/:conversationId/count')
  async countMessagesInConversation(@Param('conversationId') conversationId: string) {
    return this.messagesService.countMessagesInConversation(
      new Types.ObjectId(conversationId),
    );
  }

  @Get('history/:userId')
  async getMessageHistory(
    @Param('userId') userId: string,
    @Query('days') days: string,
  ) {
    return this.messagesService.getMessageHistory(
      new Types.ObjectId(userId),
      parseInt(days, 10) || 30,
    );
  }
}