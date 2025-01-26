import { Injectable } from '@nestjs/common';
import { CreateGroupsMetadatumDto } from './dto/create-groups-metadatum.dto';
import { UpdateGroupsMetadatumDto } from './dto/update-groups-metadatum.dto';

@Injectable()
export class GroupsMetadataService {
  create(createGroupsMetadatumDto: CreateGroupsMetadatumDto) {
    return 'This action adds a new groupsMetadatum';
  }

  findAll() {
    return `This action returns all groupsMetadata`;
  }

  findOne(id: number) {
    return `This action returns a #${id} groupsMetadatum`;
  }

  update(id: number, updateGroupsMetadatumDto: UpdateGroupsMetadatumDto) {
    return `This action updates a #${id} groupsMetadatum`;
  }

  remove(id: number) {
    return `This action removes a #${id} groupsMetadatum`;
  }
}
