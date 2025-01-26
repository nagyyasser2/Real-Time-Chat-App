import { PartialType } from '@nestjs/mapped-types';
import { CreateChannelsMetadatumDto } from './create-channels-metadatum.dto';

export class UpdateChannelsMetadatumDto extends PartialType(CreateChannelsMetadatumDto) {}
