import { Module } from '@nestjs/common';
import { ChatService } from './services/chat.service';
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

@Module({
  imports: [MongooseModule.forFeature([
    { name: Conversation.name, schema: ConversationSchema },
    { name: ChannelsMetadata.name, schema: ChannelsMetadataSchema },
    { name: GroupsMetadata.name, schema: GroupsMetadataSchema },
    { name: Message.name, schema: MessageSchema },

    { name: Participant.name, schema: ParticipantSchema },
  ]),],
  controllers: [ChatController],
  providers: [ChatService, MessagesService, MessageRepository, ChatGateway],
})
export class ChatModule { }
