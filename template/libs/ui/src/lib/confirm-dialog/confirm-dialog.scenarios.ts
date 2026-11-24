import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, untracked } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { defineScenarios } from '@ligeirinho/previewer';
import { ConfirmDialogs, type ConfirmDialogText } from './confirm-dialog';

interface ConfirmDialogPreviewModel {
  /** The button that opens it ends in an ellipsis (rules/design.md). */
  readonly open: string;
  readonly text: ConfirmDialogText;
}

/** Asks as the scenario loads, like a page would after a click; the button asks again. */
@Component({
  selector: 'ui-confirm-dialog-preview',
  imports: [MatButtonModule],
  template: `
    <div class="p-4 sm:p-8">
      <button matButton="outlined" type="button" (click)="ask()">{{ model().open }}</button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ConfirmDialogPreview {
  readonly model = input.required<ConfirmDialogPreviewModel>();

  private readonly confirmDialogs = inject(ConfirmDialogs);
  private readonly dialog = inject(MatDialog);

  constructor() {
    effect(() => {
      this.model();
      untracked(() => {
        this.dialog.closeAll();
        this.ask();
      });
    });
    inject(DestroyRef).onDestroy(() => {
      this.dialog.closeAll();
    });
  }

  protected ask(): void {
    this.confirmDialogs.ask(this.model().text).subscribe();
  }
}

export const confirmDialogScenarios = defineScenarios({
  flow: 'Catalog',
  title: 'Confirm dialog',
  component: ConfirmDialogPreview,
  scenarios: {
    removeMember: {
      open: 'Remove member…',
      text: {
        title: 'Remove Ana Souza?',
        message: 'She loses access to the workspace right away. Her tasks stay, with no one assigned.',
        cancel: 'Cancel',
        confirm: 'Remove member',
      },
    },
  },
});
