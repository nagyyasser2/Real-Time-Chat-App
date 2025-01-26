import { PartialType } from '@nestjs/mapped-types';
import { CreateGroupsMetadataDto } from './create-groups-metadata.dto';

export class UpdateGroupsMetadataDto extends PartialType(
  CreateGroupsMetadataDto,
) {}
