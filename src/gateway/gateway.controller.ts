import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { GatewayService } from './gateway.service';
import { LoginDto, RegisterDto } from '../auth/dto';
import { UserProfile } from '../user/entities/user-profile.entity';

@Controller()
export class GatewayController {
  constructor(private readonly gatewayService: GatewayService) {}

  @Post('auth/register')
  async register(@Body() dto: RegisterDto) {
    return this.gatewayService.register(dto);
  }

  @Post('auth/login')
  async login(@Body() dto: LoginDto) {
    return this.gatewayService.login(dto);
  }

  @Post('users')
  async createUser(@Body() dto: CreateUserDto): Promise<UserProfile> {
    return this.gatewayService.createUser(dto);
  }

  @Get('users/:id')
  async getUser(@Param('id') id: string): Promise<UserProfile | null> {
    return this.gatewayService.getUser(id);
  }
}
