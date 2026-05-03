export type EventId = string; // UUID v7

export interface BaseEvent<Type extends string, Payload> {
  eventId: EventId;
  eventType: Type;
  aggregateId: string;
  timestamp: Date;
  payload: Payload;
}
