import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { LoginDto, RegisterDto } from '../auth/dto';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { UserProfile } from '../user/entities/user-profile.entity';
import {
  AUTH_SERVICE_CLIENT,
  USER_SERVICE_CLIENT,
} from '../common/constants/di-tokens';

@Injectable()
export class GatewayService {
  constructor(
    @Inject(AUTH_SERVICE_CLIENT)
    private readonly authClient: ClientProxy,
    @Inject(USER_SERVICE_CLIENT)
    private readonly userClient: ClientProxy,
  ) {}

  async register(dto: RegisterDto): Promise<unknown> {
    return firstValueFrom(
      this.authClient
        .send<unknown, RegisterDto>('auth.register', dto)
        .pipe(timeout(5000)),
    );
  }

  async login(dto: LoginDto): Promise<unknown> {
    return firstValueFrom(
      this.authClient
        .send<unknown, LoginDto>('auth.login', dto)
        .pipe(timeout(5000)),
    );
  }

  async createUser(dto: CreateUserDto): Promise<UserProfile> {
    return firstValueFrom(
      this.userClient
        .send<UserProfile, CreateUserDto>('user.create', dto)
        .pipe(timeout(5000)),
    );
  }

  async getUser(userId: string): Promise<UserProfile | null> {
    return firstValueFrom(
      this.userClient
        .send<UserProfile | null, { userId: string }>('user.findById', {
          userId,
        })
        .pipe(timeout(5000)),
    );
  }
}
