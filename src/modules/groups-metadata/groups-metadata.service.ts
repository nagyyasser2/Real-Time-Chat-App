import { Injectable } from '@nestjs/common';
import { CreateGroupsMetadataDto } from './dto/create-groups-metadata.dto';
import { UpdateGroupsMetadataDto } from './dto/update-groups-metadata.dto';

@Injectable()
export class GroupsMetadataService {
  create(createGroupsMetadataDto: CreateGroupsMetadataDto) {
    return 'This action adds a new groupsMetadata';
  }

  findAll() {
    return `This action returns all groupsMetadata`;
  }

  findOne(id: number) {
    return `This action returns a #${id} groupsMetadata`;
  }

  update(id: number, updateGroupsMetadataDto: UpdateGroupsMetadataDto) {
    return `This action updates a #${id} groupsMetadata`;
  }

  remove(id: number) {
    return `This action removes a #${id} groupsMetadata`;
  }
}
