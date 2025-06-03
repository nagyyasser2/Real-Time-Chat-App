import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ConversationsService } from '../services/conversations.service';
import { CreateConversationDto } from '../dtos/create-conversation.dto';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { User } from '../../users/user.schema';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Types } from 'mongoose';
import { BlockUnblockUserDto } from '../dtos/BlockUnblockUserDto ';

@Controller('conversations')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  async create(
    @Body() createDto: CreateConversationDto,
    @CurrentUser() user: User,
  ) {
    var { participant1, participant2 } = createDto;
    return this.conversationsService.create(participant1, participant2);
  }

  @Get(':id')
  async getOne(@Param('id') id: Types.ObjectId) {
    return this.conversationsService.findOneById(id);
  }
  /**
   * Block a user in a conversation
   */
  @Post(':id/block')
  @ApiOperation({ summary: 'Block a user in a conversation' })
  @ApiResponse({ status: 200, description: 'User blocked successfully' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  @ApiResponse({
    status: 403,
    description: 'Not a participant in conversation',
  })
  @ApiResponse({ status: 409, description: 'User already blocked' })
  async blockUser(
    @Param('id') conversationId: Types.ObjectId,
    @Body() blockDto: BlockUnblockUserDto,
    @CurrentUser() user: any,
  ) {
    const updatedConversation = await this.conversationsService.blockUser(
      conversationId,
      user._id,
      blockDto.targetUserId,
    );

    const blockStatus = await this.conversationsService.getBlockStatus(
      conversationId,
      user._id,
    );

    return {
      message: 'User blocked successfully',
      conversation: updatedConversation,
      blockStatus,
    };
  }

  /**
   * Unblock a user in a conversation
   */
  @Post(':id/unblock')
  @ApiOperation({ summary: 'Unblock a user in a conversation' })
  @ApiResponse({ status: 200, description: 'User unblocked successfully' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  @ApiResponse({
    status: 403,
    description: 'Not a participant in conversation',
  })
  @ApiResponse({ status: 409, description: 'User not blocked' })
  async unblockUser(
    @Param('id') conversationId: Types.ObjectId,
    @Body() unblockDto: BlockUnblockUserDto,
    @CurrentUser() user: any,
  ) {
    const updatedConversation = await this.conversationsService.unblockUser(
      conversationId,
      user._id,
      unblockDto.targetUserId,
    );

    const blockStatus = await this.conversationsService.getBlockStatus(
      conversationId,
      user._id,
    );

    return {
      message: 'User unblocked successfully',
      conversation: updatedConversation,
      blockStatus,
    };
  }

  /**
   * Get block status for a conversation
   */
  @Get(':id/block-status')
  @ApiOperation({ summary: 'Get block status for a conversation' })
  @ApiResponse({
    status: 200,
    description: 'Block status retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async getBlockStatus(
    @Param('id') conversationId: Types.ObjectId,
    @CurrentUser() user: any,
  ) {
    const blockStatus = await this.conversationsService.getBlockStatus(
      conversationId,
      user._id,
    );

    return {
      conversationId,
      ...blockStatus,
    };
  }

  /**
   * Check if current user is blocked in a conversation
   */
  @Get(':id/is-blocked')
  @ApiOperation({ summary: 'Check if current user is blocked in conversation' })
  @ApiResponse({
    status: 200,
    description: 'Block status checked successfully',
  })
  async isUserBlocked(
    @Param('id') conversationId: Types.ObjectId,
    @CurrentUser() user: any,
  ) {
    const isBlocked = await this.conversationsService.isUserBlocked(
      conversationId,
      user._id,
    );

    return {
      conversationId,
      isBlocked,
    };
  }
}
