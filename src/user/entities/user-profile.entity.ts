import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('user_profiles')
export class UserProfile {
  @PrimaryColumn({ type: 'uuid' })
  userId!: string;

  @Column()
  fullName!: string;

  @Column({ nullable: true })
  avatarUrl?: string;
}
