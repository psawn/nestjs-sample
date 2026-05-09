import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { GatewayService } from './gateway.service';
import { LoginDto, RegisterDto } from '../auth/dto';
import { UserProfile } from '../user/entities/user-profile.entity';
import { JwtAuthGuard } from '../common/guards';
import { Public } from '../common/decorators';

@UseGuards(JwtAuthGuard)
@Controller()
export class GatewayController {
  constructor(private readonly gatewayService: GatewayService) {}

  @Public()
  @Post('auth/register')
  async register(@Body() dto: RegisterDto) {
    return this.gatewayService.register(dto);
  }

  @Public()
  @Post('auth/login')
  async login(@Body() dto: LoginDto) {
    return this.gatewayService.login(dto);
  }

  @Get('users/:id')
  async getUser(@Param('id') id: string): Promise<UserProfile | null> {
    return this.gatewayService.getUser(id);
  }
}
