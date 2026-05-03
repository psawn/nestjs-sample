import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OutboxEntity, OutboxStatus } from '../entities/outbox.entity';
import { IOutboxRepository } from '../interfaces/outbox-repository.interface';

@Injectable()
export class OutboxRepository implements IOutboxRepository {
  constructor(
    @InjectRepository(OutboxEntity)
    private readonly repository: Repository<OutboxEntity>,
  ) {}

  async save(entity: Partial<OutboxEntity>): Promise<OutboxEntity> {
    return this.repository.save(entity);
  }

  async findByStatus(status: OutboxStatus): Promise<OutboxEntity[]> {
    return this.repository.find({
      where: { status },
      order: { createdAt: 'ASC' },
      take: 100,
    });
  }

  async findById(id: string): Promise<OutboxEntity | null> {
    return this.repository.findOneBy({ id });
  }

  async updateStatus(
    id: string,
    status: OutboxStatus,
    processedAt?: Date,
    errorMessage?: string,
  ): Promise<void> {
    await this.repository.update(
      { id },
      {
        status,
        processedAt: processedAt || new Date(),
        errorMessage,
      },
    );
  }

  async incrementRetryCount(id: string, errorMessage?: string): Promise<void> {
    await this.repository.increment({ id }, 'retryCount', 1);
    if (errorMessage) {
      await this.repository.update({ id }, { errorMessage });
    }
  }

  async deleteById(id: string): Promise<void> {
    await this.repository.delete({ id });
  }
}
