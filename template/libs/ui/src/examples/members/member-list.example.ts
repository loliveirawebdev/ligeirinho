import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AppShell, type ShellAction, type ShellNavSection, type ShellUser } from '../../lib/app-shell/app-shell';
import { DataTable, type DataTableColumn, type DataTableRow, type DataTableShowMore } from '../../lib/data-table/data-table';
import { EmptyState } from '../../lib/empty-state/empty-state';
import { FilterBar, type FilterOption } from '../../lib/filter-bar/filter-bar';
import { LoadingState } from '../../lib/loading-state/loading-state';
import { Notice } from '../../lib/notice/notice';
import { PageHeader } from '../../lib/page-header/page-header';

export interface ExampleShell {
  readonly productName: string;
  readonly navigation: readonly ShellNavSection[];
  readonly navigationLabel: string;
  readonly menuLabel: string;
  readonly actions: readonly ShellAction[];
  readonly user: ShellUser;
}

export interface MemberListExampleModel {
  readonly shell: ExampleShell;
  readonly status: 'ready' | 'loading' | 'failed';
  readonly text: {
    readonly title: string;
    readonly summary: string;
    readonly inviteAction: string;
    readonly searchLabel: string;
    readonly filtersLabel: string;
    readonly tableLabel: string;
    readonly loading: string;
    readonly loadFailedTitle: string;
    readonly loadFailedMessage: string;
    readonly retryAction: string;
    readonly emptyTitle: string;
    readonly emptyMessage: string;
    readonly clearSearchAction: string;
  };
  readonly query: string;
  readonly filters: readonly FilterOption[];
  readonly selectedFilter: string;
  readonly columns: readonly DataTableColumn[];
  readonly rows: readonly DataTableRow[];
  /** The *Show more* bar under the rows, with the view-model's words; none once every row shows. */
  readonly more?: DataTableShowMore | undefined;
}

/**
 * Screen pattern: a back office list. Shell, header with the primary action, search and filters, then exactly one
 * of loading, error, empty or the table, with the *Show more* bar under its last row. Copy the composition, not the markup.
 */
@Component({
  selector: 'ui-member-list-example',
  imports: [AppShell, DataTable, EmptyState, FilterBar, LoadingState, MatButtonModule, MatIconModule, Notice, PageHeader],
  templateUrl: './member-list.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MemberListExample {
  readonly model = input.required<MemberListExampleModel>();
}
