import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthCredential } from './entities/auth-credential.entity';
import { OutboxModule } from '../infrastructure/outbox/outbox.module';
import {
  AUTH_CREDENTIAL_REPOSITORY,
  USER_SERVICE_CLIENT,
} from '../common/constants/di-tokens';
import { AuthCredentialRepository } from './repositories/auth-credential.repository';
import { ConfigService } from '@nestjs/config';
import { StringValue } from 'ms';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn:
            configService.get<StringValue>('JWT_ACCESS_EXPIRES') || '1h',
        },
      }),
    }),
    OutboxModule,
    TypeOrmModule.forFeature([AuthCredential]),
    ClientsModule.registerAsync([
      {
        name: USER_SERVICE_CLIENT,
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('USER_SERVICE_HOST') ?? 'localhost',
            port: configService.get<number>('USER_SERVICE_PORT') ?? 4002,
          },
        }),
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: AUTH_CREDENTIAL_REPOSITORY,
      useClass: AuthCredentialRepository,
    },
  ],
  exports: [JwtModule],
})
export class AuthModule {}
