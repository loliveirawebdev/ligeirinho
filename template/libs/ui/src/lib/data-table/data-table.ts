import { type CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { BreakpointObserver } from '@angular/cdk/layout';
import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  output,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatPaginatorIntl, MatPaginatorModule, type PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSortModule, type Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { map } from 'rxjs';

export interface DataTableColumn {
  readonly key: string;
  readonly label: string;
  /** Numbers and dates that are compared line up at the end. */
  readonly align?: 'start' | 'end';
  /**
   * Makes the column sortable on wide screens, its header a button: what the button does, read by screen readers
   * (*Sort by name*). The page sorts the rows on `sortChange`.
   */
  readonly sortLabel?: string;
}

/** The column the rows are sorted by, and which way; `direction` empty is the page's own order. */
export interface DataTableSort {
  readonly column: string;
  readonly direction: 'asc' | 'desc' | '';
}

export interface DataTableRow {
  readonly id: string;
  /** Already formatted by the view-model, one per column key. The first column (or `titleColumn`) names the row. */
  readonly cells: Readonly<Record<string, string>>;
  /** The row's accessible action: *Open Ana Souza*. It contains the cell that names the row, so what is seen is heard. */
  readonly openLabel: string;
}

/** The paginator's words, from the screen's copy (rules/copy.md). */
export interface DataTablePagesText {
  readonly firstPage: string;
  readonly previousPage: string;
  readonly nextPage: string;
  readonly lastPage: string;
  /** The range shown: *1–10 of 48*. `start` is 0 when there is nothing. */
  readonly range: (start: number, end: number, total: number) => string;
}

/**
 * Numbered pages under the table: the page owns the index and loads that page. The size is the page's decision, fixed;
 * the user doesn't pick how many rows to see.
 */
export interface DataTablePages {
  readonly kind: 'pages';
  /** From 0. */
  readonly pageIndex: number;
  readonly pageSize: number;
  /** Every record, not only this page's. */
  readonly total: number;
  readonly text: DataTablePagesText;
}

/** More rows load as the user nears the end (lazy loading): the page appends them to `rows` on `moreRequested`. */
export interface DataTableInfinite {
  readonly kind: 'infinite';
  /** Whether there are rows left to load; nothing more is requested once false. */
  readonly hasMore: boolean;
  /** While the next rows load: a spinner and `loadingLabel` show under the last row. */
  readonly loading: boolean;
  /** *Loading more members…*, also announced to screen readers. */
  readonly loadingLabel: string;
}

/**
 * A *Show more* bar across the table, right under the last row: the page appends the next rows on `moreRequested`.
 * Its words come from the screen's copy: the action (*Show more*) and the loading line.
 */
export interface DataTableShowMore {
  readonly kind: 'more';
  /** Whether there are rows left; the bar goes away once false. */
  readonly hasMore: boolean;
  readonly loading: boolean;
  readonly text: { readonly action: string; readonly loading: string };
}

export type DataTablePaging = DataTablePages | DataTableInfinite | DataTableShowMore;

/** The words of row selection, from the screen's copy. */
export interface DataTableSelectionText {
  /** A row's checkbox, read by screen readers, from the cell that names the row: *Select Ana Souza*. */
  readonly selectRow: (title: string) => string;
  /** The header's checkbox, for every row shown: *Select all*. */
  readonly selectAll: string;
  /** The bar's count: *2 selected*. */
  readonly selected: (count: number) => string;
  /** The bar's close button, which clears the selection: *Clear selection*. */
  readonly clear: string;
}

/**
 * Rows the user picks to act on together: a checkbox on each row (and in the header, for every row shown) and, once
 * any is picked, a bar over the rows with the count, the bulk actions (`uiBulkActions`) and a button that clears it.
 * The page owns `selected` and updates it on `selectionChange`.
 */
export interface DataTableSelection {
  /** The ids of the rows picked. */
  readonly selected: readonly string[];
  readonly text: DataTableSelectionText;
}

/**
 * Rows the user puts in order by hand (priorities, steps): a handle at the start of each row, dragged with the
 * pointer or moved with the arrow keys. The page moves the row on `rowMoved`. Not with sortable columns.
 */
export interface DataTableReorder {
  /** The handle, read by screen readers, from the cell that names the row: *Move Ana Souza*. */
  readonly handleLabel: (title: string) => string;
}

/** A row the user moved: from where to where, among the rows given. */
export interface DataTableMove {
  readonly id: string;
  readonly fromIndex: number;
  readonly toIndex: number;
}

export interface DataTablePage {
  readonly pageIndex: number;
  readonly pageSize: number;
}

/** How far before the end the next rows are requested, so they are usually there before the user arrives. */
const LOAD_AHEAD = '0px 0px 320px 0px';

/** The columns the table adds before the page's own: the drag handle, then the checkbox. */
const MOVE_COLUMN = 'ui-move';
const SELECT_COLUMN = 'ui-select';

/** Wide enough for a table; under it, the rows become a list (a title, then each other column a line under it). */
const TABLE_MEDIA_QUERY = '(min-width: 600px)';

/**
 * Records the user scans and opens: a Material table on wide screens, a list on phones, every row one target. The
 * view-model formats every cell; the page decides what opening a row means and loads the rows: all at once, a page
 * at a time (`paging` kind `pages`, a paginator under the rows), more on request (kind `more`, a *Show more* bar) or
 * more as the user scrolls (kind `infinite`). Rows can be picked for bulk actions (`selection`) or put in order by
 * hand (`reorder`).
 */
@Component({
  selector: 'ui-data-table',
  imports: [
    DragDropModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatListModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSortModule,
    MatTableModule,
  ],
  // Its own paginator words, from `paging.text`, so two tables on a page can say different things.
  providers: [{ provide: MatPaginatorIntl, useClass: MatPaginatorIntl }],
  templateUrl: './data-table.html',
  styleUrls: ['./data-table.css', './data-table-list.css', './data-table-rows.css'],
  // The styles reach into Material's list and table; every selector starts with ui-data-table or .ui-data, so nothing leaks.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class DataTable {
  /** What the table lists (*Members*), read by screen readers. */
  readonly label = input.required<string>();
  readonly columns = input.required<readonly DataTableColumn[]>();
  readonly rows = input.required<readonly DataTableRow[]>();
  /** On phones, the key of the column shown as each row's title; the first column when not set. */
  readonly titleColumn = input<string>();
  /** On phones, the column's name before each value (*Role Administrator*), for values that don't explain themselves. */
  readonly phoneLabels = input(false);
  /** On phones, let the title and values wrap to more lines; by default each stays on one line, cut with an ellipsis. */
  readonly phoneWrap = input(false);
  /**
   * Run the table to the edges of the page's panel (like Gmail's list), past the page's side padding; the first and
   * last columns keep their text in line with the rest of the page. Only inside `ui-app-shell`'s page.
   */
  readonly fullBleed = input(false, { transform: booleanAttribute });

  /** Numbered pages, a *Show more* bar or infinite scroll under the rows; none shows every row given. */
  readonly paging = input<DataTablePaging>();
  /** The order the rows come in, shown by the headers of columns with a `sortLabel`. */
  readonly sort = input<DataTableSort>();
  /** A checkbox on every row and the bulk actions (`uiBulkActions`) in a bar once any is picked. */
  readonly selection = input<DataTableSelection>();
  /** A handle on every row to put the rows in order by hand. */
  readonly reorder = input<DataTableReorder>();

  readonly rowOpened = output<string>();
  /** The page the user moved to (pages): load it and pass its rows. */
  readonly pageChange = output<DataTablePage>();
  /** The user asked for more (the bar) or neared the end (infinite): load the next rows and append them. */
  readonly moreRequested = output();
  /** The user sorted by a column (wide screens): pass the rows in that order, from the first page. */
  readonly sortChange = output<DataTableSort>();
  /** The rows picked now (selection): pass them back in `selection.selected`. */
  readonly selectionChange = output<readonly string[]>();
  /** The user moved a row (reorder): pass the rows in their new order. */
  readonly rowMoved = output<DataTableMove>();

  protected readonly isWide = toSignal(
    inject(BreakpointObserver).observe(TABLE_MEDIA_QUERY).pipe(map((state) => state.matches)),
    { initialValue: false },
  );
  protected readonly columnKeys = computed(() => [
    ...(this.reorder() ? [MOVE_COLUMN] : []),
    ...(this.selection() ? [SELECT_COLUMN] : []),
    ...this.columns().map((column) => column.key),
  ]);
  protected readonly titleKey = computed(() => {
    const chosen = this.titleColumn();
    const keys = this.columns().map((column) => column.key);
    return chosen !== undefined && keys.includes(chosen) ? chosen : (keys[0] ?? '');
  });
  protected readonly pages = computed(() => {
    const paging = this.paging();
    return paging?.kind === 'pages' ? paging : undefined;
  });
  protected readonly infinite = computed(() => {
    const paging = this.paging();
    return paging?.kind === 'infinite' ? paging : undefined;
  });

  protected readonly showMore = computed(() => {
    const paging = this.paging();
    return paging?.kind === 'more' && (paging.hasMore || paging.loading) ? paging : undefined;
  });

  private readonly paginatorIntl = inject(MatPaginatorIntl);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly endOfRows = viewChild<ElementRef<HTMLElement>>('endOfRows');

  constructor() {
    effect(() => {
      const text = this.pages()?.text;
      if (!text) {
        return;
      }
      const intl = this.paginatorIntl;
      intl.firstPageLabel = text.firstPage;
      intl.previousPageLabel = text.previousPage;
      intl.nextPageLabel = text.nextPage;
      intl.lastPageLabel = text.lastPage;
      intl.getRangeLabel = (page, size, total) =>
        text.range(total === 0 ? 0 : page * size + 1, Math.min((page + 1) * size, total), total);
      intl.changes.next();
    });

    // Watches the end of the rows; re-created whenever loading or hasMore changes, so a short list that still shows
    // its end after a load asks again.
    effect((onCleanup) => {
      const end = this.endOfRows()?.nativeElement;
      const infinite = this.infinite();
      if (!end || !infinite?.hasMore || infinite.loading || typeof IntersectionObserver === 'undefined') {
        return;
      }
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            observer.disconnect();
            this.moreRequested.emit();
          }
        },
        { rootMargin: LOAD_AHEAD },
      );
      observer.observe(end);
      onCleanup(() => {
        observer.disconnect();
      });
    });
  }

  private readonly selectedIds = computed(() => new Set(this.selection()?.selected ?? []));
  protected readonly selectedCount = computed(() => this.selectedIds().size);
  protected readonly allSelected = computed(() => {
    const rows = this.rows();
    return rows.length > 0 && rows.every((row) => this.selectedIds().has(row.id));
  });
  protected readonly someSelected = computed(() => !this.allSelected() && this.rows().some((row) => this.selectedIds().has(row.id)));

  protected isSelected(row: DataTableRow): boolean {
    return this.selectedIds().has(row.id);
  }

  protected title(row: DataTableRow): string {
    return row.cells[this.titleKey()] ?? '';
  }

  protected toggleRow(row: DataTableRow): void {
    const selected = this.selection()?.selected ?? [];
    this.selectionChange.emit(selected.includes(row.id) ? selected.filter((id) => id !== row.id) : [...selected, row.id]);
  }

  /** The header's checkbox: every row shown, or none of them (rows picked on other pages stay picked). */
  protected toggleAll(): void {
    const selected = this.selection()?.selected ?? [];
    const shown = this.rows().map((row) => row.id);
    this.selectionChange.emit(
      this.allSelected() ? selected.filter((id) => !shown.includes(id)) : [...new Set([...selected, ...shown])],
    );
  }

  protected clearSelection(): void {
    this.selectionChange.emit([]);
  }

  protected drop(event: CdkDragDrop<unknown>): void {
    this.move(event.previousIndex, event.currentIndex);
  }

  /** The handle's arrow keys move its row one place up or down. */
  protected moveByKey(event: KeyboardEvent, row: DataTableRow): void {
    const step = event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0;
    if (step === 0) {
      return;
    }
    event.preventDefault();
    const index = this.rows().indexOf(row);
    if (this.move(index, index + step)) {
      // The row is drawn again in its new place: its handle keeps the focus, so the next key moves it on.
      afterNextRender(
        () => {
          const handles = this.host.nativeElement.querySelectorAll<HTMLElement>('[data-handle]');
          [...handles].find((handle) => handle.dataset['handle'] === row.id)?.focus();
        },
        { injector: this.injector },
      );
    }
  }

  private move(fromIndex: number, toIndex: number): boolean {
    const row = this.rows()[fromIndex];
    if (!row || toIndex === fromIndex || toIndex < 0 || toIndex >= this.rows().length) {
      return false;
    }
    this.rowMoved.emit({ id: row.id, fromIndex, toIndex });
    return true;
  }

  /** Rows are kept by id, so a moved or reloaded row is the same row on screen. */
  protected readonly trackRow = (_index: number, row: DataTableRow): string => row.id;

  protected changeSort(event: Sort): void {
    this.sortChange.emit({ column: event.active, direction: event.direction });
  }

  protected changePage(event: PageEvent): void {
    this.pageChange.emit({ pageIndex: event.pageIndex, pageSize: event.pageSize });
  }

  protected readonly detailColumns = computed(() => this.columns().filter((column) => column.key !== this.titleKey()));

  /** On phones every column but the title becomes a line of its own under it (empty cells are left out). */
  protected detailLines(row: DataTableRow): { readonly key: string; readonly label: string; readonly value: string }[] {
    return this.detailColumns()
      .map((column) => ({ key: column.key, label: column.label, value: row.cells[column.key] ?? '' }))
      .filter((line) => line.value !== '');
  }
}
