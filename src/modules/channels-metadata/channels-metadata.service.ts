import { Injectable } from '@nestjs/common';
import { CreateChannelsMetadatumDto } from './dto/create-channels-metadatum.dto';
import { UpdateChannelsMetadatumDto } from './dto/update-channels-metadatum.dto';

@Injectable()
export class ChannelsMetadataService {
  create(createChannelsMetadatumDto: CreateChannelsMetadatumDto) {
    return 'This action adds a new channelsMetadatum';
  }

  findAll() {
    return `This action returns all channelsMetadata`;
  }

  findOne(id: number) {
    return `This action returns a #${id} channelsMetadatum`;
  }

  update(id: number, updateChannelsMetadatumDto: UpdateChannelsMetadatumDto) {
    return `This action updates a #${id} channelsMetadatum`;
  }

  remove(id: number) {
    return `This action removes a #${id} channelsMetadatum`;
  }
}
