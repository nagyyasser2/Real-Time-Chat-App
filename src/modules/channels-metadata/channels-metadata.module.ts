import { Module } from '@nestjs/common';
import { ChannelsMetadataService } from './channels-metadata.service';
import { ChannelsMetadataController } from './channels-metadata.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ChannelsMetadata, ChannelsMetadataSchema } from './schemas/channels-metadatum.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: ChannelsMetadata.name, schema: ChannelsMetadataSchema }])],
  controllers: [ChannelsMetadataController],
  providers: [ChannelsMetadataService],
})
export class ChannelsMetadataModule { }
