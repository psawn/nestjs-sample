import { FindOptionsWhere } from 'typeorm';
import { UserProfile } from '../entities/user-profile.entity';

export interface IUserProfileRepository {
  findOneBy(
    where: FindOptionsWhere<UserProfile> | FindOptionsWhere<UserProfile>[],
  ): Promise<UserProfile | null>;
  create(dto: Partial<UserProfile>): UserProfile;
  save(userProfile: UserProfile): Promise<UserProfile>;
}
