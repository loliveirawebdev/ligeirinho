import { ChangeDetectionStrategy, Component, effect, input, signal } from '@angular/core';
import { defineScenarios } from '@ligeirinho/previewer';
import { Cascader, type CascaderOption } from './cascader';

interface CascaderPreviewModel {
  readonly label: string;
  readonly backLabel: string;
  readonly options: readonly CascaderOption[];
  readonly value: readonly string[];
  readonly disabled?: boolean;
}

@Component({
  selector: 'ui-cascader-preview',
  imports: [Cascader],
  template: `
    <div class="max-w-md p-4 sm:p-8">
      <ui-cascader
        [label]="model().label"
        [backLabel]="model().backLabel"
        [options]="model().options"
        [disabled]="model().disabled ?? false"
        [(value)]="value"
      />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class CascaderPreview {
  readonly model = input.required<CascaderPreviewModel>();
  /** Played as a page would: the path picked shows in the field. */
  protected readonly value = signal<readonly string[]>([]);

  constructor() {
    effect(() => {
      this.value.set(this.model().value);
    });
  }
}

const PLACES: readonly CascaderOption[] = [
  {
    value: 'br',
    label: 'Brazil',
    children: [
      {
        value: 'sp',
        label: 'São Paulo',
        children: [
          { value: 'sao-paulo', label: 'São Paulo' },
          { value: 'campinas', label: 'Campinas' },
          { value: 'santos', label: 'Santos' },
          { value: 'ribeirao', label: 'Ribeirão Preto' },
        ],
      },
      {
        value: 'rj',
        label: 'Rio de Janeiro',
        children: [
          { value: 'rio', label: 'Rio de Janeiro' },
          { value: 'niteroi', label: 'Niterói' },
        ],
      },
      { value: 'mg', label: 'Minas Gerais', children: [{ value: 'bh', label: 'Belo Horizonte' }] },
    ],
  },
  {
    value: 'pt',
    label: 'Portugal',
    children: [
      { value: 'lisboa', label: 'Lisboa', children: [{ value: 'lisbon', label: 'Lisbon' }, { value: 'sintra', label: 'Sintra' }] },
      { value: 'porto', label: 'Porto', children: [{ value: 'porto-city', label: 'Porto' }] },
    ],
  },
  { value: 'ar', label: 'Argentina', disabled: true, children: [] },
];

const CATEGORIES: readonly CascaderOption[] = [
  {
    value: 'hardware',
    label: 'Hardware',
    children: [
      { value: 'laptops', label: 'Laptops' },
      { value: 'monitors', label: 'Monitors' },
      { value: 'peripherals', label: 'Keyboards and mice' },
    ],
  },
  {
    value: 'software',
    label: 'Software',
    children: [
      { value: 'licenses', label: 'Licenses' },
      { value: 'subscriptions', label: 'Subscriptions' },
    ],
  },
  { value: 'services', label: 'Services' },
];

const city: CascaderPreviewModel = { label: 'City', backLabel: 'Back to {label}', options: PLACES, value: [] };

export const cascaderScenarios = defineScenarios({
  flow: 'Catalog',
  title: 'Cascader',
  component: CascaderPreview,
  scenarios: {
    /** Nothing chosen yet: country, then state, then city; Argentina not available. */
    empty: city,
    /** A city chosen: opening shows the path down to it. */
    chosen: { ...city, value: ['br', 'sp', 'campinas'] },
    /** Two levels, and a leaf at the top level (Services). */
    categories: { label: 'Category', backLabel: 'Back to {label}', options: CATEGORIES, value: ['software', 'licenses'] },
    disabled: { ...city, value: ['pt', 'lisboa', 'sintra'], disabled: true },
  },
});
