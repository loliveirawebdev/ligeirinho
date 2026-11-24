import { ChangeDetectionStrategy, Component, ElementRef, inject, input, linkedSignal, output, ViewEncapsulation } from '@angular/core';

/** How far one arrow key moves the divider, in percent of the splitter. */
const STEP = 5;

/**
 * Two panes the user sizes by dragging the line between them (a list and its detail, an editor and its preview): the
 * start pane (`uiSplitterStart`) and the end pane (`uiSplitterEnd`). The divider is a focusable separator: arrow keys
 * move it, Home and End take it to its limits. Side by side (`row`) stacks on phones, where there is no room to size.
 */
@Component({
  selector: 'ui-splitter',
  templateUrl: './splitter.html',
  styleUrl: './splitter.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui-splitter', '[attr.data-direction]': 'direction()' },
})
export class Splitter {
  /** What the divider does, for screen readers: *Resize the list*. */
  readonly handleLabel = input.required<string>();
  readonly direction = input<'row' | 'column'>('row');
  /** The start pane's share, in percent. */
  readonly size = input(50);
  readonly min = input(20);
  readonly max = input(80);

  /** Where the user left the divider: keep it (per user, per screen) and pass it back in `size`. */
  readonly sizeChange = output<number>();

  protected readonly current = linkedSignal(() => this.size());
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected startDrag(event: PointerEvent): void {
    const handle = event.currentTarget;
    if (!(handle instanceof HTMLElement)) {
      return;
    }
    event.preventDefault();
    handle.setPointerCapture(event.pointerId);
    const move = (moveEvent: PointerEvent): void => {
      const box = this.host.nativeElement.getBoundingClientRect();
      const share =
        this.direction() === 'row'
          ? ((moveEvent.clientX - box.left) / box.width) * 100
          : ((moveEvent.clientY - box.top) / box.height) * 100;
      this.current.set(this.clamp(share));
    };
    const end = (): void => {
      handle.removeEventListener('pointermove', move);
      handle.removeEventListener('pointerup', end);
      handle.removeEventListener('pointercancel', end);
      this.sizeChange.emit(this.current());
    };
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
  }

  protected moveByKey(event: KeyboardEvent): void {
    const forward = this.direction() === 'row' ? 'ArrowRight' : 'ArrowDown';
    const back = this.direction() === 'row' ? 'ArrowLeft' : 'ArrowUp';
    const next =
      event.key === forward
        ? this.current() + STEP
        : event.key === back
          ? this.current() - STEP
          : event.key === 'Home'
            ? this.min()
            : event.key === 'End'
              ? this.max()
              : undefined;
    if (next === undefined) {
      return;
    }
    event.preventDefault();
    this.current.set(this.clamp(next));
    this.sizeChange.emit(this.current());
  }

  private clamp(share: number): number {
    return Math.round(Math.min(this.max(), Math.max(this.min(), share)));
  }
}
