import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('auth_credentials')
export class AuthCredential {
  @PrimaryColumn({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @Column({ unique: true, name: 'email' })
  email!: string;

  @Column({ name: 'password_hash' })
  passwordHash!: string;
}
