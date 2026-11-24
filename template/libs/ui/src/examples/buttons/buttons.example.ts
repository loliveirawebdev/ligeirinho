import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ExampleNote } from '../example-note';

/** One of Material's text buttons, from the most emphasis to the least. */
export type ButtonEmphasis = 'filled' | 'tonal' | 'outlined' | 'elevated' | 'text';

export interface ButtonRow {
  readonly emphasis: ButtonEmphasis;
  readonly name: string;
  /** When to use it (rules/design.md, "One filled button per screen or section"). */
  readonly use: string;
}

export interface IconButtonRow {
  readonly name: string;
  readonly use: string;
}

export interface ButtonsExampleModel {
  readonly title: string;
  readonly textButtons: { readonly title: string; readonly rows: readonly ButtonRow[] };
  readonly iconButtons: { readonly title: string; readonly name: string; readonly use: string };
  readonly fabs: {
    readonly title: string;
    readonly fab: IconButtonRow;
    readonly miniFab: IconButtonRow;
    readonly extendedFab: IconButtonRow;
  };
  readonly toggle: {
    readonly title: string;
    readonly name: string;
    readonly use: string;
    readonly options: readonly { readonly value: string; readonly label: string }[];
    readonly selected: string;
  };
  /** Column heads of each row of examples. */
  readonly columns: { readonly plain: string; readonly withIcon: string; readonly iconAtEnd: string; readonly disabled: string };
  /** The sample labels on the buttons. */
  readonly sample: {
    readonly action: string;
    readonly icon: string;
    readonly iconAtEnd: string;
    readonly iconLabel: string;
    readonly iconNames: readonly string[];
  };
}

/**
 * Every button the screens use, straight from Angular Material at the compact scale: the five text buttons in order
 * of emphasis, icon buttons, FABs and a toggle group, each normal, with an icon and disabled. A reference to pick
 * from, not a component: screens use Material's directives (`matButton="filled"`, `matIconButton`, `matFab`).
 */
@Component({
  selector: 'ui-buttons-example',
  imports: [ExampleNote, MatButtonModule, MatButtonToggleModule, MatIconModule, MatTooltipModule],
  templateUrl: './buttons.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonsExample {
  readonly model = input.required<ButtonsExampleModel>();
  /** Each button twice: as it is, then disabled. */
  protected readonly enabledThenDisabled = [false, true] as const;
}
