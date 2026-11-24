import { ComponentHarness } from '@angular/cdk/testing';
import { NoticeHarness } from '../notice/notice.harness';
import { DialogHarness } from '../dialog/dialog.harness';

/** Drives a `ui-form-dialog`; find it from the document root (`documentRootLoader`). Fill its fields with their own harnesses. */
export class FormDialogHarness extends ComponentHarness {
  static readonly hostSelector = 'ui-form-dialog';

  private readonly dialog = this.locatorFor(DialogHarness);
  private readonly notice = this.locatorForOptional(NoticeHarness);
  private readonly submitButton = this.locatorFor('.ui-form-dialog-submit');
  private readonly cancelButton = this.locatorFor('mat-dialog-actions button:first-child');

  async getTitle(): Promise<string> {
    return (await this.dialog()).getTitle();
  }

  /** The submit button's words: the action, or the saving line while saving. */
  async getSubmitText(): Promise<string> {
    return (await this.submitButton()).text();
  }

  async isSaving(): Promise<boolean> {
    return (await (await this.submitButton()).getAttribute('aria-disabled')) === 'true';
  }

  /** The failed save's title, or null. */
  async getErrorTitle(): Promise<string | null> {
    const notice = await this.notice();
    return notice ? notice.getTitle() : null;
  }

  async submit(): Promise<void> {
    await (await this.submitButton()).click();
  }

  async cancel(): Promise<void> {
    await (await this.cancelButton()).click();
  }
}
