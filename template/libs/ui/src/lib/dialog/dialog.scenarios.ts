import { ChangeDetectionStrategy, Component, inject, InjectionToken, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { defineScenarios } from '@ligeirinho/previewer';
import { Dialog } from './dialog';
import { previewDialog } from '../preview-dialog';

interface DialogPreviewModel {
  readonly open: string;
  readonly title: string;
  readonly supportingText?: string;
  readonly closeLabel?: string;
  readonly body: string;
  /** The footer's buttons; the last one is the main action. */
  readonly actions: readonly string[];
}

const PREVIEW_MODEL = new InjectionToken<DialogPreviewModel>('DialogPreviewModel');

@Component({
  selector: 'ui-dialog-preview-content',
  imports: [Dialog, MatButtonModule, MatDialogModule],
  template: `
    <ui-dialog [title]="model.title" [supportingText]="model.supportingText ?? ''" [closeLabel]="model.closeLabel">
      <p class="text-body-medium">{{ model.body }}</p>
      @for (action of model.actions; track action; let last = $last) {
        <button uiDialogActions [matButton]="last ? 'filled' : 'text'" type="button" mat-dialog-close>{{ action }}</button>
      }
    </ui-dialog>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class DialogPreviewContent {
  protected readonly model = inject(PREVIEW_MODEL);
}

/** Opens the dialog as the scenario loads, like a page would after a click; the button opens it again. */
@Component({
  selector: 'ui-dialog-preview',
  imports: [MatButtonModule],
  template: `
    <div class="p-4 sm:p-8">
      <button matButton="outlined" type="button" (click)="open()">{{ model().open }}</button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class DialogPreview {
  readonly model = input.required<DialogPreviewModel>();

  protected readonly open = previewDialog(this.model, DialogPreviewContent, PREVIEW_MODEL);
}

export const dialogScenarios = defineScenarios({
  flow: 'Catalog',
  title: 'Dialog',
  component: DialogPreview,
  scenarios: {
    /** Something to read and decide on: the actions in the footer, under the divider. */
    withActions: {
      open: 'Open dialog',
      title: 'Move to another team?',
      supportingText: 'Ana keeps her role and her open tasks.',
      body: 'Her tasks in Design move with her; the team’s shared views stop showing them.',
      actions: ['Cancel', 'Move'],
    },
    /** Only shows something: closed from the corner, no footer. */
    closeOnly: {
      open: 'Open dialog',
      title: 'Keyboard shortcuts',
      closeLabel: 'Close',
      body: 'Press / to search, N to create a task and ? to see this list again.',
      actions: [],
    },
  },
});
