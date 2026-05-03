import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthCredential } from './entities/auth-credential.entity';
import { OutboxModule } from '../infrastructure/outbox/outbox.module';
import { AUTH_CREDENTIAL_REPOSITORY } from '../common/constants/di-tokens';
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
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: AUTH_CREDENTIAL_REPOSITORY,
      useClass: AuthCredentialRepository,
    },
  ],
})
export class AuthModule {}
