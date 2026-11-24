import { ChangeDetectionStrategy, Component, computed, effect, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { defineScenarios } from '@ligeirinho/previewer';
import type { IconLabel } from '../../examples/catalog-note';
import { MANY_MEMBER_ROWS, MEMBER_COLUMNS, SAMPLE_MEMBER_ROWS } from '../../examples/members/sample-members';
import {
  DataTable,
  type DataTableColumn,
  type DataTableMove,
  type DataTablePage,
  type DataTablePagesText,
  type DataTableReorder,
  type DataTableRow,
  type DataTableSelectionText,
  type DataTableSort,
} from './data-table';

interface DataTablePreviewModel {
  readonly label: string;
  readonly columns: readonly DataTableColumn[];
  readonly rows: readonly DataTableRow[];
  readonly titleColumn?: string;
  readonly phoneLabels?: boolean;
  readonly phoneWrap?: boolean;
  /** Pages or infinite scroll over `rows`, played by the preview the way a page would load them. */
  readonly paging?: 'pages' | 'more' | 'infinite';
  /** Show more and infinite: stay in the loading state, to look at it. */
  readonly stayLoading?: boolean;
  /** The order the rows start in; the preview sorts them as a page would when the user sorts. */
  readonly sort?: DataTableSort;
  /** Rows picked to start with; with it, every row gets a checkbox and the bulk bar its actions. */
  readonly selected?: readonly string[];
  /** Rows put in order by hand, with a handle on each. */
  readonly reorderable?: boolean;
}

const SELECTION_TEXT: DataTableSelectionText = {
  selectRow: (title) => `Select ${title}`,
  selectAll: 'Select all',
  selected: (count) => `${String(count)} selected`,
  clear: 'Clear selection',
};

const BULK_ACTIONS: readonly IconLabel[] = [
  { icon: 'badge', label: 'Change role' },
  { icon: 'person_remove', label: 'Remove' },
];

const REORDER: DataTableReorder = { handleLabel: (title) => `Move ${title}` };

/** Sortable members: every column but the last activity (sorting it needs dates, not the formatted words). */
const SORTABLE_COLUMNS: readonly DataTableColumn[] = MEMBER_COLUMNS.map((column) =>
  column.key === 'lastActive' ? column : { ...column, sortLabel: `Sort by ${column.label.toLowerCase()}` },
);

const PAGES_TEXT: DataTablePagesText = {
  firstPage: 'First page',
  previousPage: 'Previous page',
  nextPage: 'Next page',
  lastPage: 'Last page',
  range: (start, end, total) => `${String(start)}–${String(end)} of ${String(total)}`,
};

/** Rows the infinite scroll loads at a time, and how long the preview pretends a load takes. */
const BATCH = 12;
const LOAD_TIME_MS = 900;

@Component({
  selector: 'ui-data-table-preview',
  imports: [DataTable, MatButtonModule, MatIconModule],
  template: `
    <div class="mx-auto max-w-5xl p-4 sm:p-8">
      <ui-data-table
        [label]="model().label"
        [columns]="model().columns"
        [rows]="shownRows()"
        [titleColumn]="model().titleColumn"
        [phoneLabels]="model().phoneLabels ?? false"
        [phoneWrap]="model().phoneWrap ?? false"
        [paging]="paging()"
        [sort]="sort()"
        [selection]="selection()"
        [reorder]="model().reorderable ? reorder : undefined"
        (pageChange)="page.set($event)"
        (sortChange)="sortBy($event)"
        (moreRequested)="loadMore()"
        (selectionChange)="selected.set($event)"
        (rowMoved)="moveRow($event)"
      >
        @for (action of bulkActions; track action.label) {
          <button uiBulkActions matButton type="button"><mat-icon aria-hidden="true">{{ action.icon }}</mat-icon>{{ action.label }}</button>
        }
      </ui-data-table>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class DataTablePreview {
  readonly model = input.required<DataTablePreviewModel>();

  protected readonly page = signal<DataTablePage>({ pageIndex: 0, pageSize: 10 });
  protected readonly sort = signal<DataTableSort | undefined>(undefined);
  protected readonly selected = signal<readonly string[] | undefined>(undefined);
  protected readonly reorder = REORDER;
  protected readonly bulkActions = BULK_ACTIONS;
  /** The rows in the order the user put them (reorder). */
  private readonly ordered = signal<readonly DataTableRow[] | undefined>(undefined);
  private readonly loaded = signal(BATCH);
  private readonly loading = signal(false);

  constructor() {
    effect(() => {
      this.loading.set(this.model().stayLoading ?? false);
    });
    effect(() => {
      this.sort.set(this.model().sort);
    });
    effect(() => {
      this.selected.set(this.model().selected);
      this.ordered.set(undefined);
    });
  }

  private readonly sortedRows = computed(() => {
    const rows = this.ordered() ?? this.model().rows;
    const sort = this.sort();
    if (!sort?.direction) {
      return rows;
    }
    const way = sort.direction === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => way * (a.cells[sort.column] ?? '').localeCompare(b.cells[sort.column] ?? ''));
  });

  protected readonly shownRows = computed(() => {
    const { paging } = this.model();
    const rows = this.sortedRows();
    if (paging === 'pages') {
      const { pageIndex, pageSize } = this.page();
      return rows.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);
    }
    return paging === 'infinite' || paging === 'more' ? rows.slice(0, this.loaded()) : rows;
  });

  protected readonly paging = computed(() => {
    const { rows, paging } = this.model();
    if (paging === 'pages') {
      return { kind: 'pages' as const, ...this.page(), total: rows.length, text: PAGES_TEXT };
    }
    if (paging === 'more') {
      return {
        kind: 'more' as const,
        hasMore: this.loaded() < rows.length,
        loading: this.loading(),
        text: { action: 'Show more', loading: 'Loading more members…' },
      };
    }
    if (paging === 'infinite') {
      return {
        kind: 'infinite' as const,
        hasMore: this.loaded() < rows.length,
        loading: this.loading(),
        loadingLabel: 'Loading more members…',
      };
    }
    return undefined;
  });

  protected readonly selection = computed(() => {
    const selected = this.selected();
    return selected ? { selected, text: SELECTION_TEXT } : undefined;
  });

  protected moveRow(move: DataTableMove): void {
    const rows = [...this.shownRows()];
    const [row] = rows.splice(move.fromIndex, 1);
    if (row) {
      rows.splice(move.toIndex, 0, row);
      this.ordered.set(rows);
    }
  }

  protected sortBy(sort: DataTableSort): void {
    this.sort.set(sort);
    this.page.update((page) => ({ ...page, pageIndex: 0 }));
  }

  protected loadMore(): void {
    this.loading.set(true);
    setTimeout(() => {
      this.loaded.update((count) => count + BATCH);
      this.loading.set(false);
    }, LOAD_TIME_MS);
  }
}

export const dataTableScenarios = defineScenarios({
  flow: 'Catalog',
  title: 'Data table',
  component: DataTablePreview,
  scenarios: {
    members: { label: 'Members', columns: MEMBER_COLUMNS, rows: SAMPLE_MEMBER_ROWS },
    oneRow: { label: 'Members', columns: MEMBER_COLUMNS, rows: SAMPLE_MEMBER_ROWS.slice(0, 1) },
    /** On phones: the email as title and each value after its column's name. */
    phoneLabels: { label: 'Members', columns: MEMBER_COLUMNS, rows: SAMPLE_MEMBER_ROWS, titleColumn: 'email', phoneLabels: true },
    /** On phones: long values wrap to more lines instead of ending in an ellipsis. */
    phoneWrap: { label: 'Members', columns: MEMBER_COLUMNS, rows: SAMPLE_MEMBER_ROWS, titleColumn: 'email', phoneLabels: true, phoneWrap: true },
    twoColumns: { label: 'Members', columns: MEMBER_COLUMNS.slice(0, 2), rows: SAMPLE_MEMBER_ROWS },
    /** 48 members, 10 a page: the paginator under the rows (first/last only on wide screens; no rows-per-page choice). */
    paginated: { label: 'Members', columns: MEMBER_COLUMNS, rows: MANY_MEMBER_ROWS, paging: 'pages' },
    /** Sorted by name; the headers but the last one sort the rows (on wide screens), back to the first page. */
    sortable: {
      label: 'Members',
      columns: SORTABLE_COLUMNS,
      rows: MANY_MEMBER_ROWS,
      paging: 'pages',
      sort: { column: 'name', direction: 'asc' },
    },
    /** Every row with a checkbox, two picked: the floating bar with the count and the bulk actions. */
    selectable: { label: 'Members', columns: MEMBER_COLUMNS, rows: MANY_MEMBER_ROWS, paging: 'pages', selected: ['m-2', 'm-4'] },
    /** Rows put in order by hand: drag a handle, or focus it and use the arrow keys. */
    reorderable: { label: 'Members', columns: MEMBER_COLUMNS, rows: SAMPLE_MEMBER_ROWS, reorderable: true },
    /** 48 members, 12 at a time: the *Show more* bar under the last row loads the next ones. */
    showMore: { label: 'Members', columns: MEMBER_COLUMNS, rows: MANY_MEMBER_ROWS, paging: 'more' },
    /** The bar while the next rows load, held still. */
    showMoreLoading: { label: 'Members', columns: MEMBER_COLUMNS, rows: MANY_MEMBER_ROWS, paging: 'more', stayLoading: true },
    /** 48 members, 12 at a time: scroll to the end and the next ones load. */
    infiniteScroll: { label: 'Members', columns: MEMBER_COLUMNS, rows: MANY_MEMBER_ROWS, paging: 'infinite' },
    /** The loading state under the rows, held still. */
    infiniteLoading: { label: 'Members', columns: MEMBER_COLUMNS, rows: MANY_MEMBER_ROWS, paging: 'infinite', stayLoading: true },
  },
});
