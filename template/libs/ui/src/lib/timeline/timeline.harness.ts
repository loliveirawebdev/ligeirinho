import { ComponentHarness } from '@angular/cdk/testing';

/** Reads a `ui-timeline` in tests. */
export class TimelineHarness extends ComponentHarness {
  static readonly hostSelector = 'ui-timeline';

  private readonly titles = this.locatorForAll('.ui-timeline-title');
  private readonly list = this.locatorFor('ol');

  /** What screen readers call the list. */
  async getLabel(): Promise<string | null> {
    return (await this.list()).getAttribute('aria-label');
  }

  /** Each event's title, in the order shown. */
  async getTitles(): Promise<string[]> {
    return Promise.all((await this.titles()).map((title) => title.text()));
  }
}
