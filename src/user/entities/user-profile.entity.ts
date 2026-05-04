import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('user_profiles')
export class UserProfile {
  @PrimaryColumn({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @Column({ name: 'full_name' })
  fullName!: string;

  @Column({ name: 'email' })
  email!: string;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl?: string;
}
