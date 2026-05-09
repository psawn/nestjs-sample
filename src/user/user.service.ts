import { Inject, Injectable, Logger } from '@nestjs/common';
import { UserCreateEvent } from '../common/events';
import { USER_PROFILE_REPOSITORY } from '../common/constants/di-tokens';
import type { IUserProfileRepository } from './interfaces/user-profile-repository.interface';
import { UserProfile } from './entities/user-profile.entity';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @Inject(USER_PROFILE_REPOSITORY)
    private readonly userProfileRepository: IUserProfileRepository,
  ) { }

  async getUser(userId: string): Promise<UserProfile | null> {
    return this.userProfileRepository.findOneBy({ userId });
  }

  /**
   * Handles UserCreated event from Kafka with idempotency check
   * This ensures the same event can be safely replayed without duplicates
   */
  async handleUserCreatedEvent(event: UserCreateEvent): Promise<void> {
    this.logger.log(`Handling UserCreateEvent for user: ${event.aggregateId}`);

    const existingUser = await this.userProfileRepository.findOneBy({
      userId: event.aggregateId,
    });

    if (existingUser) {
      this.logger.warn(
        `User profile already exists for userId: ${event.aggregateId}, skipping creation`,
      );
      return;
    }

    // Create new user profile from event data
    const userProfile = this.userProfileRepository.create({
      userId: event.aggregateId,
      fullName: event.payload?.name || 'User',
      email: event.payload?.email,
      avatarUrl: event.payload?.avatarUrl,
    });

    await this.userProfileRepository.save(userProfile);
    this.logger.log(`User profile created for userId: ${event.aggregateId}`);
  }
}
