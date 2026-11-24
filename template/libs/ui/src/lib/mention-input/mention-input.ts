import { OverlayModule, type ConnectedPosition } from '@angular/cdk/overlay';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  forwardRef,
  input,
  model,
  output,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

/** Someone who can be mentioned. */
export interface MentionPerson {
  readonly id: string;
  readonly name: string;
  /** A second line in the suggestions: a role, an email. */
  readonly secondary?: string;
}

let nextMentionInput = 0;

function folded(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

/** An `@` at the start or after a space, then the name typed so far, right before the caret. */
const MENTION_BEFORE_CARET = /(?:^|\s)@([^\s@]*)$/;

/**
 * A text area where typing `@` suggests people, filtered by what follows (*@an* → Ana Souza, Joana Prado); choosing
 * one (click, or arrows then Enter or Tab) writes *@Ana Souza* in the text. The value is the text; `mentionsChange`
 * reports the ids of the people mentioned in it, in the people's order, whenever they change. Esc closes the
 * suggestions. Works with `[(value)]`, reactive forms and signal forms.
 */
@Component({
  selector: 'ui-mention-input',
  imports: [MatFormFieldModule, MatInputModule, OverlayModule],
  templateUrl: './mention-input.html',
  styleUrl: './mention-input.css',
  // The suggestions open in an overlay, outside this element; every selector starts with .ui-mention.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MentionInput), multi: true }],
  host: { class: 'block' },
})
export class MentionInput implements ControlValueAccessor {
  readonly people = input.required<readonly MentionPerson[]>();
  /** The field's label: *Comment*. */
  readonly label = input.required<string>();
  /** The suggestions' name for screen readers: *People*. */
  readonly suggestionsLabel = input.required<string>();
  /** A line under the field: *Type @ to mention someone*. */
  readonly hint = input('');
  readonly rows = input(3);
  /** How many suggestions show at once. */
  readonly maxSuggestions = input(6);
  readonly value = model('');
  readonly disabled = input(false);

  /** The ids of the people mentioned in the text, whenever they change. */
  readonly mentionsChange = output<readonly string[]>();

  protected readonly id = `ui-mention-input-${String(nextMentionInput++)}`;
  /** What was typed after the `@`, while a mention is being written. */
  protected readonly query = signal<string | null>(null);
  protected readonly active = signal(0);
  protected readonly positions: ConnectedPosition[] = [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 },
  ];

  private readonly formDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  protected readonly suggestions = computed(() => {
    const query = this.query();
    if (query === null) {
      return [];
    }
    const typed = folded(query);
    return this.people()
      .filter((person) => folded(person.name).includes(typed))
      .slice(0, this.maxSuggestions());
  });
  protected readonly open = computed(() => this.suggestions().length > 0);

  private readonly textArea = viewChild.required<ElementRef<HTMLTextAreaElement>>('textArea');
  /** Where the `@` being written sits in the text. */
  private anchor = 0;
  private lastMentions = '';
  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: unknown): void {
    this.value.set(typeof value === 'string' ? value : '');
    this.lastMentions = this.mentionedIds(this.value()).join();
  }

  registerOnChange(onChange: (value: string) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouched = onTouched;
  }

  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled);
  }

  protected optionId(index: number): string {
    return `${this.id}-option-${String(index)}`;
  }

  protected onInput(): void {
    this.update(this.textArea().nativeElement.value);
    this.detect();
  }

  /** Looks for a mention being written right before the caret. */
  protected detect(): void {
    const textArea = this.textArea().nativeElement;
    const caret = textArea.selectionStart;
    const match = MENTION_BEFORE_CARET.exec(textArea.value.slice(0, caret));
    if (!match) {
      this.query.set(null);
      return;
    }
    const typed = match[1] ?? '';
    this.anchor = caret - typed.length - 1;
    if (this.query() !== typed) {
      this.active.set(0);
    }
    this.query.set(typed);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const count = this.suggestions().length;
    if (count === 0) {
      return;
    }
    const handled = this.handleKey(event.key, count);
    if (handled) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  protected onBlur(): void {
    this.query.set(null);
    this.onTouched();
  }

  protected choose(person: MentionPerson): void {
    const textArea = this.textArea().nativeElement;
    const text = textArea.value;
    const inserted = `@${person.name} `;
    const next = text.slice(0, this.anchor) + inserted + text.slice(textArea.selectionStart);
    const caret = this.anchor + inserted.length;
    textArea.value = next;
    textArea.setSelectionRange(caret, caret);
    textArea.focus();
    this.query.set(null);
    this.update(next);
  }

  private handleKey(key: string, count: number): boolean {
    if (key === 'ArrowDown' || key === 'ArrowUp') {
      this.active.update((index) => (index + (key === 'ArrowDown' ? 1 : -1) + count) % count);
      return true;
    }
    const person = this.suggestions()[this.active()];
    if ((key === 'Enter' || key === 'Tab') && person) {
      this.choose(person);
      return true;
    }
    if (key === 'Escape') {
      this.query.set(null);
      return true;
    }
    return false;
  }

  private update(text: string): void {
    this.value.set(text);
    this.onChange(text);
    const mentions = this.mentionedIds(text);
    if (mentions.join() !== this.lastMentions) {
      this.lastMentions = mentions.join();
      this.mentionsChange.emit(mentions);
    }
  }

  private mentionedIds(text: string): string[] {
    return this.people()
      .filter((person) => text.includes(`@${person.name}`))
      .map((person) => person.id);
  }
}
