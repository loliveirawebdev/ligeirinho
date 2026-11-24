import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule, type MatCardAppearance } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTreeModule } from '@angular/material/tree';
import type { CatalogNote } from '../catalog-note';

export interface ListSample {
  readonly icon: string;
  readonly title: string;
  readonly line: string;
}

export interface TreeSample {
  readonly name: string;
  /** The toggle's accessible name (*Show Operations*), for nodes with children. */
  readonly toggleLabel?: string;
  readonly children?: readonly TreeSample[];
}

export interface ContainersExampleModel {
  readonly title: string;
  readonly sections: {
    readonly cards: string;
    readonly expansion: string;
    readonly lists: string;
    readonly grid: string;
    readonly tree: string;
  };
  readonly notes: {
    readonly cards: readonly (CatalogNote & { readonly appearance: MatCardAppearance })[];
    readonly expansion: CatalogNote;
    readonly list: CatalogNote;
    readonly listTwoLines: CatalogNote;
    readonly selectionList: CatalogNote;
    readonly divider: CatalogNote;
    readonly gridList: CatalogNote;
    readonly tree: CatalogNote;
  };
  readonly card: {
    readonly title: string;
    readonly subtitle: string;
    readonly body: string;
    readonly action: string;
    readonly secondaryAction: string;
  };
  readonly panels: readonly { readonly title: string; readonly description: string; readonly body: string }[];
  readonly list: { readonly subheader: string; readonly items: readonly ListSample[] };
  readonly selection: { readonly label: string; readonly options: readonly { readonly value: string; readonly label: string }[]; readonly selected: readonly string[] };
  readonly divider: { readonly items: readonly string[] };
  readonly tiles: readonly { readonly label: string; readonly cols: number; readonly rows: number }[];
  readonly tree: { readonly label: string; readonly nodes: readonly TreeSample[] };
}

/**
 * Containers and lists from Angular Material at the compact scale: cards, expansion panels, lists, dividers, grid
 * lists and trees. A reference to pick from, not a component: screens use Material directly (records the user opens
 * are `ui-item-list` or `ui-data-table`; a record's facts are `ui-detail-list`).
 */
@Component({
  selector: 'ui-containers-example',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatExpansionModule,
    MatGridListModule,
    MatIconModule,
    MatListModule,
    MatTreeModule,
    NgTemplateOutlet,
  ],
  templateUrl: './containers.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContainersExample {
  readonly model = input.required<ContainersExampleModel>();

  protected readonly childrenOf = (node: TreeSample): TreeSample[] => [...(node.children ?? [])];
  protected readonly hasChildren = (_: number, node: TreeSample): boolean => (node.children?.length ?? 0) > 0;
  protected readonly treeNodes = (nodes: readonly TreeSample[]): TreeSample[] => [...nodes];
}
