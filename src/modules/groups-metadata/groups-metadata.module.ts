import { Module } from '@nestjs/common';
import { GroupsMetadataService } from './services/groups-metadata.service';
import { GroupsMetadataController } from './controllers/groups-metadata.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  GroupsMetadata,
  GroupsMetadataSchema,
} from './schemas/groups-metadata.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GroupsMetadata.name, schema: GroupsMetadataSchema },
    ]),
  ],
  controllers: [GroupsMetadataController],
  providers: [GroupsMetadataService],
})
export class GroupsMetadataModule {}
