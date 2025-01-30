import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ChannelsMetadataService } from '../services/channels-metadata.service';
import { CreateChannelsMetadataDto } from '../dtos/create-channels-metadata.dto';
import { UpdateChannelsMetadataDto } from '../dtos/update-channels-metadata.dto';
import { Types } from 'mongoose';

@Controller('channels-metadata')
export class ChannelsMetadataController {
  constructor(
    private readonly channelsMetadataService: ChannelsMetadataService,
  ) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createDto: CreateChannelsMetadataDto) {
    return this.channelsMetadataService.create(createDto);
  }

  @Get(':id')
  getChannelMetadata(@Param('id') conversationId: string) {
    return this.channelsMetadataService.findOne(new Types.ObjectId(conversationId));
  }

  @Patch(':id')
  update(
    @Param('id') conversationId: string,
    @Body() updateDto: UpdateChannelsMetadataDto,
  ) {
    return this.channelsMetadataService.update(
      new Types.ObjectId(conversationId),
      updateDto,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') conversationId: string) {
    await this.channelsMetadataService.remove(new Types.ObjectId(conversationId));
  }

  @Put(':id/subscribers/increment')
  incrementSubscribers(@Param('id') conversationId: string) {
    return this.channelsMetadataService.incrementSubscriberCount(
      new Types.ObjectId(conversationId),
    );
  }

  @Put(':id/subscribers/decrement')
  decrementSubscribers(@Param('id') conversationId: string) {
    return this.channelsMetadataService.decrementSubscriberCount(
      new Types.ObjectId(conversationId),
    );
  }

  @Post(':id/broadcasts')
  addBroadcastMessage(
    @Param('id') conversationId: string,
    @Body('messageId') messageId: string,
  ) {
    return this.channelsMetadataService.addBroadcastMessage(
      new Types.ObjectId(conversationId),
      new Types.ObjectId(messageId),
    );
  }

  @Put(':id/views')
  incrementViews(@Param('id') conversationId: string) {
    return this.channelsMetadataService.incrementViews(
      new Types.ObjectId(conversationId),
    );
  }

  @Put(':id/shares')
  incrementShares(@Param('id') conversationId: string) {
    return this.channelsMetadataService.incrementShares(
      new Types.ObjectId(conversationId),
    );
  }

  @Get(':id/broadcasts')
  getBroadcastHistory(
    @Param('id') conversationId: string,
    @Query('limit') limit = 20,
  ) {
    return this.channelsMetadataService.getBroadcastHistory(
      new Types.ObjectId(conversationId),
      limit,
    );
  }
}