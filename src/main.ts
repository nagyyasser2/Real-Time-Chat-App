import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { redisConfig } from './config/redis.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get('port');


  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const config = new DocumentBuilder()
    .setTitle('Sahab API')
    .setDescription('Real Time Chat Application')
    .setVersion('1.0')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);
  await app.listen(port ?? 3000);

  const url = await app.getUrl();
  Logger.log(`Application is running on: ${url}`);
}
bootstrap();
