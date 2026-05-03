import { Injectable, Inject, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import pLimit from 'p-limit';
import { OutboxStatus } from '../entities/outbox.entity';
import { KafkaService } from '../../kafka/kafka.service';
import { OUTBOX_REPOSITORY } from '../../../common/constants/di-tokens';
import type { IOutboxRepository } from '../interfaces/outbox-repository.interface';

@Injectable()
export class OutboxPublisherService {
  private readonly logger = new Logger(OutboxPublisherService.name);
  private readonly MAX_RETRIES = 3;
  private readonly BATCH_SIZE = 100;
  private readonly CONCURRENCY_LIMIT = 10;

  constructor(
    private readonly kafkaService: KafkaService,
    @Inject(OUTBOX_REPOSITORY)
    private readonly outboxRepository: IOutboxRepository,
  ) {}

  @Interval(5000)
  async publishPendingEvents(): Promise<void> {
    const limit = pLimit(this.CONCURRENCY_LIMIT);

    try {
      let hasMore = true;
      while (hasMore) {
        const pendingEvents = await this.outboxRepository.findByStatus(
          OutboxStatus.PENDING,
        );

        if (pendingEvents.length === 0) {
          hasMore = false;
          break;
        }

        const tasks = pendingEvents.map((event) =>
          limit(async () => {
            try {
              this.logger.debug(
                `Publishing event: ${event.eventType} (ID: ${event.id})`,
              );

              await this.kafkaService.emit(event.eventType, {
                eventId: event.id,
                eventType: event.eventType,
                aggregateId: event.aggregateId,
                timestamp: event.createdAt,
                payload: event.payload,
              });

              await this.outboxRepository.updateStatus(
                event.id,
                OutboxStatus.PROCESSED,
                new Date(),
              );

              this.logger.log(`Event published successfully: ${event.id}`);
            } catch (error) {
              this.logger.warn(
                `Failed to publish event ${event.id}, retry count: ${event.retryCount}`,
                error,
              );

              if (event.retryCount >= this.MAX_RETRIES) {
                await this.outboxRepository.updateStatus(
                  event.id,
                  OutboxStatus.FAILED,
                  new Date(),
                  error instanceof Error ? error.message : 'Unknown error',
                );
                this.logger.error(
                  `Event marked as FAILED after max retries: ${event.id}`,
                );
              } else {
                await this.outboxRepository.incrementRetryCount(
                  event.id,
                  error instanceof Error ? error.message : 'Unknown error',
                );
              }
            }
          }),
        );

        await Promise.all(tasks);
      }
    } catch (error) {
      this.logger.error('Error in publishPendingEvents', error);
    }
  }
}
