import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OutboxEntity } from './entities/outbox.entity';
import { OutboxRepository } from './repositories/outbox.repository';
import { OutboxPublisherService } from './services/outbox-publisher.service';
import { KafkaModule } from '../kafka/kafka.module';
import { OUTBOX_REPOSITORY } from '../../common/constants/di-tokens';

@Module({
  imports: [TypeOrmModule.forFeature([OutboxEntity]), KafkaModule],
  providers: [
    OutboxPublisherService,
    {
      provide: OUTBOX_REPOSITORY,
      useClass: OutboxRepository,
    },
  ],
  exports: [OUTBOX_REPOSITORY, OutboxPublisherService],
})
export class OutboxModule {}
