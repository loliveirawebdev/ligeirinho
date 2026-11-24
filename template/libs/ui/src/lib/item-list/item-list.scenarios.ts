import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { defineScenarios } from '@ligeirinho/previewer';
import { ItemList, type ListItem } from './item-list';

@Component({
  selector: 'ui-item-list-preview',
  imports: [ItemList],
  template: `
    <div class="mx-auto max-w-2xl p-4 sm:p-8"><ui-item-list [label]="model().label" [items]="model().items" /></div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ItemListPreview {
  readonly model = input.required<{ readonly label: string; readonly items: readonly ListItem[] }>();
}

const invoices: readonly ListItem[] = [
  { id: 'inv-1042', title: 'Invoice 1042', supportingText: 'Northwind Traders · €1,280.00', meta: 'Today', icon: 'receipt_long' },
  { id: 'inv-1041', title: 'Invoice 1041', supportingText: 'Contoso Pharmaceuticals · €320.50', meta: 'Mar 2', icon: 'receipt_long' },
  {
    id: 'inv-1040',
    title: 'Invoice 1040 for the quarterly maintenance of the distribution centre in Valencia',
    supportingText: 'Fabrikam Logistics · €12,940.00',
    meta: 'Feb 27',
    icon: 'receipt_long',
  },
];

export const itemListScenarios = defineScenarios({
  flow: 'Catalog',
  title: 'Item list',
  component: ItemListPreview,
  scenarios: {
    withIcons: { label: 'Invoices', items: invoices },
    textOnly: { label: 'Invoices', items: invoices.map(({ id, title }) => ({ id, title })) },
  },
});
