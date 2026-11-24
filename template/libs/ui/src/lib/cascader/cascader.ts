import { BreakpointObserver } from '@angular/cdk/layout';
import { OverlayModule } from '@angular/cdk/overlay';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  forwardRef,
  inject,
  Injector,
  input,
  model,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { map } from 'rxjs';
import { formatText } from '../copy/copy';
import { FormValueControl } from '../form-value-control';
import { DROPDOWN_POSITIONS, opensPanel } from '../dropdown-panel';

/** One level of the hierarchy: a branch (with `children`) or a leaf the user can pick. */
export interface CascaderOption {
  readonly value: string;
  readonly label: string;
  readonly children?: readonly CascaderOption[];
  readonly disabled?: boolean;
}

interface ActiveOption {
  readonly column: number;
  readonly index: number;
}

let nextCascader = 0;

/** The options along a path of values, as far as it matches the tree. */
function optionsAlong(options: readonly CascaderOption[], path: readonly string[]): CascaderOption[] {
  const found: CascaderOption[] = [];
  let level: readonly CascaderOption[] = options;
  for (const value of path) {
    const option = level.find((candidate) => candidate.value === value);
    if (!option) {
      break;
    }
    found.push(option);
    level = option.children ?? [];
  }
  return found;
}

function isBranch(option: CascaderOption): boolean {
  return (option.children?.length ?? 0) > 0;
}

function isText(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Picks one leaf of a hierarchy (country › state › city, category › subcategory). An outlined field shows the path
 * (*Brazil / São Paulo / Campinas*) and opens a panel of columns side by side, one per level: choosing a branch opens
 * the next column, choosing a leaf closes the panel and sets the value, the values along the path. On phones one
 * column at a time, with a row back to the level above. Keyboard: arrows within a column, Right or Enter opens a
 * branch, Left goes back, Esc closes. Works with `[(value)]`, reactive forms and signal forms.
 */
@Component({
  selector: 'ui-cascader',
  imports: [MatFormFieldModule, MatIconModule, MatInputModule, OverlayModule],
  templateUrl: './cascader.html',
  styleUrl: './cascader.css',
  // The panel opens in an overlay, outside this element; every selector starts with .ui-cascader.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Cascader), multi: true }],
  host: { class: 'block' },
})
export class Cascader extends FormValueControl<readonly string[]> {
  readonly options = input.required<readonly CascaderOption[]>();
  /** The field's label: *City*. */
  readonly label = input.required<string>();
  /** The row back to the level above on phones, read by screen readers: *Back to {label}*. */
  readonly backLabel = input.required<string>();
  /** The values from the top level down to the chosen leaf; empty is nothing chosen. */
  readonly value = model<readonly string[]>([]);
  /** Between the levels in the field. */
  readonly separator = input(' / ');

  protected readonly id = `ui-cascader-${String(nextCascader++)}`;
  protected readonly open = signal(false);
  /** The branches opened while browsing, top level first. */
  protected readonly trail = signal<readonly string[]>([]);
  protected readonly active = signal<ActiveOption>({ column: 0, index: 0 });
  protected readonly phone = toSignal(
    inject(BreakpointObserver)
      .observe('(max-width: 599.98px)')
      .pipe(map((state) => state.matches)),
    { initialValue: false },
  );
  protected readonly positions = DROPDOWN_POSITIONS;

  protected readonly text = computed(() =>
    optionsAlong(this.options(), this.value())
      .map((option) => option.label)
      .join(this.separator()),
  );
  /** The columns shown: the top level, then the children of each branch opened. */
  protected readonly columns = computed(() => {
    const opened = optionsAlong(this.options(), this.trail());
    return [this.options(), ...opened.map((option) => option.children ?? [])];
  });

  private readonly injector = inject(Injector);
  private readonly trigger = viewChild.required<ElementRef<HTMLInputElement>>('trigger');
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  override writeValue(value: unknown): void {
    this.value.set(Array.isArray(value) ? value.filter(isText) : []);
  }

  protected isBranch(option: CascaderOption): boolean {
    return isBranch(option);
  }

  /** A branch opened while browsing, or the chosen leaf. */
  protected isOnPath(column: number, option: CascaderOption): boolean {
    const value = this.value();
    const trail = this.trail();
    if (trail[column] === option.value) {
      return true;
    }
    return value.length === column + 1 && value[column] === option.value && value.slice(0, column).every((step, level) => step === trail[level]);
  }

  protected backText(column: number): string {
    const parent = optionsAlong(this.options(), this.trail())[column - 1];
    return parent?.label ?? '';
  }

  protected backAriaLabel(column: number): string {
    return formatText(this.backLabel(), { label: this.backText(column) });
  }

  protected toggle(): void {
    if (this.open()) {
      this.close();
    } else {
      this.openPanel();
    }
  }

  protected openPanel(): void {
    if (this.isDisabled() || this.open()) {
      return;
    }
    const chosen = optionsAlong(this.options(), this.value());
    const leaf = chosen.at(-1);
    this.trail.set(chosen.slice(0, -1).map((option) => option.value));
    const column = Math.max(chosen.length - 1, 0);
    const index = leaf ? Math.max(this.columns()[column]?.indexOf(leaf) ?? 0, 0) : this.firstEnabled(0);
    this.active.set({ column, index });
    this.open.set(true);
    this.focusActive();
  }

  protected onTriggerKeydown(event: KeyboardEvent): void {
    if (opensPanel(event)) {
      this.openPanel();
    }
  }

  protected close(returnFocus = false): void {
    if (!this.open()) {
      return;
    }
    this.open.set(false);
    this.trail.set([]);
    this.onTouched();
    if (returnFocus) {
      this.trigger().nativeElement.focus();
    }
  }

  protected pick(column: number, index: number): void {
    const option = this.columns()[column]?.[index];
    if (!option || option.disabled) {
      return;
    }
    this.active.set({ column, index });
    if (isBranch(option)) {
      this.openBranch(column, option);
      return;
    }
    const path = [...this.trail().slice(0, column), option.value];
    this.value.set(path);
    this.onChange(path);
    this.close(true);
  }

  protected goBack(column: number): void {
    const parent = this.trail()[column - 1];
    const index = this.columns()[column - 1]?.findIndex((option) => option.value === parent) ?? 0;
    this.trail.update((trail) => trail.slice(0, column - 1));
    this.active.set({ column: column - 1, index: Math.max(index, 0) });
    this.focusActive();
  }

  protected onPanelKeydown(event: KeyboardEvent): void {
    const handler = this.keyHandlers()[event.key === ' ' ? 'Space' : event.key];
    if (handler) {
      event.preventDefault();
      handler();
    } else if (event.key === 'Tab') {
      this.close();
    }
  }

  private keyHandlers(): Readonly<Record<string, () => void>> {
    const { column, index } = this.active();
    return {
      ArrowDown: () => {
        this.move(1);
      },
      ArrowUp: () => {
        this.move(-1);
      },
      Home: () => {
        this.moveTo(this.firstEnabled(column));
      },
      End: () => {
        this.moveTo(this.lastEnabled(column));
      },
      ArrowRight: () => {
        this.openActiveBranch();
      },
      Enter: () => {
        this.pick(column, index);
      },
      Space: () => {
        this.pick(column, index);
      },
      ArrowLeft: () => {
        if (column > 0) {
          this.goBack(column);
        }
      },
      Escape: () => {
        this.close(true);
      },
    };
  }

  private openActiveBranch(): void {
    const { column, index } = this.active();
    const option = this.columns()[column]?.[index];
    if (option && isBranch(option) && !option.disabled) {
      this.openBranch(column, option);
    }
  }

  private openBranch(column: number, option: CascaderOption): void {
    this.trail.update((trail) => [...trail.slice(0, column), option.value]);
    this.active.set({ column: column + 1, index: this.firstEnabled(column + 1) });
    this.focusActive();
  }

  private move(step: number): void {
    const { column, index } = this.active();
    const options = this.columns()[column] ?? [];
    let next = index + step;
    while (options[next]?.disabled) {
      next += step;
    }
    if (next >= 0 && next < options.length) {
      this.moveTo(next);
    }
  }

  private moveTo(index: number): void {
    this.active.update((active) => ({ ...active, index }));
    this.focusActive();
  }

  private firstEnabled(column: number): number {
    return Math.max(this.columns()[column]?.findIndex((option) => !option.disabled) ?? 0, 0);
  }

  private lastEnabled(column: number): number {
    const options = this.columns()[column] ?? [];
    return Math.max(options.findLastIndex((option) => !option.disabled), 0);
  }

  private focusActive(): void {
    afterNextRender(
      () => {
        const { column, index } = this.active();
        const option = this.panel()?.nativeElement.querySelector(`#${this.id}-${String(column)}-${String(index)}`);
        if (option instanceof HTMLElement) {
          option.focus();
        }
      },
      { injector: this.injector },
    );
  }
}
