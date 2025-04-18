import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Put,
} from '@nestjs/common';
import { ConversationsService } from '../services/conversations.service';
import { Types } from 'mongoose';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { User } from '../../users/user.schema';
import { MessagesService } from '../services/messages.service';

@Controller('chat')
@UseGuards(AuthGuard('jwt'))
export class ChatController {
  constructor(
    private readonly conversationsService: ConversationsService,
    private readonly messagesService: MessagesService,
  ) {}

  @Get('conversations')
  async getUserConversations(
    @CurrentUser() user: User,
    @Query('skip') skip: string,
    @Query('limit') limit: string,
    @Query('includeArchived') includeArchived: string,
  ) {
    const skipNumber = parseInt(skip) || 0;
    const limitNumber = parseInt(limit) || 10;
    const includeArchivedBool = includeArchived === 'true';

    return await this.conversationsService.findUserConversations(
      user._id,
      skipNumber,
      limitNumber,
      includeArchivedBool,
    );
  }

  @Get('messages/:id')
  async getConversationsMessages(
    @CurrentUser() user: User,
    @Query('skip') skip: string,
    @Query('limit') limit: string,
    @Param('id') conversationId: Types.ObjectId,
  ) {
    const skipNumber = parseInt(skip) || 0;
    const limitNumber = parseInt(limit) || 10;

    return await this.messagesService.findAllForConversation(
      conversationId,
      skipNumber,
      limitNumber,
    );
  }

  @Put('messages/conversation/:id')
  async markMessagesAsRead(
    @CurrentUser() user: User,
    @Param('id') conversationId:string,
  ) {
    return await this.messagesService.markMessagesAsRead(conversationId, user._id);
  }
}
