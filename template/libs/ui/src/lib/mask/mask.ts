import { computed, Directive, ElementRef, forwardRef, inject, input } from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';

/**
 * A mask: `0` a digit, `A` a letter, `*` a letter or a digit, anything else written as is (`000.000.000-00`). A list
 * is a set of alternatives by length: the first that holds what was typed wins (`['(00) 0000-0000', '(00) 00000-0000']`).
 */
export type MaskPattern = string | readonly string[];

/**
 * Masks most screens need. Formats that change by country (phone, postal code, tax ids, dates) are Brazil's here:
 * a screen for another market passes its own pattern, from its copy when it changes with the locale.
 */
export const MASKS = {
  cpf: '000.000.000-00',
  cnpj: '00.000.000/0000-00',
  cpfOrCnpj: ['000.000.000-00', '00.000.000/0000-00'],
  phone: ['(00) 0000-0000', '(00) 00000-0000'],
  cep: '00000-000',
  date: '00/00/0000',
  time: '00:00',
  card: '0000 0000 0000 0000',
  plate: 'AAA-0*00',
} as const satisfies Record<string, MaskPattern>;

/** The pattern's slots and what each takes: `0` a digit, `A` a letter, `*` either. */
const SLOTS = new Map<string, RegExp>([
  ['0', /\d/],
  ['A', /\p{L}/u],
  ['*', /[\p{L}\d]/u],
]);

/** A text's characters, one per code point (masks hold letters and digits, never emoji). */
function charsOf(text: string): string[] {
  return Array.from(text);
}

function isSlot(char: string): boolean {
  return SLOTS.has(char);
}

function slotsIn(pattern: string): number {
  return charsOf(pattern).filter(isSlot).length;
}

function patternsOf(mask: MaskPattern): readonly string[] {
  return typeof mask === 'string' ? [mask] : mask;
}

/** What the user typed, without the mask's characters: the value the form keeps (`12345678900`). */
export function unmask(text: string, mask: MaskPattern): string {
  const patterns = patternsOf(mask);
  const longest = patterns.reduce((best, pattern) => (slotsIn(pattern) > slotsIn(best) ? pattern : best), patterns[0] ?? '');
  const literals = new Set(charsOf(patterns.join('')).filter((char) => !isSlot(char)));
  // Only what some slot takes: a mask of digits drops letters as they are typed.
  const slots = charsOf(patterns.join('')).flatMap((char) => SLOTS.get(char) ?? []);
  const kept = charsOf(text).filter((char) => !literals.has(char) && slots.some((slot) => slot.test(char)));
  return kept.slice(0, slotsIn(longest)).join('');
}

/** The raw value written in its mask, as far as it goes (`123456` → `123.456`); letters in capitals. */
export function applyMask(raw: string, mask: MaskPattern): string {
  const patterns = patternsOf(mask);
  const chars = charsOf(raw);
  const pattern = patterns.find((candidate) => slotsIn(candidate) >= chars.length) ?? patterns.at(-1) ?? '';
  let out = '';
  let next = 0;
  for (const slot of charsOf(pattern)) {
    if (next >= chars.length) {
      break;
    }
    const takes = SLOTS.get(slot);
    if (!takes) {
      out += slot;
      continue;
    }
    const char = chars[next] ?? '';
    if (!takes.test(char)) {
      break;
    }
    out += char.toLocaleUpperCase();
    next += 1;
  }
  return out;
}

/**
 * Types a field in its mask: `<input matInput [uiMask]="masks.cpf" formControlName="cpf">` shows `123.456.789-00`
 * while the form keeps `12345678900` (`uiMaskValue="masked"` keeps it as shown). The caret stays where the user
 * types, pasted text is formatted, a digits-only mask opens the numeric keyboard.
 */
@Directive({
  selector: 'input[uiMask]',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Mask), multi: true }],
  host: {
    // A mark in the DOM for the harness: `[uiMask]` bound as a property leaves no attribute.
    'data-ui-mask': '',
    '[attr.inputmode]': 'numeric() ? "numeric" : null',
    '[attr.maxlength]': 'maxLength()',
    '(input)': 'typed()',
    '(blur)': 'touched()',
  },
})
export class Mask implements ControlValueAccessor {
  readonly uiMask = input.required<MaskPattern>();
  /** What the form receives: the characters typed (`raw`, the default) or the text as shown (`masked`). */
  readonly uiMaskValue = input<'raw' | 'masked'>('raw');

  private readonly field: HTMLInputElement = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;
  protected readonly numeric = computed(() => patternsOf(this.uiMask()).every((pattern) => !/[A*]/.test(pattern)));
  protected readonly maxLength = computed(() => Math.max(...patternsOf(this.uiMask()).map((pattern) => pattern.length)));

  private changed: (value: string) => void = () => undefined;
  private touchedBy: () => void = () => undefined;

  writeValue(value: unknown): void {
    const raw = typeof value === 'string' || typeof value === 'number' ? unmask(String(value), this.uiMask()) : '';
    this.field.value = applyMask(raw, this.uiMask());
  }

  registerOnChange(changed: (value: string) => void): void {
    this.changed = changed;
  }

  registerOnTouched(touchedBy: () => void): void {
    this.touchedBy = touchedBy;
  }

  setDisabledState(disabled: boolean): void {
    this.field.disabled = disabled;
  }

  protected typed(): void {
    const mask = this.uiMask();
    const caret = this.field.selectionStart ?? this.field.value.length;
    // Where the caret goes: after as many typed characters as stood before it.
    const before = unmask(this.field.value.slice(0, caret), mask).length;
    const raw = unmask(this.field.value, mask);
    const shown = applyMask(raw, mask);
    this.field.value = shown;
    const atEnd = caret >= this.field.value.length;
    if (!atEnd && this.field === this.field.ownerDocument.activeElement) {
      const position = caretAfter(shown, before);
      this.field.setSelectionRange(position, position);
    }
    this.changed(this.uiMaskValue() === 'masked' ? shown : unmask(shown, mask));
  }

  protected touched(): void {
    this.touchedBy();
  }
}

/** The index in the masked text just after its `count`-th typed character. */
function caretAfter(shown: string, count: number): number {
  let seen = 0;
  for (let index = 0; index < shown.length; index += 1) {
    if (seen === count) {
      return index;
    }
    if (/[\p{L}\d]/u.test(shown[index] ?? '')) {
      seen += 1;
    }
  }
  return shown.length;
}
