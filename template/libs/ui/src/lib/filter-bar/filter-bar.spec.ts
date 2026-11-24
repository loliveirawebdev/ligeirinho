import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { render } from '@testing-library/angular';
import { FilterBar } from './filter-bar';
import { FilterBarHarness } from './filter-bar.harness';

const inputs = {
  searchLabel: 'Search members',
  filtersLabel: 'Status',
  filters: [
    { value: 'all', label: 'All' },
    { value: 'invited', label: 'Invited' },
  ],
  selectedFilter: 'all',
};

describe('filter bar', () => {
  it('reports the query and the chosen filter', async () => {
    const queries: string[] = [];
    const chosenFilters: string[] = [];
    const { fixture } = await render(FilterBar, {
      inputs,
      on: { queryChange: (query: string) => queries.push(query), filterChange: (filter: string) => chosenFilters.push(filter) },
    });
    const filterBar = await TestbedHarnessEnvironment.harnessForFixture(fixture, FilterBarHarness);
    expect(await filterBar.getFilterLabels()).toEqual(['All', 'Invited']);
    expect(await filterBar.getSelectedFilter()).toBe('All');
    await filterBar.search('ana');
    await filterBar.selectFilter('Invited');
    expect(queries.at(-1)).toBe('ana');
    expect(chosenFilters).toEqual(['invited']);
  });

  it('opens each light filter, reports what is picked, shows it on the chip and clears it', async () => {
    const changes: unknown[] = [];
    const status = {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'invited', label: 'Invited' },
      ],
      selected: ['active'],
      clearLabel: 'Clear status',
    };
    const role = { ...status, key: 'role', label: 'Role', multiple: true, selected: [], clearLabel: 'Clear role', options: [
      { value: 'admin', label: 'Admin' },
      { value: 'editor', label: 'Editor' },
    ] };
    const { fixture } = await render(FilterBar, {
      inputs: { searchLabel: 'Search members', lightFilters: [status, role] },
      on: { lightFilterChange: (change: unknown) => changes.push(change) },
    });
    const filterBar = await TestbedHarnessEnvironment.harnessForFixture(fixture, FilterBarHarness);
    expect(await filterBar.getLightFilterTexts()).toEqual(['Status: Active', 'Role']);
    await filterBar.chooseLightOption('Status', 'Invited');
    await filterBar.chooseLightOption('Role', 'Editor');
    await filterBar.clearLightFilter('Clear status');
    expect(changes).toEqual([
      { key: 'status', selected: ['invited'] },
      { key: 'role', selected: ['editor'] },
      { key: 'status', selected: [] },
    ]);
  });
});
