import { Module } from '@nestjs/common';
import { ChannelsMetadataService } from './channels-metadata.service';
import { ChannelsMetadataController } from './channels-metadata.controller';

@Module({
  controllers: [ChannelsMetadataController],
  providers: [ChannelsMetadataService],
})
export class ChannelsMetadataModule {}
