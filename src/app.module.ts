import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MessagesModule } from './modules/messages/messages.module';
import { validationSchema } from './config/schema';
import configuration from './config/configuration';
import { DatabaseModule } from './shared/database/database.module';
import { UsersModule } from './modules/users/users.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { ParticipantsModule } from './modules/participants/participants.module';
import { AuthModule } from './modules/auth/auth.module';
import { ChannelsMetadataModule } from './modules/channels-metadata/channels-metadata.module';
import { GroupsMetadataModule } from './modules/groups-metadata/groups-metadata.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      // validationSchema,
      isGlobal: true,
    }),
    DatabaseModule,
    MessagesModule,
    UsersModule,
    ConversationsModule,
    ParticipantsModule,
    AuthModule,
    ChannelsMetadataModule,
    GroupsMetadataModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
