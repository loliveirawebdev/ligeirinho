import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { render } from '@testing-library/angular';
import { TreeSelect, type TreeSelectNode } from './tree-select';
import { TreeSelectHarness } from './tree-select.harness';

const departments: readonly TreeSelectNode[] = [
  {
    value: 'eng',
    label: 'Engineering',
    children: [
      { value: 'front', label: 'Frontend' },
      { value: 'back', label: 'Backend' },
    ],
  },
  { value: 'sales', label: 'Sales', children: [{ value: 'inside', label: 'Inside sales' }] },
  { value: 'finance', label: 'Finance' },
];

const labels = { search: 'Search departments', noMatches: 'No department matches', count: '{count} selected', remove: 'Remove {label}' };
const inputs = { label: 'Departments', labels, options: departments };

describe('tree select', () => {
  it('with multiple, checks nodes in the tree, shows them as chips and removes them', async () => {
    const changes: (readonly string[])[] = [];
    const { fixture } = await render(TreeSelect, {
      inputs: { ...inputs, multiple: true },
      on: { value: (value: readonly string[]) => changes.push(value) },
    });
    const select = await TestbedHarnessEnvironment.harnessForFixture(fixture, TreeSelectHarness);
    expect(await select.getNodeLabels()).toEqual(['Engineering', 'Sales', 'Finance']);
    await select.toggleBranch('Engineering');
    expect(await select.getNodeLabels()).toEqual(['Engineering', 'Frontend', 'Backend', 'Sales', 'Finance']);
    await select.choose('Finance');
    await select.choose('Backend');
    expect(changes.at(-1)).toEqual(['back', 'finance']);
    expect(await select.getChips()).toEqual(['Backend', 'Finance']);
    await select.removeChip('Finance');
    expect(changes.at(-1)).toEqual(['back']);
  });

  it('shows the count once the chips would not fit', async () => {
    const { fixture } = await render(TreeSelect, { inputs: { ...inputs, multiple: true, maxChips: 2, value: ['eng', 'front', 'sales'] } });
    const select = await TestbedHarnessEnvironment.harnessForFixture(fixture, TreeSelectHarness);
    expect(await select.getChips()).toEqual([]);
    expect(await select.getText()).toBe('3 selected');
  });

  it('searches, keeping the ancestors of every match', async () => {
    const { fixture } = await render(TreeSelect, { inputs });
    const select = await TestbedHarnessEnvironment.harnessForFixture(fixture, TreeSelectHarness);
    await select.search('insi');
    expect(await select.getNodeLabels()).toEqual(['Sales', 'Inside sales']);
  });

  it('one at a time, as a reactive form control: choosing closes the panel', async () => {
    @Component({
      imports: [TreeSelect, ReactiveFormsModule],
      template: `<ui-tree-select [formControl]="department" [label]="label" [labels]="labels" [options]="options" />`,
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class DepartmentForm {
      readonly department = new FormControl<readonly string[]>(['front'], { nonNullable: true });
      readonly label = inputs.label;
      readonly labels = labels;
      readonly options = departments;
    }
    const { fixture } = await render(DepartmentForm);
    const select = await TestbedHarnessEnvironment.harnessForFixture(fixture, TreeSelectHarness);
    expect(await select.getText()).toBe('Frontend');
    expect(await select.getSelectedNodeLabels()).toEqual(['Frontend']);
    await select.choose('Sales');
    expect(fixture.componentInstance.department.value).toEqual(['sales']);
    expect(await select.isOpen()).toBe(false);
    expect(await select.getText()).toBe('Sales');
  });
});
