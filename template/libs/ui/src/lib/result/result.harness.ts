import { ComponentHarness } from '@angular/cdk/testing';
import type { ResultStatus } from './result';

/** Reads a `ui-result` in tests. */
export class ResultHarness extends ComponentHarness {
  static readonly hostSelector = 'ui-result';

  private readonly heading = this.locatorFor('h1');
  private readonly messageText = this.locatorForOptional('h1 + p');

  async getStatus(): Promise<ResultStatus | null> {
    const status = await (await this.host()).getAttribute('data-status');
    const known: readonly ResultStatus[] = ['success', 'error', 'warning', 'neutral', 'locked', 'not-found'];
    return known.find((item) => item === status) ?? null;
  }

  async getTitle(): Promise<string> {
    return (await this.heading()).text();
  }

  async getMessage(): Promise<string> {
    return (await (await this.messageText())?.text()) ?? '';
  }
}
