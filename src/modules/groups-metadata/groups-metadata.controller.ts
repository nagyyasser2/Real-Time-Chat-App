import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { GroupsMetadataService } from './groups-metadata.service';
import { CreateGroupsMetadatumDto } from './dto/create-groups-metadatum.dto';
import { UpdateGroupsMetadatumDto } from './dto/update-groups-metadatum.dto';

@Controller('groups-metadata')
export class GroupsMetadataController {
  constructor(private readonly groupsMetadataService: GroupsMetadataService) {}

  @Post()
  create(@Body() createGroupsMetadatumDto: CreateGroupsMetadatumDto) {
    return this.groupsMetadataService.create(createGroupsMetadatumDto);
  }

  @Get()
  findAll() {
    return this.groupsMetadataService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.groupsMetadataService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateGroupsMetadatumDto: UpdateGroupsMetadatumDto) {
    return this.groupsMetadataService.update(+id, updateGroupsMetadatumDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.groupsMetadataService.remove(+id);
  }
}
