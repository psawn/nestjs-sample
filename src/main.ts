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

  // Kafka for Asynchronous Communication
  app.connectMicroservice({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'nestjs-consumer-server',
        brokers: (
          configService.get<string>('KAFKA_BROKERS') ?? 'localhost:9092'
        ).split(','),
        retry: {
          initialRetryTime: 1000,
          retries: 15,
          maxRetryTime: 30000,
          factor: 2,
        },
      },
      consumer: {
        groupId:
          configService.get<string>('KAFKA_CONSUMER_GROUP') ??
          'user-profile-consumer',
        allowAutoTopicCreation: true,
      },
      subscribe: {
        fromBeginning: true,
      },
    },
  });

  // TCP for Synchronous Communication (Auth Service)
  app.connectMicroservice({
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: configService.get<number>('AUTH_SERVICE_PORT') ?? 4001,
    },
  });

  // TCP for Synchronous Communication (User Service)
  app.connectMicroservice({
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: configService.get<number>('USER_SERVICE_PORT') ?? 4002,
    },
  });

  await app.startAllMicroservices();
  await app.listen(configService.get<number>('PORT') ?? 3000);
}
void bootstrap();
