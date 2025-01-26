import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { IConfig } from '../../config/interfaces/config.interface';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService<IConfig>) => ({
        uri: configService.get('database').uri,
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}