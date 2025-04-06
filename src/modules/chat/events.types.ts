import { EVENTS } from './events.constant';

export type EventName = typeof EVENTS[keyof typeof EVENTS][keyof typeof EVENTS[keyof typeof EVENTS]];
