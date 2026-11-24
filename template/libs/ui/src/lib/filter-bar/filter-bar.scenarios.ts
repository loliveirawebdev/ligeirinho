import { ChangeDetectionStrategy, Component, effect, input, signal } from '@angular/core';
import { defineScenarios } from '@ligeirinho/previewer';
import { FilterBar, type FilterOption, type LightFilter, type LightFilterChange } from './filter-bar';

interface FilterBarPreviewModel {
  readonly searchLabel: string;
  readonly query: string;
  readonly filtersLabel: string;
  readonly filters: readonly FilterOption[];
  readonly selectedFilter: string;
  readonly filtersPosition?: 'beside' | 'below';
  readonly lightFilters?: readonly LightFilter[];
}

@Component({
  selector: 'ui-filter-bar-preview',
  imports: [FilterBar],
  template: `
    <div class="mx-auto max-w-5xl p-4 sm:p-8">
      <ui-filter-bar
        [searchLabel]="model().searchLabel"
        [query]="model().query"
        [filtersLabel]="model().filtersLabel"
        [filters]="model().filters"
        [selectedFilter]="model().selectedFilter"
        [filtersPosition]="model().filtersPosition ?? 'beside'"
        [lightFilters]="lightFilters()"
        (lightFilterChange)="change($event)"
      />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class FilterBarPreview {
  readonly model = input.required<FilterBarPreviewModel>();

  /** Played as a page would: what the user picks shows on the chips. */
  protected readonly lightFilters = signal<readonly LightFilter[]>([]);

  constructor() {
    effect(() => {
      this.lightFilters.set(this.model().lightFilters ?? []);
    });
  }

  protected change({ key, selected }: LightFilterChange): void {
    this.lightFilters.update((filters) => filters.map((filter) => (filter.key === key ? { ...filter, selected } : filter)));
  }
}

const LIGHT_FILTERS: readonly LightFilter[] = [
  {
    key: 'status',
    label: 'Status',
    clearLabel: 'Clear status',
    selected: ['active'],
    options: [
      { value: 'active', label: 'Active' },
      { value: 'invited', label: 'Invited' },
      { value: 'suspended', label: 'Suspended' },
    ],
  },
  {
    key: 'role',
    label: 'Role',
    clearLabel: 'Clear role',
    multiple: true,
    selected: [],
    options: [
      { value: 'admin', label: 'Administrator' },
      { value: 'editor', label: 'Editor' },
      { value: 'viewer', label: 'Viewer' },
    ],
  },
  {
    key: 'team',
    label: 'Team',
    clearLabel: 'Clear team',
    multiple: true,
    selected: ['design', 'finance', 'sales'],
    options: [
      { value: 'design', label: 'Design' },
      { value: 'engineering', label: 'Engineering' },
      { value: 'finance', label: 'Finance' },
      { value: 'sales', label: 'Sales' },
    ],
  },
];

const members: FilterBarPreviewModel = {
  searchLabel: 'Search members',
  query: '',
  filtersLabel: 'Status',
  filters: [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'invited', label: 'Invited' },
    { value: 'suspended', label: 'Suspended' },
  ],
  selectedFilter: 'all',
};

export const filterBarScenarios = defineScenarios({
  flow: 'Catalog',
  title: 'Filter bar',
  component: FilterBarPreview,
  scenarios: {
    all: members,
    searching: { ...members, query: 'souza', selectedFilter: 'active' },
    /** The chips under the field on wide screens too. */
    filtersBelow: { ...members, filtersPosition: 'below' },
    searchOnly: { ...members, filters: [] },
    /** A chip per filter, each opening its options: Status one at a time, Role and Team several. */
    lightFilters: { ...members, filtersLabel: 'Filters', filters: [], lightFilters: LIGHT_FILTERS },
  },
});
