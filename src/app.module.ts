import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MessagesModule } from './messages/messages.module';
import { validationSchema } from './config/schema';
import configuration from './config/configuration';
import { DatabaseModule } from './shared/database/database.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      // validationSchema,
      isGlobal: true,
    }),
    DatabaseModule,
    MessagesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
