import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  linkedSignal,
  output,
  ViewEncapsulation,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export type CalendarEventTone = 'neutral' | 'primary' | 'success' | 'warning' | 'error';

/** Something on a day: a meeting, a due date, a delivery. */
export interface CalendarEvent {
  readonly id: string;
  /** `YYYY-MM-DD`. */
  readonly date: string;
  readonly title: string;
  /** As `ui-tag`'s: success done, warning needs attention, error failed or late, primary highlighted. */
  readonly tone?: CalendarEventTone;
}

interface CalendarDay {
  readonly date: string;
  readonly day: number;
  readonly label: string;
  readonly inMonth: boolean;
  readonly isToday: boolean;
  readonly events: readonly CalendarEvent[];
}

const DAY_MS = 86_400_000;
const MOVES: Partial<Record<string, number>> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };

function toTime(date: string): number {
  return Date.parse(`${date.slice(0, 10)}T00:00:00Z`);
}

function toDate(time: number): string {
  return new Date(time).toISOString().slice(0, 10);
}

function addDays(date: string, days: number): string {
  return toDate(toTime(date) + days * DAY_MS);
}

function localToday(): string {
  const now = new Date();
  return toDate(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

/** The first and last day shown: whole weeks around the month, starting on `weekStart`. */
function gridRange(month: string, weekStart: number): { readonly first: string; readonly count: number } {
  const start = new Date(toTime(`${month}-01`));
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0));
  const lead = (start.getUTCDay() - weekStart + 7) % 7;
  const trail = (weekStart + 6 - end.getUTCDay()) % 7;
  return { first: addDays(`${month}-01`, -lead), count: lead + end.getUTCDate() + trail };
}

/**
 * A month of events (a schedule, deadlines, bookings): the month's name with previous, next and *Today*, the
 * weekdays, and a cell per day with up to `maxEvents` events as colored chips and *+N more*. Days of the months
 * around it are quieter; today is marked. Clicking a day or Enter on it opens it (`dayOpened`), an event opens the
 * event (`eventOpened`); the arrow keys move between days. On phones the grid gets compact, with a dot per event,
 * and the chosen day's events are listed under it. Names come from `Intl` in `locale`, or from `formatMonth`.
 */
@Component({
  selector: 'ui-calendar',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './calendar.html',
  styleUrl: './calendar.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui-calendar block' },
})
export class Calendar {
  /** The month shown first, `YYYY-MM`; the arrows change it from there (`monthChange`). Default: today's. */
  readonly month = input<string>();
  readonly events = input<readonly CalendarEvent[]>([]);
  /** `YYYY-MM-DD`; default, the device's today. */
  readonly today = input<string>();
  /** For the month and weekday names, through `Intl`: `pt-BR`. */
  readonly locale = input('en-US');
  /** The month's title, when `Intl`'s isn't the one: gets `YYYY-MM`. */
  readonly formatMonth = input<(month: string) => string>();
  /** 0 Sunday, 1 Monday. */
  readonly weekStart = input<0 | 1>(0);
  /** Chips per day before *+N more*. */
  readonly maxEvents = input(3);
  readonly previousLabel = input.required<string>();
  readonly nextLabel = input.required<string>();
  readonly todayLabel = input.required<string>();
  /** *+2 more*. */
  readonly moreText = input.required<(count: number) => string>();
  /** On phones, under the grid, when the chosen day has nothing: *Nothing on this day*. */
  readonly noEventsText = input('');

  readonly dayOpened = output<string>();
  readonly eventOpened = output<string>();
  readonly monthChange = output<string>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly todayDate = computed(() => this.today() ?? localToday());
  /** The month shown, `YYYY-MM`. */
  protected readonly shown = linkedSignal(() => this.month() ?? this.todayDate().slice(0, 7));
  /** The day with the roving tab stop, and the one listed under the grid on phones. */
  protected readonly active = linkedSignal(() => {
    const shown = this.shown();
    return this.todayDate().startsWith(shown) ? this.todayDate() : `${shown}-01`;
  });
  private focusPending = false;

  protected readonly title = computed(() => {
    const format = this.formatMonth();
    return format
      ? format(this.shown())
      : new Intl.DateTimeFormat(this.locale(), { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(toTime(`${this.shown()}-01`));
  });

  protected readonly weekdays = computed(() => {
    const { first } = gridRange(this.shown(), this.weekStart());
    const long = new Intl.DateTimeFormat(this.locale(), { weekday: 'long', timeZone: 'UTC' });
    const short = new Intl.DateTimeFormat(this.locale(), { weekday: 'short', timeZone: 'UTC' });
    const narrow = new Intl.DateTimeFormat(this.locale(), { weekday: 'narrow', timeZone: 'UTC' });
    return [0, 1, 2, 3, 4, 5, 6].map((offset) => {
      const time = toTime(addDays(first, offset));
      return { long: long.format(time), short: short.format(time), narrow: narrow.format(time) };
    });
  });

  private readonly eventsByDate = computed(() => {
    const byDate = new Map<string, CalendarEvent[]>();
    for (const event of this.events()) {
      byDate.set(event.date, [...(byDate.get(event.date) ?? []), event]);
    }
    return byDate;
  });

  protected readonly weeks = computed(() => {
    const { first, count } = gridRange(this.shown(), this.weekStart());
    const label = new Intl.DateTimeFormat(this.locale(), { dateStyle: 'full', timeZone: 'UTC' });
    const days = Array.from({ length: count }, (_, index): CalendarDay => {
      const date = addDays(first, index);
      const events = this.eventsByDate().get(date) ?? [];
      return { date, day: Number(date.slice(8)), label: label.format(toTime(date)), inMonth: date.startsWith(this.shown()), isToday: date === this.todayDate(), events };
    });
    return Array.from({ length: count / 7 }, (_, week) => days.slice(week * 7, week * 7 + 7));
  });

  protected readonly activeEvents = computed(() => this.eventsByDate().get(this.active()) ?? []);

  constructor() {
    afterRenderEffect(() => {
      const active = this.active();
      if (this.focusPending) {
        this.focusPending = false;
        this.host.nativeElement.querySelector<HTMLElement>(`[data-date="${active}"]`)?.focus();
      }
    });
  }

  protected moveMonth(step: number): void {
    const [year, month] = this.shown().split('-').map(Number);
    this.show(toDate(Date.UTC(year ?? 0, (month ?? 1) - 1 + step, 1)).slice(0, 7));
  }

  protected goToday(): void {
    this.show(this.todayDate().slice(0, 7));
  }

  protected open(day: CalendarDay): void {
    this.active.set(day.date);
    this.dayOpened.emit(day.date);
  }

  protected openEvent(event: CalendarEvent, click: Event): void {
    click.stopPropagation();
    this.eventOpened.emit(event.id);
  }

  protected key(event: KeyboardEvent, day: CalendarDay): void {
    const move = MOVES[event.key];
    if (move !== undefined) {
      event.preventDefault();
      this.moveTo(addDays(day.date, move));
    } else if ((event.key === 'Enter' || event.key === ' ') && event.target === event.currentTarget) {
      event.preventDefault();
      this.open(day);
    }
  }

  /** Stays on this month while the day is in its grid; past it, shows the day's month. */
  private moveTo(date: string): void {
    const { first, count } = gridRange(this.shown(), this.weekStart());
    if (date < first || date > addDays(first, count - 1)) {
      this.show(date.slice(0, 7));
    }
    this.active.set(date);
    this.focusPending = true;
  }

  private show(month: string): void {
    if (month !== this.shown()) {
      this.shown.set(month);
      this.monthChange.emit(month);
    }
  }
}
