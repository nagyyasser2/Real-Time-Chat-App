import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ChannelsMetadataService } from '../services/channels-metadata.service';
import { CreateChannelsMetadataDto } from '../dto/create-channels-metadata.dto';
import { UpdateChannelsMetadataDto } from '../dto/update-channels-metadata.dto';

@Controller('channels-metadata')
export class ChannelsMetadataController {
  constructor(
    private readonly channelsMetadataService: ChannelsMetadataService,
  ) {}

  @Post()
  create(@Body() createChannelsMetadataDto: CreateChannelsMetadataDto) {
    return this.channelsMetadataService.create(createChannelsMetadataDto);
  }

  @Get()
  findAll() {
    return this.channelsMetadataService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.channelsMetadataService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateChannelsMetadataDto: UpdateChannelsMetadataDto,
  ) {
    return this.channelsMetadataService.update(+id, updateChannelsMetadataDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.channelsMetadataService.remove(+id);
  }
}
