import { ComponentHarness } from '@angular/cdk/testing';

/** Reads a `ui-page-header` in tests: `await loader.getHarness(PageHeaderHarness)`. */
export class PageHeaderHarness extends ComponentHarness {
  static readonly hostSelector = 'ui-page-header';

  private readonly heading = this.locatorFor('h1');
  private readonly supportingLine = this.locatorForOptional('h1 + p');
  private readonly backLabel = this.locatorForOptional('a [data-label]');

  async getTitle(): Promise<string> {
    return (await this.heading()).text();
  }

  async getSupportingText(): Promise<string> {
    return (await this.supportingLine())?.text() ?? '';
  }

  /** The back link's text, or an empty string when there is none. */
  async getBackLabel(): Promise<string> {
    return (await (await this.backLabel())?.text()) ?? '';
  }
}
