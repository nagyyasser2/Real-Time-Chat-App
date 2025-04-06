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
import { ChatService } from './services/chat.service';
import { ChannelsMetadataService } from './services/channels-metadata.service';
import { ChannelsMetadataRepository } from './repositories/channels-metadata.repository';
import { RedisStoreService } from './services/redis-store.service';
import { ConversationsService } from './services/conversations.service';
import { UsersService } from '../users/users.service';
import { ConversationRepository } from './repositories/conversation.repository';
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
    ChatService,
    ChannelsMetadataRepository, 
    ConversationRepository,
    RedisStoreService,
    ConversationsService,
    UsersService,
  ],
  exports: [ChatService],
})
export class ChatModule { }