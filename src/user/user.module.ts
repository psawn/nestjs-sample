import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { UserProfile } from './entities/user-profile.entity';
import { OutboxModule } from '../infrastructure/outbox/outbox.module';
import {
  AUTH_SERVICE_CLIENT,
  USER_PROFILE_REPOSITORY,
} from '../common/constants/di-tokens';
import { UserProfileRepository } from './repositories/user-profile.repository';

@Module({
  imports: [
    OutboxModule,
    TypeOrmModule.forFeature([UserProfile]),
    ClientsModule.registerAsync([
      {
        name: AUTH_SERVICE_CLIENT,
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('AUTH_SERVICE_HOST') ?? 'localhost',
            port: configService.get<number>('AUTH_SERVICE_PORT') ?? 4001,
          },
        }),
      },
    ]),
  ],
  controllers: [UserController],
  providers: [
    UserService,
    {
      provide: USER_PROFILE_REPOSITORY,
      useClass: UserProfileRepository,
    },
  ],
  exports: [UserService],
})
export class UserModule {}
