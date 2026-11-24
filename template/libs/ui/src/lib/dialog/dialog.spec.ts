import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { render } from '@testing-library/angular';
import { Dialog } from './dialog';
import { DialogHarness } from './dialog.harness';

@Component({ template: '', changeDetection: ChangeDetectionStrategy.OnPush })
class Page {}

@Component({
  imports: [Dialog, MatButtonModule, MatDialogModule],
  template: `
    <ui-dialog [title]="title" [supportingText]="line" [closeLabel]="closeLabel">
      <button uiDialogActions matButton type="button" mat-dialog-close>{{ done }}</button>
    </ui-dialog>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class MemberDialog {
  protected readonly title = 'Ana Souza';
  protected readonly line = 'Administrator since March';
  protected readonly closeLabel = 'Close';
  protected readonly done = 'Done';
}

describe('dialog', () => {
  it('shows the title, the line under it and the actions, and closes from the corner', async () => {
    const { fixture } = await render(Page);
    const ref = TestBed.inject(MatDialog).open(MemberDialog);
    const dialog = await TestbedHarnessEnvironment.documentRootLoader(fixture).getHarness(DialogHarness);
    expect(await dialog.getTitle()).toBe('Ana Souza');
    expect(await dialog.getSupportingText()).toBe('Administrator since March');
    expect(await dialog.getActionLabels()).toEqual(['Done']);
    let closed = false;
    ref.afterClosed().subscribe(() => (closed = true));
    await dialog.close();
    await vi.waitFor(() => {
      expect(closed).toBe(true);
    });
  });
});
