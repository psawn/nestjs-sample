import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { UserProfile } from '../entities/user-profile.entity';
import { IUserProfileRepository } from '../interfaces/user-profile-repository.interface';

@Injectable()
export class UserProfileRepository implements IUserProfileRepository {
  constructor(
    @InjectRepository(UserProfile)
    private readonly repository: Repository<UserProfile>,
  ) {}

  findOneBy(
    where: FindOptionsWhere<UserProfile> | FindOptionsWhere<UserProfile>[],
  ): Promise<UserProfile | null> {
    return this.repository.findOneBy(where);
  }

  create(dto: {
    userId: string;
    fullName: string;
    avatarUrl?: string;
  }): UserProfile {
    return this.repository.create(dto);
  }

  save(userProfile: UserProfile): Promise<UserProfile> {
    return this.repository.save(userProfile);
  }
}
