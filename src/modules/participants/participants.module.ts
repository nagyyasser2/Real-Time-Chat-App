import { Module } from '@nestjs/common';
import { ParticipantsService } from './participants.service';
import { ParticipantsController } from './participants.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Participant, ParticipantSchema } from './schemas/participant.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Participant.name, schema: ParticipantSchema }])],
  controllers: [ParticipantsController],
  providers: [ParticipantsService],
})
export class ParticipantsModule { }
