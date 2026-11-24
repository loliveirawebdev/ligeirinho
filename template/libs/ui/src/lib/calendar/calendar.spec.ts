import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { TestKey } from '@angular/cdk/testing';
import { render } from '@testing-library/angular';
import { Calendar, type CalendarEvent } from './calendar';
import { CalendarHarness } from './calendar.harness';

const events: CalendarEvent[] = [
  { id: 'standup', date: '2026-11-24', title: 'Standup', tone: 'primary' },
  { id: 'review', date: '2026-11-24', title: 'Design review' },
  { id: 'invoice', date: '2026-11-24', title: 'Invoice due', tone: 'warning' },
  { id: 'demo', date: '2026-11-24', title: 'Client demo', tone: 'success' },
  { id: 'deploy', date: '2026-11-26', title: 'Deploy' },
];

interface Opened {
  readonly days: string[];
  readonly events: string[];
  readonly months: string[];
}

async function setup(): Promise<{ calendar: CalendarHarness; opened: Opened }> {
  const opened: Opened = { days: [], events: [], months: [] };
  const { fixture } = await render(Calendar, {
    inputs: {
      events,
      today: '2026-11-24',
      maxEvents: 2,
      previousLabel: 'Previous month',
      nextLabel: 'Next month',
      todayLabel: 'Today',
      moreText: (count: number) => `+${String(count)} more`,
    },
    on: {
      dayOpened: (date: string) => opened.days.push(date),
      eventOpened: (id: string) => opened.events.push(id),
      monthChange: (month: string) => opened.months.push(month),
    },
  });
  return { calendar: await TestbedHarnessEnvironment.harnessForFixture(fixture, CalendarHarness), opened };
}

describe('calendar', () => {
  it('shows the month in whole weeks, the days around it muted, today marked, and its events with +N more', async () => {
    const { calendar } = await setup();
    expect(await calendar.getTitle()).toBe('November 2026');
    expect((await calendar.getWeekdays())[0]).toBe('Sunday');
    const dates = await calendar.getDates();
    expect([dates[0], dates.at(-1), dates.length]).toEqual(['2026-11-01', '2026-12-05', 35]);
    expect(await calendar.getOutsideDates()).toEqual(['2026-12-01', '2026-12-02', '2026-12-03', '2026-12-04', '2026-12-05']);
    expect(await calendar.getToday()).toBe('2026-11-24');
    expect(await calendar.getEventTitles('2026-11-24')).toEqual(['Standup', 'Design review', '+2 more']);
  });

  it('opens a day or an event on click, and lists the chosen day’s events for phones', async () => {
    const { calendar, opened } = await setup();
    await calendar.openEvent('Deploy');
    expect(opened.events).toEqual(['deploy']);
    expect(opened.days).toEqual([]);
    await calendar.openDay('2026-11-26');
    expect(opened.days).toEqual(['2026-11-26']);
    expect(await calendar.getAgendaTitles()).toEqual(['Deploy']);
  });

  it('moves between days with the arrow keys, past the grid into the next month, and opens the day on Enter', async () => {
    const { calendar, opened } = await setup();
    expect(await calendar.getFocusableDate()).toBe('2026-11-24');
    await calendar.press(TestKey.DOWN_ARROW, TestKey.LEFT_ARROW);
    expect(await calendar.getFocusableDate()).toBe('2026-11-30');
    expect(await calendar.getTitle()).toBe('November 2026');
    await calendar.press(TestKey.RIGHT_ARROW, TestKey.DOWN_ARROW, TestKey.ENTER);
    expect(await calendar.getTitle()).toBe('December 2026');
    expect(opened.months).toEqual(['2026-12']);
    expect(opened.days).toEqual(['2026-12-08']);
  });

  it('changes month from the arrows and comes back with Today', async () => {
    const { calendar, opened } = await setup();
    await calendar.previous();
    expect(await calendar.getTitle()).toBe('October 2026');
    await calendar.goToToday();
    expect(await calendar.getTitle()).toBe('November 2026');
    expect(opened.months).toEqual(['2026-10', '2026-11']);
  });
});
