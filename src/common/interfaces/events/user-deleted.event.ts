export interface UserDeletedEvent {
  eventId: string;
  eventType: 'UserDeleted';
  aggregateId: string;
  timestamp: Date;
  payload: {
    email: string;
    name: string;
  };
}
