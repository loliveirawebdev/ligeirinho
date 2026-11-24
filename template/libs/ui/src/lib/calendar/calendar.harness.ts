import { ComponentHarness, TestKey } from '@angular/cdk/testing';

/** Reads and drives a `ui-calendar` in tests. Days are found by their `YYYY-MM-DD` date. */
export class CalendarHarness extends ComponentHarness {
  static readonly hostSelector = 'ui-calendar';

  private readonly titleText = this.locatorFor('.ui-calendar-title');
  private readonly previousButton = this.locatorFor('.ui-calendar-previous');
  private readonly nextButton = this.locatorFor('.ui-calendar-next');
  private readonly todayButton = this.locatorFor('.ui-calendar-today');
  private readonly weekdayHeaders = this.locatorForAll('[role="columnheader"]');
  private readonly days = this.locatorForAll('[role="gridcell"]');
  private readonly focusedDay = this.locatorFor('[role="gridcell"][tabindex="0"]');
  private readonly todayCell = this.locatorForOptional('[role="gridcell"][aria-current="date"]');
  private readonly agenda = this.locatorForAll('.ui-calendar-agenda-event');

  async getTitle(): Promise<string> {
    return (await this.titleText()).text();
  }

  /** The weekdays' full names, in the grid's order. */
  async getWeekdays(): Promise<(string | null)[]> {
    return Promise.all((await this.weekdayHeaders()).map((header) => header.getAttribute('aria-label')));
  }

  /** Every date shown, `YYYY-MM-DD`, adjacent months included. */
  async getDates(): Promise<(string | null)[]> {
    return Promise.all((await this.days()).map((day) => day.getAttribute('data-date')));
  }

  /** The dates shown that belong to the months around this one. */
  async getOutsideDates(): Promise<(string | null)[]> {
    return Promise.all((await this.locatorForAll('.ui-calendar-outside')()).map((day) => day.getAttribute('data-date')));
  }

  async getToday(): Promise<string | null> {
    return (await (await this.todayCell())?.getAttribute('data-date')) ?? null;
  }

  /** The day with the tab stop. */
  async getFocusableDate(): Promise<string | null> {
    return (await this.focusedDay()).getAttribute('data-date');
  }

  /** The chips in a day, and its *+N more*, as shown. */
  async getEventTitles(date: string): Promise<string[]> {
    const chips = await this.locatorForAll(`[data-date="${date}"] .ui-calendar-event, [data-date="${date}"] .ui-calendar-more`)();
    return Promise.all(chips.map(async (chip) => (await chip.text()).trim()));
  }

  /** The chosen day's events, listed under the grid on phones. */
  async getAgendaTitles(): Promise<string[]> {
    return Promise.all((await this.agenda()).map(async (event) => (await event.text()).trim()));
  }

  async previous(): Promise<void> {
    await (await this.previousButton()).click();
  }

  async next(): Promise<void> {
    await (await this.nextButton()).click();
  }

  async goToToday(): Promise<void> {
    await (await this.todayButton()).click();
  }

  async openDay(date: string): Promise<void> {
    await (await this.locatorFor(`[data-date="${date}"]`)()).click();
  }

  async openEvent(title: string): Promise<void> {
    for (const chip of await this.locatorForAll('.ui-calendar-event')()) {
      if ((await chip.text()).trim() === title) {
        await chip.click();
        return;
      }
    }
  }

  /** Presses keys on the day with the tab stop. */
  async press(...keys: TestKey[]): Promise<void> {
    for (const key of keys) {
      await (await this.focusedDay()).sendKeys(key);
    }
  }
}
