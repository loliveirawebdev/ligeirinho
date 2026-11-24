import { ComponentHarness } from '@angular/cdk/testing';

/**
 * Reads a `ui-dialog` in tests. Dialogs open outside the component under test: find it from the document root,
 * `TestbedHarnessEnvironment.documentRootLoader(fixture).getHarness(DialogHarness)`.
 */
export class DialogHarness extends ComponentHarness {
  static readonly hostSelector = 'ui-dialog';

  private readonly heading = this.locatorFor('[mat-dialog-title]');
  private readonly supporting = this.locatorForOptional('mat-dialog-content > p.text-on-surface-variant');
  private readonly actions = this.locatorForAll('mat-dialog-actions button');
  private readonly closeButton = this.locatorForOptional('.ui-dialog-close');

  async getTitle(): Promise<string> {
    return (await this.heading()).text();
  }

  async getSupportingText(): Promise<string> {
    return (await (await this.supporting())?.text()) ?? '';
  }

  /** The footer's buttons, in order: `['Cancel', 'Save']`. */
  async getActionLabels(): Promise<string[]> {
    return Promise.all((await this.actions()).map((action) => action.text()));
  }

  async clickAction(label: string): Promise<void> {
    for (const action of await this.actions()) {
      if ((await action.text()) === label) {
        await action.click();
        return;
      }
    }
  }

  /** The close button in the corner, when the dialog has one. */
  async close(): Promise<void> {
    await (await this.closeButton())?.click();
  }
}
