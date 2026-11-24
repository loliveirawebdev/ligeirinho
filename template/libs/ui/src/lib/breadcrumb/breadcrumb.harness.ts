import { ComponentHarness } from '@angular/cdk/testing';
import { clickByText, textOf } from '../harness-helpers';

/** Reads and follows a `ui-breadcrumb` in tests. */
export class BreadcrumbHarness extends ComponentHarness {
  static readonly hostSelector = 'ui-breadcrumb';

  private readonly items = this.locatorForAll('li a, li span');
  private readonly links = this.locatorForAll('li a');
  private readonly current = this.locatorForOptional('[aria-current="page"]');

  /** Every level, in order, the page last. */
  async getLabels(): Promise<string[]> {
    return Promise.all((await this.items()).map((item) => item.text()));
  }

  async getCurrent(): Promise<string> {
    return textOf(await this.current());
  }

  async follow(label: string): Promise<void> {
    await clickByText(await this.links(), label);
  }
}
