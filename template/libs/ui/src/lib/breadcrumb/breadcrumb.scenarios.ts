import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { defineScenarios } from '@ligeirinho/previewer';
import { Breadcrumb, type BreadcrumbItem } from './breadcrumb';

interface BreadcrumbPreviewModel {
  readonly label: string;
  readonly items: readonly BreadcrumbItem[];
}

@Component({
  selector: 'ui-breadcrumb-preview',
  imports: [Breadcrumb],
  template: `
    <div class="p-4 sm:p-8">
      <ui-breadcrumb [label]="model().label" [items]="model().items" />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class BreadcrumbPreview {
  readonly model = input.required<BreadcrumbPreviewModel>();
}

export const breadcrumbScenarios = defineScenarios({
  flow: 'Catalog',
  title: 'Breadcrumb',
  component: BreadcrumbPreview,
  scenarios: {
    threeLevels: {
      label: 'Breadcrumb',
      items: [{ label: 'Clients', link: '/__preview' }, { label: 'Northwind', link: '/__preview' }, { label: 'Contract 2026' }],
    },
    /** Long names end in an ellipsis; on phones the trail wraps. */
    longNames: {
      label: 'Breadcrumb',
      items: [
        { label: 'Clients', link: '/__preview' },
        { label: 'Northwind Traders International Holdings', link: '/__preview' },
        { label: 'Contracts', link: '/__preview' },
        { label: 'Master services agreement 2026, renewal with new pricing' },
      ],
    },
  },
});
