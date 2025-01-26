import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ChannelsMetadataService } from './channels-metadata.service';
import { CreateChannelsMetadatumDto } from './dto/create-channels-metadatum.dto';
import { UpdateChannelsMetadatumDto } from './dto/update-channels-metadatum.dto';

@Controller('channels-metadata')
export class ChannelsMetadataController {
  constructor(private readonly channelsMetadataService: ChannelsMetadataService) {}

  @Post()
  create(@Body() createChannelsMetadatumDto: CreateChannelsMetadatumDto) {
    return this.channelsMetadataService.create(createChannelsMetadatumDto);
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
  update(@Param('id') id: string, @Body() updateChannelsMetadatumDto: UpdateChannelsMetadatumDto) {
    return this.channelsMetadataService.update(+id, updateChannelsMetadatumDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.channelsMetadataService.remove(+id);
  }
}
