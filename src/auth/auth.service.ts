import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v7 as uuidv7 } from 'uuid';
import { LoginDto, RegisterDto } from './dto';
import { UserCreateEvent, UserEventType } from '../common/events';
import {
  OUTBOX_REPOSITORY,
  AUTH_CREDENTIAL_REPOSITORY,
} from '../common/constants/di-tokens';
import type { IOutboxRepository } from '../infrastructure/outbox/interfaces/outbox-repository.interface';
import type { IAuthCredentialRepository } from './interfaces/auth-credential-repository.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(OUTBOX_REPOSITORY)
    private readonly outboxRepository: IOutboxRepository,
    @Inject(AUTH_CREDENTIAL_REPOSITORY)
    private readonly authCredentialRepository: IAuthCredentialRepository,
  ) {}

  async register(dto: RegisterDto) {
    const existingCredential = await this.authCredentialRepository.findOneBy({
      email: dto.email,
    });

    if (existingCredential) {
      throw new ConflictException('Email already registered');
    }

    const userId = uuidv7();
    const passwordHash = await bcrypt.hash(dto.password, 10);

    const credential = this.authCredentialRepository.create({
      userId,
      email: dto.email,
      passwordHash,
    });

    await this.authCredentialRepository.save(credential);

    const eventId = uuidv7();
    const event: UserCreateEvent = {
      eventId,
      eventType: UserEventType.Create,
      aggregateId: userId,
      timestamp: new Date(),
      payload: {
        email: dto.email,
        name: dto.name,
        avatarUrl: dto.avatarUrl,
      },
    };

    // Save event to outbox instead of emitting directly to Kafka
    await this.outboxRepository.save({
      id: eventId,
      eventType: event.eventType,
      aggregateId: event.aggregateId,
      payload: event.payload,
    });

    return {
      accessToken: this.jwtService.sign({ sub: userId, email: dto.email }),
    };
  }

  async login(dto: LoginDto) {
    const credential = await this.authCredentialRepository.findOneBy({
      email: dto.email,
    });
    if (!credential) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(
      dto.password,
      credential.passwordHash,
    );
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: credential.userId, email: credential.email };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
}
