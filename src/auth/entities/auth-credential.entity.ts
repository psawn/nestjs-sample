import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('auth_credentials')
export class AuthCredential {
  @PrimaryColumn({ type: 'uuid' })
  userId!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  passwordHash!: string;
}
