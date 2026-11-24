import { ComponentHarness } from '@angular/cdk/testing';
import { clickByText, textOf } from '../harness-helpers';

/** Reads and follows a `ui-anchor`'s links in tests, by their labels. */
export class AnchorHarness extends ComponentHarness {
  static readonly hostSelector = 'ui-anchor';

  private readonly nav = this.locatorFor('nav');
  private readonly links = this.locatorForAll('a');
  private readonly currentLink = this.locatorForOptional('a[aria-current="location"]');

  async getLabel(): Promise<string> {
    return (await (await this.nav()).getAttribute('aria-label')) ?? '';
  }

  async getLinkLabels(): Promise<string[]> {
    return Promise.all((await this.links()).map((link) => link.text()));
  }

  /** The label of the section marked as being read, or an empty string. */
  async getCurrentLabel(): Promise<string> {
    return textOf(await this.currentLink());
  }

  async follow(label: string): Promise<void> {
    await clickByText(await this.links(), label);
  }
}
