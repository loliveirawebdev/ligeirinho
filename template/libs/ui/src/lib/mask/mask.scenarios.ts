import { ChangeDetectionStrategy, Component, input, linkedSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { defineScenarios } from '@ligeirinho/previewer';
import { formatText } from '../copy/copy';
import { Mask, MASKS, type MaskPattern } from './mask';

interface MaskedField {
  readonly label: string;
  readonly mask: MaskPattern;
  readonly value: string;
  readonly keep?: 'raw' | 'masked';
}

interface MaskPreviewModel {
  /** Under each field, what the form keeps: `Saved as {value}`. */
  readonly savedAs: string;
  readonly fields: readonly MaskedField[];
}

@Component({
  selector: 'ui-mask-preview',
  imports: [FormsModule, Mask, MatFormFieldModule, MatInputModule],
  template: `
    <form class="grid max-w-2xl gap-x-4 gap-y-4 p-4 sm:grid-cols-2 sm:p-8">
      @for (field of model().fields; track field.label; let i = $index) {
        <mat-form-field appearance="outline">
          <mat-label>{{ field.label }}</mat-label>
          <input
            matInput
            [name]="field.label"
            [uiMask]="field.mask"
            [uiMaskValue]="field.keep ?? 'raw'"
            [ngModel]="values()[i]"
            (ngModelChange)="keep(i, $event)"
          />
          <mat-hint>{{ savedAs(values()[i] ?? '') }}</mat-hint>
        </mat-form-field>
      }
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class MaskPreview {
  readonly model = input.required<MaskPreviewModel>();
  protected readonly values = linkedSignal(() => this.model().fields.map((field) => field.value));

  protected keep(index: number, value: string): void {
    this.values.update((values) => values.map((current, at) => (at === index ? value : current)));
  }

  protected savedAs(value: string): string {
    return formatText(this.model().savedAs, { value });
  }
}

const savedAs = 'Saved as {value}';

export const maskScenarios = defineScenarios({
  flow: 'Catalog',
  title: 'Mask',
  component: MaskPreview,
  scenarios: {
    brazil: {
      savedAs,
      fields: [
        { label: 'CPF', mask: MASKS.cpf, value: '12345678900' },
        { label: 'CPF or CNPJ', mask: MASKS.cpfOrCnpj, value: '12345678000199' },
        { label: 'Phone', mask: MASKS.phone, value: '11987654321' },
        { label: 'CEP', mask: MASKS.cep, value: '01310100' },
        { label: 'Birth date', mask: MASKS.date, value: '', keep: 'masked' },
        { label: 'Plate', mask: MASKS.plate, value: 'BRA2E19', keep: 'masked' },
      ],
    },
    custom: {
      savedAs,
      fields: [
        { label: 'Order number', mask: 'AA-000000', value: 'NW204517' },
        { label: 'ZIP code', mask: ['00000', '00000-0000'], value: '' },
      ],
    },
  },
});
