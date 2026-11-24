import { ComponentHarness, type TestKey } from '@angular/cdk/testing';
import { expand, isExpanded } from '../harness-helpers';

/** Drives a `ui-cascader` in tests: reads the field, opens the panel and picks along a path, by labels. */
export class CascaderHarness extends ComponentHarness {
  static readonly hostSelector = 'ui-cascader';

  private readonly trigger = this.locatorFor('.ui-cascader-trigger');

  /** What the field shows: the chosen path's labels, *Brazil / São Paulo / Campinas*. */
  async getText(): Promise<string> {
    return (await this.trigger()).getProperty<string>('value');
  }

  async isOpen(): Promise<boolean> {
    return isExpanded(await this.trigger());
  }

  async open(): Promise<void> {
    await expand(await this.trigger());
  }

  /** The labels of each column shown, top level first. */
  async getColumns(): Promise<string[][]> {
    const lists = await this.documentRootLocatorFactory().locatorForAll(`${await this.panelSelector()} [role="listbox"]`)();
    return Promise.all(
      lists.map(async (list, column) => {
        const options = await this.documentRootLocatorFactory().locatorForAll(
          `${await this.panelSelector()} .ui-cascader-column:nth-child(${String(column + 1)}) [role="option"]`,
        )();
        return Promise.all(options.map(async (option) => (await option.text({ exclude: 'mat-icon' })).trim()));
      }),
    );
  }

  /** Opens the panel and clicks each label in turn: `choose('Brazil', 'São Paulo', 'Campinas')`. */
  async choose(...labels: string[]): Promise<void> {
    await this.open();
    for (const label of labels) {
      await this.clickOption(label);
    }
  }

  /** Presses keys where the focus is: the field while closed, the focused option while open. */
  async press(...keys: TestKey[]): Promise<void> {
    for (const key of keys) {
      const target = (await this.isOpen())
        ? await this.documentRootLocatorFactory().locatorForOptional(`${await this.panelSelector()} [role="option"][tabindex="0"]`)()
        : await this.trigger();
      await target?.sendKeys(key);
    }
  }

  private async clickOption(label: string): Promise<void> {
    const options = await this.documentRootLocatorFactory().locatorForAll(`${await this.panelSelector()} [role="option"]`)();
    for (const option of options) {
      if ((await option.text({ exclude: 'mat-icon' })).trim() === label) {
        await option.click();
        return;
      }
    }
  }

  private async panelSelector(): Promise<string> {
    return `#${(await (await this.trigger()).getAttribute('aria-controls')) ?? 'ui-cascader-closed'}`;
  }
}
