import { ChangeDetectionStrategy, Component, inject, Injectable, InjectionToken, Injector } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { map, type Observable } from 'rxjs';
import { Dialog } from '../dialog/dialog';

/** The confirmation's words, from the screen's copy (rules/design.md, destructive actions). */
export interface ConfirmDialogText {
  /** The question: *Remove Ana Souza?* */
  readonly title: string;
  /** What happens, and whether it can be undone. */
  readonly message: string;
  /** *Cancel*. */
  readonly cancel: string;
  /** The verb and its object again: *Remove member*. */
  readonly confirm: string;
}

const CONFIRM_DIALOG_TEXT = new InjectionToken<ConfirmDialogText>('ConfirmDialogText');

/** The confirmation `ConfirmDialogs.ask` opens; not used in templates. */
@Component({
  selector: 'ui-confirm-dialog',
  imports: [Dialog, MatButtonModule, MatDialogModule],
  templateUrl: './confirm-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialog {
  protected readonly text = inject(CONFIRM_DIALOG_TEXT);
}

/**
 * Asks before a destructive action: a dialog with the question, what happens, *Cancel* (focused first, the safe
 * choice) and the confirm button. `ask` answers true only when the user confirms; closing it any other way is no.
 */
@Injectable({ providedIn: 'root' })
export class ConfirmDialogs {
  private readonly dialog = inject(MatDialog);
  private readonly injector = inject(Injector);

  ask(text: ConfirmDialogText): Observable<boolean> {
    return this.dialog
      .open<ConfirmDialog, unknown, boolean>(ConfirmDialog, {
        injector: Injector.create({ providers: [{ provide: CONFIRM_DIALOG_TEXT, useValue: text }], parent: this.injector }),
        width: '420px',
      })
      .afterClosed()
      .pipe(map((answer) => answer === true));
  }
}
