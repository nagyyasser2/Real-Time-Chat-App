import { Module } from '@nestjs/common';
import { GroupsMetadataService } from './groups-metadata.service';
import { GroupsMetadataController } from './groups-metadata.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  GroupsMetadata,
  GroupsMetadataSchema,
} from './schemas/groups-metadata.schema';
import { GroupsMetadataRepository } from './groups-metadata.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GroupsMetadata.name, schema: GroupsMetadataSchema },
    ]),
  ],
  controllers: [GroupsMetadataController],
  providers: [GroupsMetadataService, GroupsMetadataRepository],
})
export class GroupsMetadataModule { }
