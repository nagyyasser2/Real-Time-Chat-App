import { Module } from '@nestjs/common';
import { ChannelsMetadataService } from './services/channels-metadata.service';
import { ChannelsMetadataController } from './controllers/channels-metadata.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ChannelsMetadata,
  ChannelsMetadataSchema,
} from './schemas/channels-metadata.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ChannelsMetadata.name, schema: ChannelsMetadataSchema },
    ]),
  ],
  controllers: [ChannelsMetadataController],
  providers: [ChannelsMetadataService],
})
export class ChannelsMetadataModule {}
