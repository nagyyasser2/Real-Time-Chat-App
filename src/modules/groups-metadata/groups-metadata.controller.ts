import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { GroupsMetadataService } from './groups-metadata.service';
import { CreateGroupsMetadataDto } from './dto/create-groups-metadata.dto';
import { UpdateGroupsMetadataDto } from './dto/update-groups-metadata.dto';

@Controller('groups-metadata')
export class GroupsMetadataController {
  constructor(private readonly groupsMetadataService: GroupsMetadataService) {}

  @Post()
  create(@Body() createGroupsMetadataDto: CreateGroupsMetadataDto) {
    return this.groupsMetadataService.create(createGroupsMetadataDto);
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
  update(
    @Param('id') id: string,
    @Body() updateGroupsMetadataDto: UpdateGroupsMetadataDto,
  ) {
    return this.groupsMetadataService.update(+id, updateGroupsMetadataDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.groupsMetadataService.remove(+id);
  }
}
