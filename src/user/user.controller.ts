import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { UserService } from './user.service';
import { UserProfile } from './entities/user-profile.entity';
import { UserEventType } from '../common/constants/events';
import type { UserCreateEvent } from '../common/events';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @EventPattern(UserEventType.Create)
  async handleUserCreatedEvent(
    @Payload() event: UserCreateEvent,
  ): Promise<void> {
    await this.userService.handleUserCreatedEvent(event);
  }

  @MessagePattern(UserEventType.FindById)
  async getUser(
    @Payload() payload: { userId: string },
  ): Promise<UserProfile | null> {
    return this.userService.getUser(payload.userId);
  }
}
