import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

async function bootstrap() {

  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);


  const port = configService.get('port');


  await app.listen(port ?? 3000);

  const url = await app.getUrl();
  Logger.log(`Application is running on: ${url}`);
}
bootstrap();
