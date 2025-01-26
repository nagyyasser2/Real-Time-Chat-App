import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  GroupsMetadata,
  GroupsMetadataDocument,
} from '../schemas/groups-metadata.schema';

@Injectable()
export class ConversationRepository {
  constructor(
    @InjectModel(GroupsMetadata.name)
    private readonly conversationModel: Model<GroupsMetadataDocument>,
  ) {}
}
