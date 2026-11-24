import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTimepickerModule } from '@angular/material/timepicker';

/** What a control is for, shown above it: the Material name and when to use it. */
export interface ControlNote {
  readonly name: string;
  readonly use: string;
}

export interface Option {
  readonly value: string;
  readonly label: string;
}

export interface FormsExampleModel {
  readonly title: string;
  readonly sections: {
    readonly text: string;
    readonly choice: string;
    readonly onOff: string;
    readonly range: string;
  };
  readonly notes: {
    readonly field: ControlNote;
    readonly fieldIcon: ControlNote;
    readonly fieldHint: ControlNote;
    readonly fieldError: ControlNote;
    readonly fieldDisabled: ControlNote;
    readonly fieldClear: ControlNote;
    readonly textarea: ControlNote;
    readonly date: ControlNote;
    readonly dateRange: ControlNote;
    readonly time: ControlNote;
    readonly select: ControlNote;
    readonly selectMultiple: ControlNote;
    readonly autocomplete: ControlNote;
    readonly radio: ControlNote;
    readonly chips: ControlNote;
    readonly checkbox: ControlNote;
    readonly toggle: ControlNote;
    readonly slider: ControlNote;
  };
  readonly labels: {
    readonly name: string;
    readonly email: string;
    readonly phone: string;
    readonly phoneHint: string;
    readonly required: string;
    readonly requiredError: string;
    readonly team: string;
    readonly search: string;
    readonly clear: string;
    readonly notes: string;
    readonly start: string;
    readonly period: string;
    readonly periodStart: string;
    readonly periodEnd: string;
    readonly time: string;
    readonly role: string;
    readonly teams: string;
    readonly country: string;
    readonly plan: string;
    readonly status: string;
    readonly seats: string;
  };
  readonly values: {
    readonly name: string;
    readonly team: string;
    readonly search: string;
  };
  readonly roles: readonly Option[];
  readonly teams: readonly Option[];
  readonly countries: readonly Option[];
  readonly plans: readonly Option[];
  readonly statuses: readonly Option[];
  readonly checkboxes: { readonly unchecked: string; readonly checked: string; readonly mixed: string; readonly disabled: string };
  readonly toggles: { readonly off: string; readonly on: string; readonly disabled: string };
}

/**
 * Every form control the screens use, straight from Angular Material at the compact scale: text fields (with an icon,
 * a hint, an error, disabled, with a clear button), text area, date, date range, time, select, autocomplete, radio, filter chips,
 * checkbox, toggle and slider. A reference to pick from, not a component: screens use Material directly.
 */
@Component({
  selector: 'ui-forms-example',
  imports: [
    MatAutocompleteModule,
    MatButtonModule,
    MatCheckboxModule,
    MatChipsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatRadioModule,
    MatSelectModule,
    MatSliderModule,
    MatSlideToggleModule,
    MatTimepickerModule,
    NgTemplateOutlet,
    ReactiveFormsModule,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './forms.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormsExample {
  readonly model = input.required<FormsExampleModel>();

  /** Touched and empty, so the error shows the way it does after a submit. */
  protected readonly requiredControl = new FormControl('', { validators: [(control) => Validators.required(control)] });

  constructor() {
    this.requiredControl.markAsTouched();
  }
}
