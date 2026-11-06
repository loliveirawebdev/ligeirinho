import type { Clock } from '../lib/ports';

export class FixedClock implements Clock {
  constructor(private currentTime: Date) {}

  now(): Date {
    return this.currentTime;
  }

  advanceBy(milliseconds: number): void {
    this.currentTime = new Date(this.currentTime.getTime() + milliseconds);
  }
}
