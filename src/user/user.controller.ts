import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateUserDto } from './dto/create-user.dto';
import { UserService } from './user.service';
import { UserProfile } from './entities/user-profile.entity';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @MessagePattern('user.create')
  async createUser(@Payload() dto: CreateUserDto): Promise<UserProfile> {
    return this.userService.createUser(dto);
  }

  @MessagePattern('user.findById')
  async getUser(
    @Payload() payload: { userId: string },
  ): Promise<UserProfile | null> {
    return this.userService.getUser(payload.userId);
  }
}
