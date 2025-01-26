import { Module } from '@nestjs/common';
import { ParticipantsService } from './services/participants.service';
import { ParticipantsController } from './controllers/participants.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Participant, ParticipantSchema } from './schemas/participant.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Participant.name, schema: ParticipantSchema },
    ]),
  ],
  controllers: [ParticipantsController],
  providers: [ParticipantsService],
})
export class ParticipantsModule {}
