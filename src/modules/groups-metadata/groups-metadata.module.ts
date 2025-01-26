import { Module } from '@nestjs/common';
import { GroupsMetadataService } from './groups-metadata.service';
import { GroupsMetadataController } from './groups-metadata.controller';

@Module({
  controllers: [GroupsMetadataController],
  providers: [GroupsMetadataService],
})
export class GroupsMetadataModule {}
