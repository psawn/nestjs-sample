export interface UserCreatedEvent {
  eventId: string;
  eventType: 'UserCreated';
  aggregateId: string;
  timestamp: Date;
  payload: {
    email: string;
    name?: string;
    avatarUrl?: string;
  };
}
