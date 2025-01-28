import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { User } from '../users/schemas/user.schema';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Types } from 'mongoose';

@Controller('conversations')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) { }

  @Post()
  async create(
    @Body() createDto: CreateConversationDto,
    @CurrentUser() user: User,
  ) {
    return this.conversationsService.create(createDto, user._id);
  }

  @Get(':id')
  async getOne(@Param('id') id: Types.ObjectId) {
    return this.conversationsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: Types.ObjectId,
    @Body() updateDto: UpdateConversationDto,
  ) {
    return this.conversationsService.update(id, updateDto);
  }
}
