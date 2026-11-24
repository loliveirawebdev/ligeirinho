import { ChangeDetectionStrategy, Component, computed, inject, InjectionToken, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { defineScenarios } from '@ligeirinho/previewer';
import type { ConfirmDialogText } from '../confirm-dialog/confirm-dialog';
import { FormDialog, type FormDialogError } from './form-dialog';
import { previewDialog } from '../preview-dialog';

interface FormDialogPreviewModel {
  readonly open: string;
  readonly title: string;
  readonly supportingText: string;
  readonly submit: string;
  readonly cancel: string;
  readonly saving: string;
  readonly discard: ConfirmDialogText;
  readonly emailLabel: string;
  readonly roleLabel: string;
  readonly roles: readonly string[];
  /** What the email field starts with; anything typed makes the form dirty. */
  readonly email?: string;
  /** Held in the saving state, to look at it. */
  readonly stayingSaving?: boolean;
  /** Shown from the start, and after every save (the preview's save always fails). */
  readonly error?: FormDialogError;
}

const PREVIEW_MODEL = new InjectionToken<FormDialogPreviewModel>('FormDialogPreviewModel');
const SAVE_TIME_MS = 1200;

@Component({
  selector: 'ui-form-dialog-preview-content',
  imports: [FormDialog, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <ui-form-dialog
      [title]="model.title"
      [supportingText]="model.supportingText"
      [submitLabel]="model.submit"
      [cancelLabel]="model.cancel"
      [savingLabel]="model.saving"
      [saving]="saving()"
      [error]="error()"
      [dirty]="dirty()"
      [discardText]="model.discard"
      (submitted)="save()"
    >
      <div class="flex flex-col gap-4">
        <mat-form-field appearance="outline" subscriptSizing="dynamic">
          <mat-label>{{ model.emailLabel }}</mat-label>
          <input matInput type="email" autocomplete="off" [value]="email()" (input)="type($event)" />
        </mat-form-field>
        <mat-form-field appearance="outline" subscriptSizing="dynamic">
          <mat-label>{{ model.roleLabel }}</mat-label>
          <mat-select [value]="model.roles[0]">
            @for (role of model.roles; track role) {
              <mat-option [value]="role">{{ role }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>
    </ui-form-dialog>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class FormDialogPreviewContent {
  protected readonly model = inject(PREVIEW_MODEL);
  private readonly ref = inject(MatDialogRef);

  protected readonly email = signal(this.model.email ?? '');
  protected readonly saving = signal(this.model.stayingSaving ?? false);
  protected readonly error = signal(this.model.error);
  protected readonly dirty = computed(() => this.email() !== '');

  protected type(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.email.set(event.target.value);
    }
  }

  /** Played as a page would: saves for a moment, then closes, or shows the error again. */
  protected save(): void {
    this.saving.set(true);
    this.error.set(undefined);
    setTimeout(() => {
      this.saving.set(false);
      if (this.model.error) {
        this.error.set(this.model.error);
      } else {
        this.ref.close();
      }
    }, SAVE_TIME_MS);
  }
}

/** Opens the dialog as the scenario loads, like a page would after a click; the button opens it again. */
@Component({
  selector: 'ui-form-dialog-preview',
  imports: [MatButtonModule],
  template: `
    <div class="p-4 sm:p-8">
      <button matButton="outlined" type="button" (click)="open()">{{ model().open }}</button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class FormDialogPreview {
  readonly model = input.required<FormDialogPreviewModel>();

  protected readonly open = previewDialog(this.model, FormDialogPreviewContent, PREVIEW_MODEL);
}

const invite: FormDialogPreviewModel = {
  open: 'Invite member',
  title: 'Invite member',
  supportingText: 'They get an email with a link to join the workspace.',
  submit: 'Send invite',
  cancel: 'Cancel',
  saving: 'Sending…',
  discard: { title: 'Discard this invite?', message: 'The email you typed is lost.', cancel: 'Keep editing', confirm: 'Discard' },
  emailLabel: 'Email',
  roleLabel: 'Role',
  roles: ['Member', 'Administrator', 'Viewer'],
};

export const formDialogScenarios = defineScenarios({
  flow: 'Catalog',
  title: 'Form dialog',
  component: FormDialogPreview,
  scenarios: {
    /** Empty: Cancel, Escape or outside close it right away. Type an email and it asks first. */
    ready: invite,
    /** Something typed: closing asks before throwing it away. */
    dirty: { ...invite, email: 'bruno.lima@northwind.example' },
    saving: { ...invite, email: 'bruno.lima@northwind.example', stayingSaving: true },
    /** The save failed: why, right above the buttons, every value kept. */
    failed: {
      ...invite,
      email: 'bruno.lima@northwind.example',
      error: { title: 'Couldn’t send the invite', message: 'Check your connection and try again.' },
    },
  },
});
