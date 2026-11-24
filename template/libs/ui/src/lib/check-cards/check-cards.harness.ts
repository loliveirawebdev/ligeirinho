import { ComponentHarness } from '@angular/cdk/testing';

/** Reads and picks `ui-check-cards` options in tests, by their titles. */
export class CheckCardsHarness extends ComponentHarness {
  static readonly hostSelector = 'ui-check-cards';

  private readonly cards = this.locatorForAll('.ui-check-card');

  async getTitles(): Promise<string[]> {
    return Promise.all((await this.cards()).map(async (card) => (await card.text({ exclude: 'mat-icon, .text-body-small, .text-label-medium' })).trim()));
  }

  /** The titles of the options chosen. */
  async getSelectedTitles(): Promise<string[]> {
    const titles: string[] = [];
    for (const card of await this.cards()) {
      if (await card.hasClass('ui-check-card-chosen')) {
        titles.push((await card.text({ exclude: 'mat-icon, .text-body-small, .text-label-medium' })).trim());
      }
    }
    return titles;
  }

  async choose(title: string): Promise<void> {
    for (const card of await this.cards()) {
      if ((await card.text({ exclude: 'mat-icon, .text-body-small, .text-label-medium' })).trim() === title) {
        await card.click();
        return;
      }
    }
  }
}
