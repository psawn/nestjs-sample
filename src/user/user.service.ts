import { Inject, Injectable, Logger } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import { CreateUserDto } from './dto/create-user.dto';
import { UserCreatedEvent, UserEventType } from '../common/events';
import {
  USER_PROFILE_REPOSITORY,
  OUTBOX_REPOSITORY,
} from '../common/constants/di-tokens';
import type { IUserProfileRepository } from './interfaces/user-profile-repository.interface';
import type { IOutboxRepository } from '../infrastructure/outbox/interfaces/outbox-repository.interface';
import { UserProfile } from './entities/user-profile.entity';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @Inject(USER_PROFILE_REPOSITORY)
    private readonly userProfileRepository: IUserProfileRepository,
    @Inject(OUTBOX_REPOSITORY)
    private readonly outboxRepository: IOutboxRepository,
  ) {}

  async createUser(dto: CreateUserDto): Promise<UserProfile> {
    const userId = uuidv7();
    const userProfile = this.userProfileRepository.create({
      userId,
      fullName: dto.name,
    });

    await this.userProfileRepository.save(userProfile);

    const eventId = uuidv7();
    const event: UserCreatedEvent = {
      eventId,
      eventType: UserEventType.Created,
      aggregateId: userId,
      timestamp: new Date(),
      payload: {
        email: dto.email,
        name: dto.name,
      },
    };

    // Save event to outbox instead of emitting directly to Kafka
    await this.outboxRepository.save({
      id: eventId,
      eventType: event.eventType,
      aggregateId: event.aggregateId,
      payload: event.payload,
    });

    return userProfile;
  }

  async getUser(userId: string): Promise<UserProfile | null> {
    return this.userProfileRepository.findOneBy({ userId });
  }

  /**
   * Handles UserCreated event from Kafka with idempotency check
   * This ensures the same event can be safely replayed without duplicates
   */
  async handleUserCreatedEvent(event: UserCreatedEvent): Promise<void> {
    this.logger.log(`Handling UserCreatedEvent for user: ${event.aggregateId}`);

    // Idempotency check: verify user doesn't already exist
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
      fullName: event.payload.name || 'User',
    });

    await this.userProfileRepository.save(userProfile);
    this.logger.log(`User profile created for userId: ${event.aggregateId}`);
  }
}
