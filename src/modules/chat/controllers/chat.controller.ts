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
import { ChatService } from '../services/chat.service';
import { UsersService } from 'src/modules/users/users.service';

@Controller('chats')
@UseGuards(AuthGuard('jwt'))
export class ChatController {
  constructor(
    private readonly conversationsService: ConversationsService,
    private readonly messagesService: MessagesService,
    private readonly chatService: ChatService,
    private readonly usersService: UsersService,
  ) {}

  @Post()
  async create(@CurrentUser() userInfo: any, @Body() payload: any) {
    const newConversation = await this.chatService.createNewConversation(
      userInfo._id,
      payload.receiverId,
    );

    const receiver = await this.usersService.findOne(
      payload.receiverId,
      payload.projection,
    );

    const {
      _id,
      conversationKey,
      isActive,
      lastActivityAt,
      blockedBy,
      isArchived,
      messageCount,
      lastMessage,
      unreadMessagesCount,
    } = newConversation;

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
      otherParticipant: receiver,
    };
  }
  // Fetch user conversations.
  @Get()
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

  // Fetch conversation messages.
  @Get('conversationmessages/:conversationId')
  async getConversationsMessages(
    @CurrentUser() user: User,
    @Query('skip') skip: string,
    @Query('limit') limit: string,
    @Param('conversationId') conversationId: Types.ObjectId,
    @Body() body: any,
  ) {
    const skipNumber = parseInt(skip) || 0;
    const limitNumber = parseInt(limit) || 10;

    var userId = new Types.ObjectId(user._id);
    var { receiverId } = body;
    return await this.chatService.loadMsgsAndMarkThem(
      userId,
      receiverId,
      conversationId,
      skipNumber,
      limitNumber,
    );
  }

  @Put('messages/conversation/:id')
  async markMessagesAsRead(
    @CurrentUser() user: User,
    @Param('id') conversationId: string,
  ) {
    return await this.messagesService.markMessagesAsRead(
      conversationId,
      user._id,
    );
  }
}
