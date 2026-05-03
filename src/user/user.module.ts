import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserProfile } from './entities/user-profile.entity';
import { OutboxModule } from '../infrastructure/outbox/outbox.module';
import { USER_PROFILE_REPOSITORY } from '../common/constants/di-tokens';
import { UserProfileRepository } from './repositories/user-profile.repository';

@Module({
  imports: [OutboxModule, TypeOrmModule.forFeature([UserProfile])],
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
