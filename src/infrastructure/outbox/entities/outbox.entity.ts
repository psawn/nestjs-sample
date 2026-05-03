import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum OutboxStatus {
  PENDING = 'PENDING',
  PROCESSED = 'PROCESSED',
  FAILED = 'FAILED',
}

@Entity('outbox')
@Index(['status', 'createdAt'])
@Index(['aggregateId'])
@Index(['eventType'])
export class OutboxEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('varchar', { length: 255 })
  eventType!: string;

  @Column('uuid')
  aggregateId!: string;

  @Column('jsonb')
  payload!: Record<string, any>;

  @Column('varchar', { length: 50, default: OutboxStatus.PENDING })
  status!: OutboxStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @Column('timestamp', { nullable: true })
  processedAt?: Date;

  @Column('int', { default: 0 })
  retryCount!: number;

  @Column('text', { nullable: true })
  errorMessage?: string;
}
