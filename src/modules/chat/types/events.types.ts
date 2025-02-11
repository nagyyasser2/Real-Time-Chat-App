import { EVENTS } from '../constants/events.constant';

export type EventName = typeof EVENTS[keyof typeof EVENTS][keyof typeof EVENTS[keyof typeof EVENTS]];
