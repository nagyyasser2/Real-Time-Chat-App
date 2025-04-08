import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Conversation, ConversationSchema } from './schemas/conversation.schema';
import { Message, MessageSchema } from './schemas/message.schema';
import { MessagesService } from './services/messages.service';
import { MessageRepository } from './repositories/message.repository';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './services/chat.service';
import { RedisStoreService } from './services/redis-store.service';
import { ConversationsService } from './services/conversations.service';
import { UsersService } from '../users/users.service';
import { ConversationRepository } from './repositories/conversation.repository';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name, schema: MessageSchema },
    ]),
    UsersModule
  ],
  controllers: [ChatController],
  providers: [
    MessagesService,
    MessageRepository,
    ChatGateway,
    ChatService, 
    ConversationRepository,
    RedisStoreService,
    ConversationsService,
    UsersService,
  ],
  exports: [ChatService],
})
export class ChatModule { }