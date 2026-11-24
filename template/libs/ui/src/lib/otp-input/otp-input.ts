import { ChangeDetectionStrategy, Component, ElementRef, ViewEncapsulation, computed, forwardRef, inject, input, model, output, viewChildren } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { FormValueControl } from '../form-value-control';

let nextOtp = 0;

/**
 * A one-time code (sign-in, confirming an email or a phone): one box per character, read as one field. Digits only
 * unless `alphanumeric`; typing moves on, Backspace goes back, the arrows, Home and End move, and a pasted or
 * autofilled code (the first box has `autocomplete="one-time-code"`, so the phone offers the code from the SMS) fills
 * every box at once. Emits `completed` with the code when the last box is filled, so the page can verify without a
 * button. Works with signals (`[(value)]`) and with Angular forms (`formControl`, `ngModel`).
 */
@Component({
  selector: 'ui-otp-input',
  templateUrl: './otp-input.html',
  styleUrl: './otp-input.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => OtpInput), multi: true }],
  host: { class: 'block', '(focusout)': 'leave($event)' },
})
export class OtpInput extends FormValueControl<string> {
  /** What the code is, read as the group's name: *Verification code*. */
  readonly label = input.required<string>();
  /** Shows the label above the boxes; when false it is only read by screen readers (the page's title says it). */
  readonly showLabel = input(true);
  readonly length = input(6);
  /** Letters and digits (stored in capitals) instead of digits only. */
  readonly alphanumeric = input(false);
  /** What went wrong, under the boxes: *That code didn’t work. Check the latest message or send a new code.* */
  readonly error = input('');
  /** Each box's name after the group's, for screen readers: *1 of 6*. */
  readonly boxLabel = input<(position: number, length: number) => string>((position, length) => `${String(position)}/${String(length)}`);
  /** The code typed so far, without gaps. */
  readonly value = model('');

  /** The whole code, once every box is filled by the person. */
  readonly completed = output<string>();

  protected readonly id = `ui-otp-input-${String(nextOtp++)}`;
  protected readonly boxes = computed(() => Array.from({ length: Math.max(1, this.length()) }, (_, index) => index));

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly inputs = viewChildren<ElementRef<HTMLInputElement>>('box');

  override writeValue(code: unknown): void {
    this.value.set(this.clean(typeof code === 'string' ? code : ''));
  }

  protected charAt(index: number): string {
    return this.value().charAt(index);
  }

  /** Boxes fill in order: focusing one past the code moves to the first empty box, selecting what is there to replace it. */
  protected focusBox(index: number): void {
    const target = Math.min(index, this.value().length, this.boxes().length - 1);
    if (target !== index) {
      this.focus(target);
      return;
    }
    this.inputs()[index]?.nativeElement.select();
  }

  protected typed(index: number, inputEvent: Event): void {
    if (!(inputEvent.target instanceof HTMLInputElement)) {
      return;
    }
    const box = inputEvent.target;
    let text = this.clean(box.value);
    const previous = this.charAt(index);
    // A key pressed beside the existing character (not over it) leaves both in the box: keep the new one.
    if (previous !== '' && text.length === 2 && text.includes(previous)) {
      text = text.startsWith(previous) ? text.charAt(1) : text.charAt(0);
    }
    box.value = previous;
    if (text !== '') {
      this.write(index, text);
    }
  }

  protected pasted(index: number, clipboardEvent: ClipboardEvent): void {
    clipboardEvent.preventDefault();
    const text = this.clean(clipboardEvent.clipboardData?.getData('text') ?? '');
    if (text !== '') {
      // A whole code replaces what is there; a piece goes where the cursor is.
      this.write(text.length >= this.boxes().length ? 0 : index, text);
    }
  }

  protected keydown(index: number, keyboardEvent: KeyboardEvent): void {
    const last = this.boxes().length - 1;
    const moves: Readonly<Record<string, number>> = { ArrowLeft: Math.max(0, index - 1), ArrowRight: Math.min(last, index + 1), Home: 0, End: last };
    const move = moves[keyboardEvent.key];
    if (move !== undefined) {
      keyboardEvent.preventDefault();
      this.focus(move);
    } else if (keyboardEvent.key === 'Backspace' || keyboardEvent.key === 'Delete') {
      keyboardEvent.preventDefault();
      this.erase(index, keyboardEvent.key === 'Backspace');
    }
  }

  /** Delete removes this box's character; Backspace too, or the one before when this box is empty. */
  private erase(index: number, backwards: boolean): void {
    const code = this.value();
    const target = backwards && this.charAt(index) === '' ? index - 1 : index;
    if (target < 0) {
      return;
    }
    this.update(code.slice(0, target) + code.slice(target + 1));
    this.focus(target);
  }

  protected leave(focusEvent: FocusEvent): void {
    if (!(focusEvent.relatedTarget instanceof Node) || !this.host.nativeElement.contains(focusEvent.relatedTarget)) {
      this.onTouched();
    }
  }

  /** Puts `text` from box `index` on, over what was there, and moves to the box after it. */
  private write(index: number, text: string): void {
    const code = this.value();
    const start = Math.min(index, code.length);
    this.update(code.slice(0, start) + text + code.slice(start + text.length));
    this.focus(Math.min(start + text.length, this.boxes().length - 1));
    if (this.value().length === this.boxes().length && text.length > 0) {
      this.completed.emit(this.value());
    }
  }

  private update(code: string): void {
    const next = code.slice(0, this.boxes().length);
    if (next !== this.value()) {
      this.value.set(next);
      this.onChange(next);
    }
  }

  private focus(index: number): void {
    const box = this.inputs()[index]?.nativeElement;
    box?.focus();
    box?.select();
  }

  private clean(text: string): string {
    return this.alphanumeric() ? text.toUpperCase().replace(/[^0-9A-Z]/g, '') : text.replace(/\D/g, '');
  }
}
