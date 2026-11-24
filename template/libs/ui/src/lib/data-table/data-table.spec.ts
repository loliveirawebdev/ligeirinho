import { BreakpointObserver, type BreakpointState } from '@angular/cdk/layout';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { render } from '@testing-library/angular';
import { of } from 'rxjs';
import { MANY_MEMBER_ROWS, MEMBER_COLUMNS, SAMPLE_MEMBER_ROWS } from '../../examples/members/sample-members';
import { DataTable } from './data-table';
import { DataTableHarness } from './data-table.harness';

function screenWidth(matches: boolean): { provide: typeof BreakpointObserver; useValue: Pick<BreakpointObserver, 'observe'> } {
  const state: BreakpointState = { matches, breakpoints: {} };
  return { provide: BreakpointObserver, useValue: { observe: () => of(state) } };
}

const inputs = { label: 'Members', columns: MEMBER_COLUMNS, rows: SAMPLE_MEMBER_ROWS.slice(0, 2) };

describe('data table', () => {
  it('is a table on wide screens, every row opened by its first cell', async () => {
    const opened: string[] = [];
    const { fixture } = await render(DataTable, {
      inputs,
      providers: [screenWidth(true)],
      on: { rowOpened: (id: string) => opened.push(id) },
    });
    const table = await TestbedHarnessEnvironment.harnessForFixture(fixture, DataTableHarness);
    expect(await table.isTable()).toBe(true);
    expect(await table.getColumnLabels()).toEqual(['Name', 'Email', 'Role', 'Status', 'Last active']);
    await table.openRow('Open Bruno Lima');
    expect(opened).toEqual(['m-2']);
  });

  it('is a list on phones, with the same rows and actions', async () => {
    const opened: string[] = [];
    const { fixture } = await render(DataTable, {
      inputs,
      providers: [screenWidth(false)],
      on: { rowOpened: (id: string) => opened.push(id) },
    });
    const table = await TestbedHarnessEnvironment.harnessForFixture(fixture, DataTableHarness);
    expect(await table.isTable()).toBe(false);
    expect(await table.getRowLabels()).toEqual(['Open Ana Souza', 'Open Bruno Lima']);
    await table.openRow('Open Ana Souza');
    expect(opened).toEqual(['m-1']);
  });

  it('on phones, titles rows by the chosen column and names each value when asked', async () => {
    const { fixture } = await render(DataTable, {
      inputs: {
        label: 'Members',
        columns: MEMBER_COLUMNS.slice(0, 3),
        rows: SAMPLE_MEMBER_ROWS.slice(0, 1),
        titleColumn: 'email',
        phoneLabels: true,
      },
      providers: [screenWidth(false)],
    });
    const table = await TestbedHarnessEnvironment.harnessForFixture(fixture, DataTableHarness);
    expect(await table.getListTitles()).toEqual(['ana.souza@northwind.example']);
    expect(await table.getListLines()).toEqual(['Name Ana Souza', 'Role Administrator']);
  });

  it('on phones, titles rows by the first column by default, values alone', async () => {
    const { fixture } = await render(DataTable, {
      inputs: { label: 'Members', columns: MEMBER_COLUMNS.slice(0, 3), rows: SAMPLE_MEMBER_ROWS.slice(0, 1) },
      providers: [screenWidth(false)],
    });
    const table = await TestbedHarnessEnvironment.harnessForFixture(fixture, DataTableHarness);
    expect(await table.getListTitles()).toEqual(['Ana Souza']);
    expect(await table.getListLines()).toEqual(['ana.souza@northwind.example', 'Administrator']);
  });

  it('pages through the rows with the paginator, in the screen\'s words', async () => {
    const pages: { pageIndex: number; pageSize: number }[] = [];
    const { fixture } = await render(DataTable, {
      inputs: {
        label: 'Members',
        columns: MEMBER_COLUMNS,
        rows: MANY_MEMBER_ROWS.slice(0, 10),
        paging: {
          kind: 'pages',
          pageIndex: 0,
          pageSize: 10,
          total: 48,
          text: {
            firstPage: 'First page',
            previousPage: 'Previous page',
            nextPage: 'Next page',
            lastPage: 'Last page',
            range: (start: number, end: number, total: number) => `${String(start)}–${String(end)} of ${String(total)}`,
          },
        },
      },
      providers: [screenWidth(true)],
      on: { pageChange: (page: { pageIndex: number; pageSize: number }) => pages.push(page) },
    });
    const table = await TestbedHarnessEnvironment.harnessForFixture(fixture, DataTableHarness);
    expect(await table.getRangeLabel()).toBe('1–10 of 48');
    await table.goToNextPage();
    expect(pages).toEqual([{ pageIndex: 1, pageSize: 10 }]);
  });

  it('shows more rows from the bar under them, and says it is loading them', async () => {
    let requests = 0;
    const text = { action: 'Show more', loading: 'Loading more members…' };
    const { fixture, rerender } = await render(DataTable, {
      inputs: { ...inputs, paging: { kind: 'more', hasMore: true, loading: false, text } },
      providers: [screenWidth(true)],
      on: { moreRequested: () => (requests += 1) },
    });
    const table = await TestbedHarnessEnvironment.harnessForFixture(fixture, DataTableHarness);
    expect(await table.getShowMoreText()).toBe('Show more');
    await table.showMore();
    expect(requests).toBe(1);

    await rerender({ partialUpdate: true, inputs: { paging: { kind: 'more', hasMore: true, loading: true, text } } });
    expect(await table.getShowMoreText()).toBe('Loading more members…');

    await rerender({ partialUpdate: true, inputs: { paging: { kind: 'more', hasMore: false, loading: false, text } } });
    expect(await table.getShowMoreText()).toBeNull();
  });

  it('sorts by the headers of sortable columns, and shows the order it was given', async () => {
    const sorts: unknown[] = [];
    const columns = MEMBER_COLUMNS.map((column) =>
      column.key === 'role' || column.key === 'name' ? { ...column, sortLabel: `Sort by ${column.label}` } : column,
    );
    const { fixture } = await render(DataTable, {
      inputs: { ...inputs, columns, sort: { column: 'name', direction: 'asc' } },
      providers: [screenWidth(true)],
      on: { sortChange: (sort: unknown) => sorts.push(sort) },
    });
    const table = await TestbedHarnessEnvironment.harnessForFixture(fixture, DataTableHarness);
    expect(await table.getSort()).toBe('Name asc');
    await table.sortBy('Role');
    expect(sorts).toEqual([{ column: 'role', direction: 'asc' }]);
    await table.sortBy('Email');
    expect(sorts).toHaveLength(1);
  });

  it('picks rows for bulk actions, all shown at once from the header, and clears them from the bar', async () => {
    const changes: (readonly string[])[] = [];
    const text = {
      selectRow: (title: string) => `Select ${title}`,
      selectAll: 'Select all',
      selected: (count: number) => `${String(count)} selected`,
      clear: 'Clear selection',
    };
    const { fixture, rerender } = await render(DataTable, {
      inputs: { ...inputs, selection: { selected: [], text } },
      providers: [screenWidth(true)],
      on: { selectionChange: (ids: readonly string[]) => changes.push(ids) },
    });
    const table = await TestbedHarnessEnvironment.harnessForFixture(fixture, DataTableHarness);
    expect(await table.getSelectedText()).toBeNull();
    await table.toggleSelection('Select Bruno Lima');
    expect(changes.at(-1)).toEqual(['m-2']);

    // A rerender drops the listeners it isn't given, so the same one comes again.
    await rerender({
      partialUpdate: true,
      inputs: { selection: { selected: ['m-2'], text } },
      on: { selectionChange: (ids: readonly string[]) => changes.push(ids) },
    });
    expect(await table.getSelectedText()).toBe('1 selected');
    await table.toggleSelection('Select all');
    expect(changes.at(-1)).toEqual(['m-2', 'm-1']);
    await table.clearSelection();
    expect(changes.at(-1)).toEqual([]);
  });

  it('on phones, picks rows from a checkbox before each one', async () => {
    const changes: (readonly string[])[] = [];
    const text = { selectRow: (title: string) => `Select ${title}`, selectAll: 'Select all', selected: String, clear: 'Clear' };
    const { fixture } = await render(DataTable, {
      inputs: { ...inputs, selection: { selected: [], text } },
      providers: [screenWidth(false)],
      on: { selectionChange: (ids: readonly string[]) => changes.push(ids) },
    });
    const table = await TestbedHarnessEnvironment.harnessForFixture(fixture, DataTableHarness);
    await table.toggleSelection('Select Ana Souza');
    expect(changes).toEqual([['m-1']]);
    expect(await table.getRowLabels()).toEqual(['Open Ana Souza', 'Open Bruno Lima']);
  });

  it('moves rows with their handle and the arrow keys, never past the ends', async () => {
    const moves: unknown[] = [];
    const { fixture } = await render(DataTable, {
      inputs: { ...inputs, reorder: { handleLabel: (title: string) => `Move ${title}` } },
      providers: [screenWidth(true)],
      on: { rowMoved: (move: unknown) => moves.push(move) },
    });
    const table = await TestbedHarnessEnvironment.harnessForFixture(fixture, DataTableHarness);
    await table.moveRow('Move Ana Souza', 'down');
    await table.moveRow('Move Ana Souza', 'up');
    expect(moves).toEqual([{ id: 'm-1', fromIndex: 0, toIndex: 1 }]);
  });

  it('asks for more rows when the end of the list shows, and says it is loading them', async () => {
    let watch: ((entries: { isIntersecting: boolean }[]) => void) | undefined;
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: (entries: { isIntersecting: boolean }[]) => void) {
          watch = callback;
        }
        observe(): void {
          // The test calls `watch` itself.
        }
        disconnect(): void {
          // Nothing to release.
        }
      },
    );
    let requests = 0;
    const { fixture, rerender } = await render(DataTable, {
      inputs: { ...inputs, paging: { kind: 'infinite', hasMore: true, loading: false, loadingLabel: 'Loading more members…' } },
      providers: [screenWidth(true)],
      on: { moreRequested: () => (requests += 1) },
    });
    watch?.([{ isIntersecting: true }]);
    expect(requests).toBe(1);

    await rerender({
      partialUpdate: true,
      inputs: { paging: { kind: 'infinite', hasMore: true, loading: true, loadingLabel: 'Loading more members…' } },
    });
    const table = await TestbedHarnessEnvironment.harnessForFixture(fixture, DataTableHarness);
    expect(await table.getLoadingMoreText()).toBe('Loading more members…');
    vi.unstubAllGlobals();
  });
});
