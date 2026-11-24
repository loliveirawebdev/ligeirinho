import { type BaseHarnessFilters, ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';

export interface PanelHarnessFilters extends BaseHarnessFilters {
  readonly title?: string;
}

/** Reads a `ui-panel` in tests; `with({ title })` finds one by its title. */
export class PanelHarness extends ComponentHarness {
  static readonly hostSelector = 'ui-panel';

  private readonly heading = this.locatorForOptional('.ui-panel-header h2');

  static with(options: PanelHarnessFilters = {}): HarnessPredicate<PanelHarness> {
    return new HarnessPredicate(PanelHarness, options).addOption('title', options.title, async (harness, title) =>
      HarnessPredicate.stringMatches(harness.getTitle(), title),
    );
  }

  async getTitle(): Promise<string> {
    return (await (await this.heading())?.text()) ?? '';
  }

  /** `row` or `column` when it splits into panels, else null. */
  async getSplit(): Promise<string | null> {
    return (await this.host()).getAttribute('data-split');
  }

  /** The titles of the panels directly inside a split. */
  async getPanelTitles(): Promise<string[]> {
    const inner = await this.locatorForAll(PanelHarness)();
    const titles = await Promise.all(inner.map((panel) => panel.getTitle()));
    return titles.filter(Boolean);
  }
}
