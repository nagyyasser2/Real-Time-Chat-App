import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ParticipantsService } from './participants.service';
import { CreateParticipantDto } from './dto/create-participant.dto';
import { UpdateParticipantDto } from './dto/update-participant.dto';
import { Types } from 'mongoose';
import { ParticipantRole } from './enums/participant-role.enum';

@Controller('participants')
export class ParticipantsController {
  constructor(private readonly participantsService: ParticipantsService) { }

  @Post()
  async create(@Body() createDto: CreateParticipantDto) {
    return this.participantsService.create(createDto);
  }

  @Get('conversation/:conversationId')
  async findAllByConversation(@Param('conversationId') conversationId: string) {
    return this.participantsService.findAllByConversation(conversationId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.participantsService.findOne(new Types.ObjectId(id));
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateParticipantDto,
  ) {
    return this.participantsService.update(new Types.ObjectId(id), updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.participantsService.remove(new Types.ObjectId(id));
  }

  @Patch(':id/last-read-message/:messageId')
  async updateLastReadMessage(
    @Param('id') id: string,
    @Param('messageId') messageId: string,
  ) {
    return this.participantsService.updateLastReadMessage(
      new Types.ObjectId(id),
      new Types.ObjectId(messageId),
    );
  }

  @Patch(':id/mute')
  async setMute(
    @Param('id') id: string,
    @Body('mutedUntil') mutedUntil: Date,
  ) {
    return this.participantsService.setMute(new Types.ObjectId(id), mutedUntil);
  }

  @Get(':userId/conversation/:conversationId/role')
  async getConversationRole(
    @Param('userId') userId: string,
    @Param('conversationId') conversationId: string,
  ) {
    return this.participantsService.getConversationRole(
      new Types.ObjectId(userId),
      new Types.ObjectId(conversationId),
    );
  }

  @Get(':userId/conversation/:conversationId/permission')
  async checkUserPermission(
    @Param('userId') userId: string,
    @Param('conversationId') conversationId: string,
    @Query('role') requiredRole: ParticipantRole,
  ) {
    return this.participantsService.checkUserPermission(
      new Types.ObjectId(userId),
      new Types.ObjectId(conversationId),
      requiredRole,
    );
  }
}
