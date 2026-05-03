import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { AuthCredential } from '../entities/auth-credential.entity';
import { IAuthCredentialRepository } from '../interfaces/auth-credential-repository.interface';

@Injectable()
export class AuthCredentialRepository implements IAuthCredentialRepository {
  constructor(
    @InjectRepository(AuthCredential)
    private readonly repository: Repository<AuthCredential>,
  ) {}

  findOneBy(
    where:
      | FindOptionsWhere<AuthCredential>
      | FindOptionsWhere<AuthCredential>[],
  ): Promise<AuthCredential | null> {
    return this.repository.findOneBy(where);
  }

  create(dto: {
    userId: string;
    email: string;
    passwordHash: string;
  }): AuthCredential {
    return this.repository.create(dto);
  }

  save(authCredential: AuthCredential): Promise<AuthCredential> {
    return this.repository.save(authCredential);
  }
}
