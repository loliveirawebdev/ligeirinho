import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { render } from '@testing-library/angular';
import { ConfirmDialogs } from './confirm-dialog';
import { ConfirmDialogHarness } from './confirm-dialog.harness';

@Component({ template: '', changeDetection: ChangeDetectionStrategy.OnPush })
class Page {}

const text = {
  title: 'Remove Ana Souza?',
  message: 'She loses access to the workspace right away.',
  cancel: 'Cancel',
  confirm: 'Remove member',
};

async function ask(): Promise<{ answers: boolean[]; confirmDialog: ConfirmDialogHarness }> {
  const { fixture } = await render(Page);
  const answers: boolean[] = [];
  TestBed.inject(ConfirmDialogs)
    .ask(text)
    .subscribe((answer) => answers.push(answer));
  const confirmDialog = await TestbedHarnessEnvironment.documentRootLoader(fixture).getHarness(ConfirmDialogHarness);
  return { answers, confirmDialog };
}

describe('confirm dialog', () => {
  it('asks the question, says what happens, and answers yes on the confirm button', async () => {
    const { answers, confirmDialog } = await ask();
    expect(await confirmDialog.getTitle()).toBe('Remove Ana Souza?');
    expect(await confirmDialog.getMessage()).toBe('She loses access to the workspace right away.');
    await confirmDialog.confirm();
    await vi.waitFor(() => {
      expect(answers).toEqual([true]);
    });
  });

  it('answers no on Cancel', async () => {
    const { answers, confirmDialog } = await ask();
    await confirmDialog.cancel();
    await vi.waitFor(() => {
      expect(answers).toEqual([false]);
    });
  });
});
