import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { filter, merge } from 'rxjs';
import { ConfirmDialogs, type ConfirmDialogText } from '../confirm-dialog/confirm-dialog';
import { Dialog } from '../dialog/dialog';
import { Notice } from '../notice/notice';

/** Why the save failed and what to do, shown above the fields. */
export interface FormDialogError {
  readonly title: string;
  readonly message?: string;
}

/**
 * A form in a dialog (invite, rename, a short record): the fields inside, *Cancel* and the submit button in the
 * footer. Enter or the button submits (`submitted`); while `saving`, the button says so and nothing closes it; a
 * failed save shows `error` right above the buttons and keeps every value. With unsaved changes (`dirty`), closing
 * it (*Cancel*, Escape, outside) asks first, in `discardText`'s words. The page validates, saves, and closes the
 * dialog once saved.
 */
@Component({
  selector: 'ui-form-dialog',
  imports: [Dialog, MatButtonModule, MatProgressSpinnerModule, Notice],
  templateUrl: './form-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
})
export class FormDialog {
  readonly title = input.required<string>();
  readonly supportingText = input('');
  readonly submitLabel = input.required<string>();
  readonly cancelLabel = input.required<string>();
  /** While saving: the submit button's words (*Saving…*), also announced. */
  readonly savingLabel = input.required<string>();
  readonly saving = input(false);
  readonly error = input<FormDialogError>();
  /** The fields differ from what they started with: closing asks before throwing the changes away. */
  readonly dirty = input(false);
  /** The question asked before discarding changes: *Discard changes?*, *Keep editing*, *Discard*. */
  readonly discardText = input<ConfirmDialogText>();

  readonly submitted = output();

  private readonly dialogRef = inject(MatDialogRef, { optional: true });
  private readonly confirmDialogs = inject(ConfirmDialogs);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    const ref = this.dialogRef;
    if (!ref) {
      return;
    }
    // Escape and a click outside close the dialog on their own only when nothing would be lost.
    effect(() => {
      ref.disableClose = this.saving() || this.dirty();
    });
    merge(ref.backdropClick(), ref.keydownEvents().pipe(filter((event) => event.key === 'Escape')))
      .pipe(
        filter(() => ref.disableClose === true),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.close();
      });
  }

  protected submit(event: Event): void {
    event.preventDefault();
    if (!this.saving()) {
      this.submitted.emit();
    }
  }

  /** *Cancel*, Escape or outside: never while saving; after asking, with unsaved changes. */
  protected close(): void {
    const ref = this.dialogRef;
    const discardText = this.discardText();
    if (!ref || this.saving()) {
      return;
    }
    if (!this.dirty() || !discardText) {
      ref.close();
      return;
    }
    this.confirmDialogs
      .ask(discardText)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((discard) => {
        if (discard) {
          ref.close();
        }
      });
  }
}
