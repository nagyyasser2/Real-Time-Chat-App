import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Conversation, ConversationSchema } from './schemas/conversation.schema';
import { ChannelsMetadata, ChannelsMetadataSchema } from './schemas/channels-metadata.schema';
import { GroupsMetadata, GroupsMetadataSchema } from './schemas/groups-metadata.schema';
import { Message, MessageSchema } from './schemas/message.schema';
import { Participant, ParticipantSchema } from './schemas/participant.schema';
import { MessagesService } from './services/messages.service';
import { MessageRepository } from './repositories/message.repository';
import { ChatGateway } from './chat.gateway';
import { ChannelsMetadataService } from './services/channels-metadata.service';
import { ChannelsMetadataRepository } from './repositories/channels-metadata.repository'; // <-- Import the repository
import { RedisStoreService } from './services/redis-store.service';
import { ConversationsService } from './services/conversations.service';
import { UsersService } from '../users/services/users.service';
import { ConversationRepository } from './repositories/conversation.repository';
import { UserRepository } from '../users/repositories/user.repository';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: ChannelsMetadata.name, schema: ChannelsMetadataSchema },
      { name: GroupsMetadata.name, schema: GroupsMetadataSchema },
      { name: Message.name, schema: MessageSchema },
      { name: Participant.name, schema: ParticipantSchema },
    ]),
    UsersModule
  ],
  controllers: [ChatController],
  providers: [
    ChannelsMetadataService,
    MessagesService,
    MessageRepository,
    ChatGateway,
    ChannelsMetadataRepository, 
    ConversationRepository,
    RedisStoreService,
    ConversationsService,
    UsersService,
  ],
})
export class ChatModule { }
