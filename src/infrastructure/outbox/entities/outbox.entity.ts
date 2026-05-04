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
  @PrimaryColumn({ type: 'uuid' })
  id!: string;

  @Column('varchar', { name: 'event_type', length: 255 })
  eventType!: string;

  @Column('uuid', { name: 'aggregate_id' })
  aggregateId!: string;

  @Column('jsonb')
  payload!: Record<string, any>;

  @Column('varchar', { 
    name: 'status', 
    length: 50, 
    default: OutboxStatus.PENDING 
  })
  status!: OutboxStatus;

  @Column('int', { name: 'retry_count', default: 0 })
  retryCount!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Column('timestamp', { name: 'processed_at', nullable: true })
  processedAt?: Date;

  @Column('text', { name: 'error_message', nullable: true })
  errorMessage?: string;
}