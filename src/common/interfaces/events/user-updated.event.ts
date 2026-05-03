export interface UserUpdatedEvent {
  eventId: string;
  eventType: 'UserUpdated';
  aggregateId: string;
  timestamp: Date;
  payload: {
    email: string;
    name: string;
  };
}
