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
import { ConversationsService } from '../services/conversations.service';
import { CreateConversationDto } from '../dtos/create-conversation.dto';
import { UpdateConversationDto } from '../dtos/update-conversation.dto';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { User } from '../../users/user.schema';
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
    var {participant1 , participant2} = createDto;
    return this.conversationsService.create(participant1, participant2);
  }

  @Get(':id')
  async getOne(@Param('id') id: Types.ObjectId) {
    return this.conversationsService.findOne(id);
  }
}
