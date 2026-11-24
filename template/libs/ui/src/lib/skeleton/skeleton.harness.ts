import { ComponentHarness } from '@angular/cdk/testing';

/** Reads a `ui-skeleton` in tests. */
export class SkeletonHarness extends ComponentHarness {
  static readonly hostSelector = 'ui-skeleton';

  private readonly labelText = this.locatorFor('.sr-only');
  private readonly rows = this.locatorForAll('.ui-skeleton-row');

  /** What screen readers hear. */
  async getLabel(): Promise<string> {
    return (await this.labelText()).text();
  }

  /** `status`: announced politely, once. */
  async getRole(): Promise<string | null> {
    return (await this.host()).getAttribute('role');
  }

  async getRowCount(): Promise<number> {
    return (await this.rows()).length;
  }
}
