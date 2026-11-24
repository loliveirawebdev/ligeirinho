import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { defineScenarios } from '@ligeirinho/previewer';
import { DetailList, type DetailItem } from '../detail-list/detail-list';
import { Splitter } from './splitter';

interface SplitterPreviewModel {
  readonly handleLabel: string;
  readonly direction: 'row' | 'column';
  readonly size: number;
  readonly listTitle: string;
  readonly items: readonly string[];
  readonly detailTitle: string;
  readonly facts: readonly DetailItem[];
}

@Component({
  selector: 'ui-splitter-preview',
  imports: [DetailList, Splitter],
  template: `
    @let m = model();
    <div class="p-4 sm:p-8">
      <ui-splitter
        class="h-[420px] rounded-md border border-outline-variant"
        [handleLabel]="m.handleLabel"
        [direction]="m.direction"
        [size]="m.size"
      >
        <section uiSplitterStart class="p-4">
          <h2 class="text-title-medium mb-3">{{ m.listTitle }}</h2>
          <ul class="text-body-medium flex flex-col gap-2">
            @for (item of m.items; track item) {
              <li>{{ item }}</li>
            }
          </ul>
        </section>
        <section uiSplitterEnd class="p-4">
          <h2 class="text-title-medium mb-3">{{ m.detailTitle }}</h2>
          <ui-detail-list [items]="m.facts" />
        </section>
      </ui-splitter>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class SplitterPreview {
  readonly model = input.required<SplitterPreviewModel>();
}

const clients: SplitterPreviewModel = {
  handleLabel: 'Resize the list',
  direction: 'row',
  size: 35,
  listTitle: 'Clients',
  items: ['Northwind Traders', 'Contoso', 'Fabrikam', 'Tailspin Toys', 'Wide World Importers'],
  detailTitle: 'Northwind Traders',
  facts: [
    { label: 'Plan', value: 'Business' },
    { label: 'Since', value: 'March 2024' },
    { label: 'Owner', value: 'Ana Souza' },
  ],
};

export const splitterScenarios = defineScenarios({
  flow: 'Catalog',
  title: 'Splitter',
  component: SplitterPreview,
  scenarios: {
    /** A list beside its detail: drag the line, or focus it and use the arrow keys. Stacked on phones. */
    sideBySide: clients,
    /** One above the other. */
    stacked: { ...clients, direction: 'column', size: 45, handleLabel: 'Resize the top pane' },
  },
});
