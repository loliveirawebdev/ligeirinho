import { ChangeDetectionStrategy, Component, effect, input, signal } from '@angular/core';
import { defineScenarios } from '@ligeirinho/previewer';
import { TreeSelect, type TreeSelectLabels, type TreeSelectNode } from './tree-select';

interface TreeSelectPreviewModel {
  readonly label: string;
  readonly labels: TreeSelectLabels;
  readonly options: readonly TreeSelectNode[];
  readonly value: readonly string[];
  readonly multiple?: boolean;
}

@Component({
  selector: 'ui-tree-select-preview',
  imports: [TreeSelect],
  template: `
    <div class="max-w-md p-4 sm:p-8">
      <ui-tree-select
        [label]="model().label"
        [labels]="model().labels"
        [options]="model().options"
        [multiple]="model().multiple ?? false"
        [(value)]="value"
      />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TreeSelectPreview {
  readonly model = input.required<TreeSelectPreviewModel>();
  /** Played as a page would: what is picked shows in the field. */
  protected readonly value = signal<readonly string[]>([]);

  constructor() {
    effect(() => {
      this.value.set(this.model().value);
    });
  }
}

const DEPARTMENTS: readonly TreeSelectNode[] = [
  {
    value: 'engineering',
    label: 'Engineering',
    children: [
      { value: 'frontend', label: 'Frontend' },
      { value: 'backend', label: 'Backend' },
      { value: 'platform', label: 'Platform', children: [{ value: 'sre', label: 'Site reliability' }, { value: 'security', label: 'Security' }] },
    ],
  },
  {
    value: 'sales',
    label: 'Sales',
    children: [
      { value: 'inside', label: 'Inside sales' },
      { value: 'field', label: 'Field sales' },
      { value: 'partners', label: 'Partnerships', disabled: true },
    ],
  },
  { value: 'finance', label: 'Finance', children: [{ value: 'accounting', label: 'Accounting' }, { value: 'payroll', label: 'Payroll' }] },
  { value: 'people', label: 'People' },
];

const FOLDERS: readonly TreeSelectNode[] = [
  {
    value: 'contracts',
    label: 'Contracts',
    children: [
      { value: 'contracts-2025', label: '2025' },
      { value: 'contracts-2026', label: '2026' },
    ],
  },
  { value: 'invoices', label: 'Invoices', children: [{ value: 'invoices-paid', label: 'Paid' }, { value: 'invoices-open', label: 'Open' }] },
  { value: 'shared', label: 'Shared with me' },
];

const labels: TreeSelectLabels = { search: 'Search departments', noMatches: 'No department matches', count: '{count} selected', remove: 'Remove {label}' };
const departments: TreeSelectPreviewModel = { label: 'Departments', labels, options: DEPARTMENTS, value: ['frontend', 'payroll'], multiple: true };

export const treeSelectScenarios = defineScenarios({
  flow: 'Catalog',
  title: 'Tree select',
  component: TreeSelectPreview,
  scenarios: {
    /** Several departments, a chip each; Partnerships not available. */
    several: departments,
    /** More than fit as chips: the field shows the count. */
    many: { ...departments, value: ['frontend', 'backend', 'sre', 'inside', 'payroll'] },
    /** One folder at a time: choosing closes the panel. */
    single: {
      label: 'Folder',
      labels: { ...labels, search: 'Search folders', noMatches: 'No folder matches' },
      options: FOLDERS,
      value: ['contracts-2026'],
    },
    empty: { ...departments, value: [] },
  },
});
