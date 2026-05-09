import { BaseEvent } from './base-event';
import { UserEventType } from '../constants/events';

export type UserCreateEvent = BaseEvent<
  UserEventType.Create,
  {
    email: string;
    name?: string;
    avatarUrl?: string;
  }
>;
