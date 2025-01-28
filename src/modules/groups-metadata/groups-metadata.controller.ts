import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { GroupsMetadataService } from './groups-metadata.service';
import { CreateGroupsMetadataDto } from './dto/create-groups-metadata.dto';
import { UpdateGroupsMetadataDto } from './dto/update-groups-metadata.dto';
import { JoinSettings } from './enums/join-settings.enum';
import { Types } from 'mongoose';

@Controller('groups-metadata')
export class GroupsMetadataController {
  constructor(private readonly groupsMetadataService: GroupsMetadataService) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createDto: CreateGroupsMetadataDto) {
    return this.groupsMetadataService.create(createDto);
  }

  @Get(':id')
  findOne(@Param('id') conversationId: Types.ObjectId) {
    return this.groupsMetadataService.findOne(conversationId);
  }

  @Patch(':id')
  update(
    @Param('id') conversationId: Types.ObjectId,
    @Body() updateDto: UpdateGroupsMetadataDto,
  ) {
    return this.groupsMetadataService.update(conversationId, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') conversationId: Types.ObjectId) {
    await this.groupsMetadataService.remove(conversationId);
  }

  @Patch(':id/join-settings')
  updateJoinSettings(
    @Param('id') conversationId: Types.ObjectId,
    @Body('setting') newSetting: JoinSettings,
  ) {
    return this.groupsMetadataService.updateJoinSettings(
      conversationId,
      newSetting,
    );
  }

  @Patch(':id/announcement')
  updateAnnouncement(
    @Param('id') conversationId: Types.ObjectId,
    @Body('text') announcement: string,
  ) {
    return this.groupsMetadataService.updateAnnouncement(
      conversationId,
      announcement,
    );
  }

  @Patch(':id/admin-only-posts')
  toggleAdminOnlyPosts(@Param('id') conversationId: Types.ObjectId) {
    return this.groupsMetadataService.toggleAdminOnlyPosts(conversationId);
  }

  @Post(':id/banned-users/:userId')
  banUser(
    @Param('id') conversationId: Types.ObjectId,
    @Param('userId') userId: Types.ObjectId,
  ) {
    return this.groupsMetadataService.banUser(conversationId, userId);
  }

  @Delete(':id/banned-users/:userId')
  unbanUser(
    @Param('id') conversationId: Types.ObjectId,
    @Param('userId') userId: Types.ObjectId,
  ) {
    return this.groupsMetadataService.unbanUser(conversationId, userId);
  }

  @Get(':id/banned-users/:userId')
  checkBanStatus(
    @Param('id') conversationId: Types.ObjectId,
    @Param('userId') userId: Types.ObjectId,
  ) {
    return this.groupsMetadataService.isUserBanned(conversationId, userId);
  }
}