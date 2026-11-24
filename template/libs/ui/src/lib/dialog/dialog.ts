import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

/**
 * The inside of every dialog: the title, a line under it, the content, and the actions (`uiDialogActions`) in a
 * footer under a divider, at the end. Use it in the component a `MatDialog` opens. For a form, `ui-form-dialog`; to
 * confirm a destructive action, `ConfirmDialogs` (`ui-confirm-dialog`).
 */
@Component({
  selector: 'ui-dialog',
  imports: [MatButtonModule, MatDialogModule, MatIconModule],
  templateUrl: './dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Its parts stay direct children of the dialog's surface, which lays them out (the content scrolls, the rest stays).
  host: { class: 'contents' },
})
export class Dialog {
  readonly title = input.required<string>();
  /** A line under the title: what the dialog is for, when the title alone doesn't say it. */
  readonly supportingText = input('');
  /**
   * A close button in the corner, named for screen readers (*Close*). Only for dialogs that only show something;
   * the rest close from their actions.
   */
  readonly closeLabel = input<string>();
}
