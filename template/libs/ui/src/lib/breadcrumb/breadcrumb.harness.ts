import { ComponentHarness } from '@angular/cdk/testing';

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
    return (await (await this.current())?.text()) ?? '';
  }

  async follow(label: string): Promise<void> {
    for (const link of await this.links()) {
      if ((await link.text()) === label) {
        await link.click();
        return;
      }
    }
  }
}
