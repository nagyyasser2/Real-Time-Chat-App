import { Module } from '@nestjs/common';
import { ParticipantsController } from './participants.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Participant, ParticipantSchema } from './schemas/participant.schema';
import { ParticipantsService } from './participants.service';
import { ParticipantsRepository } from './participants.repository';
import { ConversationsService } from '../conversations/conversations.service';
import { ConversationsModule } from '../conversations/conversations.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Participant.name, schema: ParticipantSchema },
    ]),
    ConversationsModule
  ],
  controllers: [ParticipantsController],
  providers: [ParticipantsService, ParticipantsRepository, ConversationsService],
  exports: [ParticipantsService, ParticipantsRepository],
})
export class ParticipantsModule { }
