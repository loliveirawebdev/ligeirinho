import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { defineScenarios } from '@ligeirinho/previewer';
import { Calendar, type CalendarEvent } from './calendar';

interface CalendarPreviewModel {
  readonly month: string;
  readonly today: string;
  readonly locale: string;
  readonly weekStart: 0 | 1;
  readonly events: readonly CalendarEvent[];
  readonly previousLabel: string;
  readonly nextLabel: string;
  readonly todayLabel: string;
  /** `{count}` becomes the number of events left out. */
  readonly more: string;
  readonly noEvents: string;
  readonly opened: string;
}

@Component({
  selector: 'ui-calendar-preview',
  imports: [Calendar],
  template: `
    <div class="mx-auto max-w-5xl p-4 sm:p-8">
      <ui-calendar
        [month]="model().month"
        [today]="model().today"
        [locale]="model().locale"
        [weekStart]="model().weekStart"
        [events]="model().events"
        [previousLabel]="model().previousLabel"
        [nextLabel]="model().nextLabel"
        [todayLabel]="model().todayLabel"
        [moreText]="moreText"
        [noEventsText]="model().noEvents"
        (dayOpened)="last.set($event)"
        (eventOpened)="last.set($event)"
      />
      <p class="text-body-small mt-3 text-on-surface-variant" aria-live="polite">{{ model().opened }} {{ last() }}</p>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class CalendarPreview {
  readonly model = input.required<CalendarPreviewModel>();
  protected readonly last = signal('');
  protected readonly moreText = (count: number): string => this.model().more.replace('{count}', String(count));
}

const events: readonly CalendarEvent[] = [
  { id: 'kickoff', date: '2026-11-02', title: 'Northwind kickoff', tone: 'primary' },
  { id: 'payroll', date: '2026-11-05', title: 'Payroll', tone: 'warning' },
  { id: 'standup-10', date: '2026-11-10', title: 'Team standup' },
  { id: 'review-10', date: '2026-11-10', title: 'Design review' },
  { id: 'audit', date: '2026-11-13', title: 'Security audit failed', tone: 'error' },
  { id: 'release', date: '2026-11-18', title: 'Release 4.2 shipped', tone: 'success' },
  { id: 'standup-24', date: '2026-11-24', title: 'Team standup' },
  { id: 'demo', date: '2026-11-24', title: 'Client demo – Contoso quarterly business review', tone: 'primary' },
  { id: 'invoice', date: '2026-11-24', title: 'Invoice 0425 due', tone: 'warning' },
  { id: 'one-on-one', date: '2026-11-24', title: '1:1 with Ana' },
  { id: 'retro', date: '2026-11-24', title: 'Sprint retro' },
  { id: 'offsite', date: '2026-11-27', title: 'Team offsite' },
  { id: 'planning', date: '2026-12-01', title: 'Q1 planning', tone: 'primary' },
];

const base: CalendarPreviewModel = {
  month: '2026-11',
  today: '2026-11-24',
  locale: 'en-US',
  weekStart: 0,
  events,
  previousLabel: 'Previous month',
  nextLabel: 'Next month',
  todayLabel: 'Today',
  more: '+{count} more',
  noEvents: 'Nothing on this day.',
  opened: 'Opened:',
};

export const calendarScenarios = defineScenarios({
  flow: 'Catalog',
  title: 'Calendar',
  component: CalendarPreview,
  scenarios: {
    /** A busy month: a crowded day with +2 more, every tone, an event in the next month's first days. */
    month: base,
    /** Nothing scheduled yet. */
    empty: { ...base, events: [] },
    /** Names from Intl in Portuguese, the week starting on Monday. */
    portuguese: {
      ...base,
      locale: 'pt-BR',
      weekStart: 1,
      previousLabel: 'Mês anterior',
      nextLabel: 'Próximo mês',
      todayLabel: 'Hoje',
      more: '+{count}',
      noEvents: 'Nada neste dia.',
      opened: 'Aberto:',
    },
  },
});
