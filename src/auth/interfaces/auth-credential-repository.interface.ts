import { FindOptionsWhere } from 'typeorm';
import { AuthCredential } from '../entities/auth-credential.entity';

export interface IAuthCredentialRepository {
  findOneBy(
    where:
      | FindOptionsWhere<AuthCredential>
      | FindOptionsWhere<AuthCredential>[],
  ): Promise<AuthCredential | null>;
  create(dto: {
    userId: string;
    email: string;
    passwordHash: string;
  }): AuthCredential;
  save(authCredential: AuthCredential): Promise<AuthCredential>;
}
