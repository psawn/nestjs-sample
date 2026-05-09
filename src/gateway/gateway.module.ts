import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { GatewayController } from './gateway.controller';
import { GatewayService } from './gateway.service';
import {
  AUTH_SERVICE_CLIENT,
  USER_SERVICE_CLIENT,
} from '../common/constants/di-tokens';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    ClientsModule.registerAsync([
      {
        name: AUTH_SERVICE_CLIENT,
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              brokers: (
                configService.get<string>('KAFKA_BROKERS') ?? 'localhost:9092'
              ).split(','),
              clientId: 'auth-gateway-client',
              retry: {
                initialRetryTime: 300,
                retries: 10,
              },
            },
            consumer: {
              groupId: 'auth-gateway-consumer',
              allowAutoTopicCreation: true,
            },
          },
        }),
      },
      {
        name: USER_SERVICE_CLIENT,
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              brokers: (
                configService.get<string>('KAFKA_BROKERS') ?? 'localhost:9092'
              ).split(','),
              clientId: 'user-gateway-client',
              retry: {
                initialRetryTime: 300,
                retries: 10,
              },
            },
            consumer: {
              groupId: 'user-gateway-consumer',
              allowAutoTopicCreation: true,
            },
          },
        }),
      },
    ]),
  ],
  controllers: [GatewayController],
  providers: [GatewayService],
})
export class GatewayModule {}
