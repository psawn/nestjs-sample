import { FindOptionsWhere } from 'typeorm';
import { UserProfile } from '../entities/user-profile.entity';

export interface IUserProfileRepository {
  findOneBy(
    where: FindOptionsWhere<UserProfile> | FindOptionsWhere<UserProfile>[],
  ): Promise<UserProfile | null>;
  create(dto: {
    userId: string;
    fullName: string;
    avatarUrl?: string;
  }): UserProfile;
  save(userProfile: UserProfile): Promise<UserProfile>;
}
