import { Module } from '@nestjs/common';
import { GroupsMetadataService } from './groups-metadata.service';
import { GroupsMetadataController } from './groups-metadata.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { GroupsMetadata, GroupsMetadataSchema } from './schemas/groups-metadatum.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: GroupsMetadata.name, schema: GroupsMetadataSchema }])],
  controllers: [GroupsMetadataController],
  providers: [GroupsMetadataService],
})
export class GroupsMetadataModule { }
