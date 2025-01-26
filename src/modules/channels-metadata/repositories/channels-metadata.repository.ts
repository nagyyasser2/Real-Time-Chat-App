import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  ChannelsMetadata,
  ChannelsMetadataDocument,
} from '../schemas/channels-metadata.schema';

@Injectable()
export class ConversationRepository {
  constructor(
    @InjectModel(ChannelsMetadata.name)
    private readonly conversationModel: Model<ChannelsMetadataDocument>,
  ) {}
}
