import { BaseEvent } from './base-event';
import { UserEventType } from '../constants/events';

export type UserCreatedEvent = BaseEvent<
  UserEventType.Created,
  {
    email: string;
    name?: string;
    avatarUrl?: string;
  }
>;
