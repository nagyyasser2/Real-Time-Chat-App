import { PartialType } from '@nestjs/mapped-types';
import { CreateGroupsMetadataDto } from './create-groups-metadata.dto';
import { JoinSettings } from '../enums/join-settings.enum';

export class UpdateGroupsMetadataDto extends PartialType(
  CreateGroupsMetadataDto,
) {
  joinSettings?: JoinSettings;
  announcement?: string;
  adminOnlyPosts?: boolean;
}
