export interface UserCreateEvent {
  eventId: string;
  eventType: string;
  aggregateId: string;
  timestamp: Date;
  payload: {
    email: string;
    name?: string;
    avatarUrl?: string;
  };
}
