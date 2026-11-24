import { OverlayModule, type ConnectedPosition } from '@angular/cdk/overlay';
import {
  afterNextRender,
  afterRenderEffect,
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
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatChipsModule } from '@angular/material/chips';
import { MatPseudoCheckboxModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTree, MatTreeModule } from '@angular/material/tree';
import { formatText } from '../copy/copy';

/** A node of the tree: a folder, a department. Any node can be chosen, branches too. */
export interface TreeSelectNode {
  readonly value: string;
  readonly label: string;
  readonly children?: readonly TreeSelectNode[];
  readonly disabled?: boolean;
}

/** The words around the tree, from the screen's copy. */
export interface TreeSelectLabels {
  /** The search box at the top of the panel: *Search departments*. */
  readonly search: string;
  /** When the search matches nothing: *No department matches*. */
  readonly noMatches: string;
  /** The field once more are chosen than fit as chips: *{count} selected*. */
  readonly count: string;
  /** A chip's remove button, read by screen readers: *Remove {label}*. */
  readonly remove: string;
}

let nextTreeSelect = 0;

function folded(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

/** The nodes matching `query`, with their ancestors; a matching node keeps its whole subtree. */
function filterTree(nodes: readonly TreeSelectNode[], query: string): readonly TreeSelectNode[] {
  return nodes.flatMap((node) => {
    if (folded(node.label).includes(query)) {
      return [node];
    }
    const children = filterTree(node.children ?? [], query);
    return children.length > 0 ? [{ ...node, children }] : [];
  });
}

/** Every node, depth first: the tree's reading order. */
function flatten(nodes: readonly TreeSelectNode[]): TreeSelectNode[] {
  return nodes.flatMap((node) => [node, ...flatten(node.children ?? [])]);
}

/** The values of the ancestors of every node in `values`. */
function ancestorsOf(nodes: readonly TreeSelectNode[], values: ReadonlySet<string>): string[] {
  return nodes.flatMap((node) => {
    const below = ancestorsOf(node.children ?? [], values);
    const holds = flatten(node.children ?? []).some((child) => values.has(child.value));
    return holds ? [node.value, ...below] : below;
  });
}

function isText(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Picks one node of a tree, or several with `multiple` (folders, departments, categories). An outlined field shows
 * what was chosen (the label; with `multiple`, a chip each up to `maxChips`, then *3 selected*) and opens a panel
 * with a search box and the tree: expand toggles, checkboxes with `multiple`. The search keeps the ancestors of every
 * match. Keyboard: the tree's arrows (Right expands, Left collapses), Enter or Space chooses, Esc closes. Works with
 * `[(value)]`, reactive forms and signal forms.
 */
@Component({
  selector: 'ui-tree-select',
  imports: [MatChipsModule, MatFormFieldModule, MatIconModule, MatInputModule, MatPseudoCheckboxModule, MatTreeModule, OverlayModule],
  templateUrl: './tree-select.html',
  styleUrl: './tree-select.css',
  // The panel opens in an overlay, outside this element; every selector starts with .ui-tree-select.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TreeSelect), multi: true }],
  host: { class: 'block' },
})
export class TreeSelect implements ControlValueAccessor {
  readonly options = input.required<readonly TreeSelectNode[]>();
  /** The field's label, and the tree's name for screen readers: *Departments*. */
  readonly label = input.required<string>();
  readonly labels = input.required<TreeSelectLabels>();
  /** The chosen nodes' values, in the tree's order. */
  readonly value = model<readonly string[]>([]);
  readonly multiple = input(false);
  /** With `multiple`, how many chips the field shows before it shows the count instead. */
  readonly maxChips = input(3);
  readonly disabled = input(false);

  protected readonly id = `ui-tree-select-${String(nextTreeSelect++)}`;
  protected readonly open = signal(false);
  protected readonly query = signal('');
  protected readonly positions: ConnectedPosition[] = [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 },
  ];
  protected readonly childrenOf = (node: TreeSelectNode): TreeSelectNode[] => [...(node.children ?? [])];
  protected readonly keyOf = (node: TreeSelectNode): string => node.value;

  private readonly formDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  protected readonly chosen = computed(() => new Set(this.value()));
  /** A fresh array each time: mat-tree takes a mutable one. */
  protected readonly nodes = computed((): TreeSelectNode[] => {
    const query = folded(this.query().trim());
    return [...(query ? filterTree(this.options(), query) : this.options())];
  });
  private readonly chosenNodes = computed(() => flatten(this.options()).filter((node) => this.chosen().has(node.value)));
  /** The branches holding a chosen node, so their checkbox shows a dash. */
  private readonly holdingChosen = computed(() => new Set(ancestorsOf(this.options(), this.chosen())));
  protected readonly chips = computed(() => {
    const chosen = this.chosenNodes();
    return this.multiple() && chosen.length <= this.maxChips() ? chosen : [];
  });
  /** What the field's text shows: the chosen label, or the count once the chips would not fit. */
  protected readonly summary = computed(() => {
    const chosen = this.chosenNodes();
    if (!this.multiple()) {
      return chosen[0]?.label ?? '';
    }
    return chosen.length > this.maxChips() ? formatText(this.labels().count, { count: chosen.length }) : '';
  });

  private readonly injector = inject(Injector);
  private readonly trigger = viewChild.required<ElementRef<HTMLInputElement>>('trigger');
  private readonly search = viewChild<ElementRef<HTMLInputElement>>('search');
  private readonly tree = viewChild<MatTree<TreeSelectNode, string>>(MatTree);
  private onChange: (value: readonly string[]) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor() {
    // While searching, every match shows: all branches left open.
    afterRenderEffect(() => {
      const tree = this.tree();
      if (tree && this.query().trim() && this.nodes().length > 0) {
        tree.expandAll();
      }
    });
  }

  writeValue(value: unknown): void {
    this.value.set(Array.isArray(value) ? value.filter(isText) : []);
  }

  registerOnChange(onChange: (value: readonly string[]) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouched = onTouched;
  }

  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled);
  }

  protected hasChildren(node: TreeSelectNode): boolean {
    return (node.children?.length ?? 0) > 0;
  }

  protected checkState(node: TreeSelectNode): 'checked' | 'indeterminate' | 'unchecked' {
    if (this.chosen().has(node.value)) {
      return 'checked';
    }
    return this.holdingChosen().has(node.value) ? 'indeterminate' : 'unchecked';
  }

  protected removeAriaLabel(label: string): string {
    return formatText(this.labels().remove, { label });
  }

  /** Anywhere on the field opens the panel, except a chip's remove button. */
  protected openFrom(event: MouseEvent): void {
    if (event.target instanceof Element && event.target.closest('[matChipRemove], .mat-mdc-chip-remove')) {
      return;
    }
    this.openPanel();
  }

  protected openPanel(): void {
    if (this.isDisabled() || this.open()) {
      return;
    }
    this.query.set('');
    this.open.set(true);
    afterNextRender(
      () => {
        for (const value of ancestorsOf(this.options(), this.chosen())) {
          const node = flatten(this.options()).find((candidate) => candidate.value === value);
          if (node) {
            this.tree()?.expand(node);
          }
        }
        this.search()?.nativeElement.focus();
      },
      { injector: this.injector },
    );
  }

  protected close(returnFocus = false): void {
    if (!this.open()) {
      return;
    }
    this.open.set(false);
    this.onTouched();
    if (returnFocus) {
      this.trigger().nativeElement.focus();
    }
  }

  protected onTriggerKeydown(event: KeyboardEvent): void {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
      event.preventDefault();
      this.openPanel();
    }
  }

  protected onOverlayKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close(true);
    }
  }

  protected updateQuery(inputEvent: Event): void {
    if (inputEvent.target instanceof HTMLInputElement) {
      this.query.set(inputEvent.target.value);
    }
  }

  /** Down from the search box goes into the tree. */
  protected onSearchKeydown(event: KeyboardEvent, panel: HTMLElement): void {
    const first = panel.querySelector('.ui-tree-select-node:not([aria-disabled="true"])');
    if (event.key === 'ArrowDown' && first instanceof HTMLElement) {
      event.preventDefault();
      first.focus();
    }
  }

  protected onNodeClick(event: MouseEvent, node: TreeSelectNode): void {
    // The toggle only expands; anywhere else on the row chooses.
    if (event.target instanceof Element && event.target.closest('.ui-tree-select-toggle')) {
      return;
    }
    this.choose(node);
  }

  protected onNodeKeydown(event: KeyboardEvent, node: TreeSelectNode): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.stopPropagation();
      this.choose(node);
    }
  }

  protected remove(value: string): void {
    this.commit(this.value().filter((chosen) => chosen !== value));
  }

  private choose(node: TreeSelectNode): void {
    if (node.disabled) {
      return;
    }
    if (!this.multiple()) {
      this.commit([node.value]);
      this.close(true);
      return;
    }
    const chosen = new Set(this.value());
    if (!chosen.delete(node.value)) {
      chosen.add(node.value);
    }
    this.commit(flatten(this.options()).map((candidate) => candidate.value).filter((value) => chosen.has(value)));
  }

  private commit(value: readonly string[]): void {
    this.value.set(value);
    this.onChange(value);
  }
}
