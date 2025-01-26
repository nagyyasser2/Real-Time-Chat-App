import { PartialType } from '@nestjs/mapped-types';
import { CreateGroupsMetadatumDto } from './create-groups-metadatum.dto';

export class UpdateGroupsMetadatumDto extends PartialType(CreateGroupsMetadatumDto) {}
