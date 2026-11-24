import { ChangeDetectionStrategy, Component, ViewEncapsulation, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

/**
 * A text field and the one action it feeds, attached as one block (add a task, invite by email, subscribe). Keeps
 * the draft itself, emits the trimmed text on submit (never an empty one) and clears. While `busy`, the button is
 * disabled and shows `busyActionLabel` (*Adding…*).
 */
@Component({
  selector: 'ui-input-group',
  imports: [MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule],
  templateUrl: './input-group.html',
  styleUrl: './input-group.css',
  // The attached look reaches into the form field's outline, which only the design system may do.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class InputGroup {
  readonly label = input.required<string>();
  readonly placeholder = input('');
  readonly actionLabel = input.required<string>();
  readonly busyActionLabel = input('');
  readonly icon = input('');
  readonly busy = input(false);
  readonly maxLength = input<number>();
  readonly name = input('text');

  readonly submitted = output<string>();

  protected readonly draft = signal('');

  protected updateDraft(inputEvent: Event): void {
    if (inputEvent.target instanceof HTMLInputElement) {
      this.draft.set(inputEvent.target.value);
    }
  }

  protected submit(submitEvent: SubmitEvent): void {
    submitEvent.preventDefault();
    const text = this.draft().trim();
    if (text === '' || this.busy()) {
      return;
    }
    this.submitted.emit(text);
    this.draft.set('');
  }
}
