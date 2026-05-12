import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { KafkaService } from './kafka.service';
import { KAFKA_SERVICE } from '../../common/constants/di-tokens';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: KAFKA_SERVICE,
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              brokers: (
                configService.get<string>('KAFKA_BROKERS') ?? 'localhost:9092'
              ).split(','),
              clientId:
                configService.get<string>('KAFKA_CLIENT_ID') ??
                'nestjs-sample-kafka-client',
              retry: {
                initialRetryTime: 1000,
                retries: 15,
                maxRetryTime: 30000,
                factor: 2,
              },
            },
            producer: {
              allowAutoTopicCreation: true,
            },
          },
        }),
      },
    ]),
  ],
  providers: [KafkaService],
  exports: [KafkaService],
})
export class KafkaModule {}
