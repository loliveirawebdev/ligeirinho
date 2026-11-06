import type { Clock } from '@app/tasks-application';

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
