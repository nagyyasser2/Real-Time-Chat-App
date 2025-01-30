import { PartialType } from '@nestjs/mapped-types';
import { CreateChannelsMetadataDto } from './create-channels-metadata.dto';

export class UpdateChannelsMetadataDto extends PartialType(
  CreateChannelsMetadataDto,
) {
  verified?: boolean;
}
