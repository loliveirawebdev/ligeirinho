import { ChangeDetectionStrategy, Component, effect, input, signal } from '@angular/core';
import { defineScenarios } from '@ligeirinho/previewer';
import { Transfer, type TransferItem, type TransferLabels } from './transfer';

interface TransferPreviewModel {
  readonly items: readonly TransferItem[];
  readonly labels: TransferLabels;
  readonly value: readonly string[];
  readonly disabled?: boolean;
}

@Component({
  selector: 'ui-transfer-preview',
  imports: [Transfer],
  template: `
    <div class="mx-auto max-w-4xl p-4 sm:p-8">
      <ui-transfer [items]="model().items" [labels]="model().labels" [disabled]="model().disabled ?? false" [(value)]="value" />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TransferPreview {
  readonly model = input.required<TransferPreviewModel>();
  /** Played as a page would: what is moved stays moved. */
  protected readonly value = signal<readonly string[]>([]);

  constructor() {
    effect(() => {
      this.value.set(this.model().value);
    });
  }
}

const PEOPLE: readonly TransferItem[] = [
  { value: 'ana', label: 'Ana Souza', secondary: 'ana.souza@northwind.com' },
  { value: 'bruno', label: 'Bruno Lima', secondary: 'bruno.lima@northwind.com' },
  { value: 'carla', label: 'Carla Dias', secondary: 'carla.dias@northwind.com' },
  { value: 'davi', label: 'Davi Rocha', secondary: 'davi.rocha@northwind.com', disabled: true },
  { value: 'elisa', label: 'Elisa Prado', secondary: 'elisa.prado@northwind.com' },
  { value: 'fabio', label: 'Fábio Nunes', secondary: 'fabio.nunes@northwind.com' },
  { value: 'gabriela', label: 'Gabriela Reis', secondary: 'gabriela.reis@northwind.com' },
  { value: 'heitor', label: 'Heitor Alves', secondary: 'heitor.alves@northwind.com' },
];

const PERMISSIONS: readonly TransferItem[] = [
  { value: 'clients.view', label: 'View clients' },
  { value: 'clients.edit', label: 'Edit clients' },
  { value: 'contracts.view', label: 'View contracts' },
  { value: 'contracts.sign', label: 'Sign contracts' },
  { value: 'billing.view', label: 'View invoices' },
  { value: 'billing.refund', label: 'Refund payments' },
];

const labels: TransferLabels = {
  source: 'Available',
  target: 'Team members',
  search: 'Search people',
  selectAll: 'Select all',
  count: '{checked} of {total}',
  moveRight: 'Add selected people',
  moveLeft: 'Remove selected people',
  empty: 'Nobody here',
};

const team: TransferPreviewModel = { items: PEOPLE, labels, value: ['bruno', 'elisa'] };

export const transferScenarios = defineScenarios({
  flow: 'Catalog',
  title: 'Transfer',
  component: TransferPreview,
  scenarios: {
    /** People of a team: two in, Davi not available. */
    team,
    /** Nobody chosen yet: the target list is empty. */
    empty: { ...team, value: [] },
    /** Permissions of a role, one line each. */
    permissions: {
      items: PERMISSIONS,
      labels: { ...labels, target: 'Granted', search: 'Search permissions', moveRight: 'Grant selected', moveLeft: 'Revoke selected', empty: 'No permission here' },
      value: ['clients.view', 'contracts.view'],
    },
    disabled: { ...team, disabled: true },
  },
});
