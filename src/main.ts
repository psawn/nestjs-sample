import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  app.connectMicroservice({
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: (
          configService.get<string>('KAFKA_BROKERS') ?? 'localhost:9092'
        ).split(','),
        retry: {
          initialRetryTime: 300,
          retries: 10,
        },
      },
      consumer: {
        groupId:
          configService.get<string>('KAFKA_CONSUMER_GROUP') ??
          'user-profile-consumer',
        allowAutoTopicCreation: true,
      },
    },
  });

  await app.startAllMicroservices();
  await app.listen(configService.get<number>('PORT') ?? 3000);
}
void bootstrap();
