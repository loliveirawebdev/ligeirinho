import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatDialog, type MatDialogRef } from '@angular/material/dialog';
import { render } from '@testing-library/angular';
import { ConfirmDialogHarness } from '../confirm-dialog/confirm-dialog.harness';
import { FormDialog, type FormDialogError } from './form-dialog';
import { FormDialogHarness } from './form-dialog.harness';

@Component({ template: '', changeDetection: ChangeDetectionStrategy.OnPush })
class Page {}

@Component({
  imports: [FormDialog],
  template: `
    <ui-form-dialog
      [title]="title"
      [submitLabel]="submitLabel"
      [cancelLabel]="cancelLabel"
      [savingLabel]="savingLabel"
      [saving]="saving()"
      [error]="error()"
      [dirty]="dirty()"
      [discardText]="discardText"
      (submitted)="submits.update((count) => count + 1)"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class InviteDialog {
  readonly title = 'Invite member';
  readonly submitLabel = 'Invite';
  readonly cancelLabel = 'Cancel';
  readonly savingLabel = 'Inviting…';
  readonly discardText = { title: 'Discard changes?', message: 'The email is lost.', cancel: 'Keep editing', confirm: 'Discard' };
  readonly saving = signal(false);
  readonly error = signal<FormDialogError | undefined>(undefined);
  readonly dirty = signal(false);
  readonly submits = signal(0);
}

async function open(): Promise<{
  ref: MatDialogRef<InviteDialog>;
  form: FormDialogHarness;
  loader: ReturnType<typeof TestbedHarnessEnvironment.documentRootLoader>;
  isClosed: () => boolean;
}> {
  const { fixture } = await render(Page);
  const ref = TestBed.inject(MatDialog).open(InviteDialog);
  let closed = false;
  ref.afterClosed().subscribe(() => (closed = true));
  const loader = TestbedHarnessEnvironment.documentRootLoader(fixture);
  return { ref, form: await loader.getHarness(FormDialogHarness), loader, isClosed: () => closed };
}

describe('form dialog', () => {
  it('submits from its button and closes from Cancel', async () => {
    const { ref, form, isClosed } = await open();
    expect(await form.getTitle()).toBe('Invite member');
    await form.submit();
    expect(ref.componentInstance.submits()).toBe(1);
    await form.cancel();
    await vi.waitFor(() => {
      expect(isClosed()).toBe(true);
    });
  });

  it('while saving, says so, ignores another submit and stays open', async () => {
    const { ref, form, isClosed } = await open();
    ref.componentInstance.saving.set(true);
    expect(await form.isSaving()).toBe(true);
    expect(await form.getSubmitText()).toBe('Inviting…');
    await form.submit();
    await form.cancel();
    expect(ref.componentInstance.submits()).toBe(0);
    expect(isClosed()).toBe(false);
  });

  it('shows why the save failed above the fields', async () => {
    const { ref, form } = await open();
    ref.componentInstance.error.set({ title: "Couldn't send the invite" });
    expect(await form.getErrorTitle()).toBe("Couldn't send the invite");
  });

  it('with unsaved changes, asks before closing, and closes only when discarded', async () => {
    const { ref, form, loader, isClosed } = await open();
    ref.componentInstance.dirty.set(true);
    await form.cancel();
    await (await loader.getHarness(ConfirmDialogHarness)).cancel();
    await vi.waitFor(async () => {
      expect(await loader.getAllHarnesses(ConfirmDialogHarness)).toHaveLength(0);
    });
    expect(isClosed()).toBe(false);

    await form.cancel();
    await (await loader.getHarness(ConfirmDialogHarness)).confirm();
    await vi.waitFor(() => {
      expect(isClosed()).toBe(true);
    });
  });
});
