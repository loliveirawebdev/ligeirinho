import { ComponentHarness } from '@angular/cdk/testing';

/** Reads a `ui-loading-state` in tests. */
export class LoadingStateHarness extends ComponentHarness {
  static readonly hostSelector = 'ui-loading-state';

  private readonly status = this.locatorFor('[role="status"]');

  async getLabel(): Promise<string> {
    return (await this.status()).text();
  }
}
