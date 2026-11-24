import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Gray shapes where content is about to appear in place, so nothing jumps when it arrives: rows of a list (with
 * `avatar`), a few lines of text, a card's body. Screen readers hear `label` once. A whole page or a list loading
 * from nothing is still `ui-loading-state`; this is for parts whose shape is known.
 */
@Component({
  selector: 'ui-skeleton',
  templateUrl: './skeleton.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block', role: 'status' },
})
export class Skeleton {
  /** What is loading, read once: *Loading members…*. */
  readonly label = input.required<string>();
  /** How many items (rows) of placeholders. */
  readonly rows = input(3);
  /** Lines in each item; the first is shorter and stronger, like a title. */
  readonly lines = input(2);
  /** A circle before each item, for people and records with an avatar or icon. */
  readonly avatar = input(false);

  protected readonly rowList = computed(() => Array.from({ length: this.rows() }, (_, index) => index));
  /** The widths the lines take, varied so the block reads as text and not as stripes. */
  protected readonly lineWidths = computed(() =>
    Array.from({ length: this.lines() }, (_, index) => (index === 0 ? '40%' : ['85%', '70%', '78%'][(index - 1) % 3])),
  );
}
