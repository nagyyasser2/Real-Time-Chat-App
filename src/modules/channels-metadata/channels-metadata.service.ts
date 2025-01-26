import { Injectable } from '@nestjs/common';
import { CreateChannelsMetadataDto } from './dto/create-channels-metadata.dto';
import { UpdateChannelsMetadataDto } from './dto/update-channels-metadata.dto';

@Injectable()
export class ChannelsMetadataService {
  create(createChannelsMetadataDto: CreateChannelsMetadataDto) {
    return 'This action adds a new channelsMetadata';
  }

  findAll() {
    return `This action returns all channelsMetadata`;
  }

  findOne(id: number) {
    return `This action returns a #${id} channelsMetadata`;
  }

  update(id: number, updateChannelsMetadataDto: UpdateChannelsMetadataDto) {
    return `This action updates a #${id} channelsMetadata`;
  }

  remove(id: number) {
    return `This action removes a #${id} channelsMetadata`;
  }
}
