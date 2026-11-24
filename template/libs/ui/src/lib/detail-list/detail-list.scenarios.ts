import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { defineScenarios } from '@ligeirinho/previewer';
import { DetailList, type DetailItem } from './detail-list';

@Component({
  selector: 'ui-detail-list-preview',
  imports: [DetailList],
  template: `<div class="mx-auto max-w-3xl p-4 sm:p-8"><ui-detail-list [items]="model().items" [truncate]="model().truncate ?? false" /></div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class DetailListPreview {
  readonly model = input.required<{ readonly items: readonly DetailItem[]; readonly truncate?: boolean }>();
}

export const detailListScenarios = defineScenarios({
  flow: 'Catalog',
  title: 'Detail list',
  component: DetailListPreview,
  scenarios: {
    member: {
      items: [
        { label: 'Email', value: 'ana.souza@northwind.example' },
        { label: 'Role', value: 'Administrator' },
        { label: 'Team', value: 'Operations' },
        { label: 'Last active', value: 'Today, 09:42' },
      ],
    },
    longValues: {
      items: [
        { label: 'Billing address', value: 'Calle de Alcalá 123, 4º izquierda, 28009 Madrid, Spain' },
        { label: 'Tax identification number', value: 'ESB12345678' },
      ],
    },
    /** The same long values on one line each, cut with an ellipsis. */
    truncated: {
      truncate: true,
      items: [
        { label: 'Billing address', value: 'Calle de Alcalá 123, 4º izquierda, 28009 Madrid, Spain' },
        { label: 'Tax identification number', value: 'ESB12345678' },
      ],
    },
  },
});
