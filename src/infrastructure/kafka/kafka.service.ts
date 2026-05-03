import { Inject, Injectable } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { KAFKA_SERVICE } from '../../common/constants/di-tokens';

@Injectable()
export class KafkaService {
  constructor(
    @Inject(KAFKA_SERVICE) private readonly kafkaClient: ClientKafka,
  ) {}

  async emit<T>(topic: string, message: T): Promise<void> {
    await firstValueFrom(this.kafkaClient.emit(topic, message));
  }

  async send<Input, Output>(topic: string, message: Input): Promise<Output> {
    return firstValueFrom(this.kafkaClient.send<Output, Input>(topic, message));
  }
}
