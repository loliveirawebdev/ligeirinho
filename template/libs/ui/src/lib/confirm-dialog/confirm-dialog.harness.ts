import { ComponentHarness } from '@angular/cdk/testing';
import { DialogHarness } from '../dialog/dialog.harness';

/** Answers the confirmation `ConfirmDialogs.ask` opened; find it from the document root (`documentRootLoader`). */
export class ConfirmDialogHarness extends ComponentHarness {
  static readonly hostSelector = 'ui-confirm-dialog';

  private readonly dialog = this.locatorFor(DialogHarness);
  private readonly message = this.locatorFor('mat-dialog-content > p.text-body-medium');
  private readonly cancelButton = this.locatorFor('mat-dialog-actions button:first-child');
  private readonly confirmButton = this.locatorFor('mat-dialog-actions button:last-child');

  async getTitle(): Promise<string> {
    return (await this.dialog()).getTitle();
  }

  async getMessage(): Promise<string> {
    return (await this.message()).text();
  }

  async confirm(): Promise<void> {
    await (await this.confirmButton()).click();
  }

  async cancel(): Promise<void> {
    await (await this.cancelButton()).click();
  }
}
