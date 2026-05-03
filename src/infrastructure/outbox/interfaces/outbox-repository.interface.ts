import { OutboxEntity, OutboxStatus } from '../entities/outbox.entity';

export interface IOutboxRepository {
  save(entity: Partial<OutboxEntity>): Promise<OutboxEntity>;
  findByStatus(status: OutboxStatus): Promise<OutboxEntity[]>;
  findById(id: string): Promise<OutboxEntity | null>;
  updateStatus(
    id: string,
    status: OutboxStatus,
    processedAt?: Date,
    errorMessage?: string,
  ): Promise<void>;
  incrementRetryCount(id: string, errorMessage?: string): Promise<void>;
  deleteById(id: string): Promise<void>;
}
