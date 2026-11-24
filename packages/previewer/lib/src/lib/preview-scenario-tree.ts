import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { Tree, TreeItem, TreeItemGroup } from '@angular/aria/tree';
import {
  type FlowNode,
  type ScenarioReference,
  groupKeys,
  pathKeys,
  scenarioKey,
} from './preview-workbench.state';
import type { PreviewEntrySummary } from './scenario-registry';

const STORAGE_KEY = 'ligeirinho-preview:expanded';

/**
 * The sidebar's scenario tree (flow → entry → scenario), built on Angular Aria's tree: arrow keys move, → opens,
 * ← closes, Enter or a click opens the scenario. Everything starts collapsed except the path to the selected
 * scenario; what the user opens is remembered in this browser. While searching, every match is open.
 */
@Component({
  selector: 'ligeirinho-preview-scenario-tree',
  imports: [Tree, TreeItem, TreeItemGroup],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './preview-scenario-tree.html',
  styleUrl: './preview-scenario-tree.css',
})
export class PreviewScenarioTree {
  /** Every entry, for the selection path and "expand all". */
  readonly entries = input.required<readonly PreviewEntrySummary[]>();
  /** The tree to show (already filtered by the search). */
  readonly flows = input.required<readonly FlowNode[]>();
  readonly selection = input.required<ScenarioReference | null>();
  readonly searching = input.required<boolean>();

  readonly chosen = output<ScenarioReference>();

  private readonly document = inject(DOCUMENT);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly expandedKeys = signal<ReadonlySet<string>>(readStoredKeys(this.document));

  protected readonly selectedValues = computed(() => {
    const selection = this.selection();
    return selection === null ? [] : [scenarioKey(selection)];
  });
  private readonly scenarioByKey = computed(() => {
    const scenarios = new Map<string, ScenarioReference>();
    for (const flow of this.flows()) {
      for (const entry of flow.entries) {
        for (const scenario of entry.scenarios) {
          scenarios.set(scenario.key, { entryId: scenario.entryId, scenarioName: scenario.scenarioName });
        }
      }
    }
    return scenarios;
  });

  constructor() {
    // Opening a scenario (a link, the switcher, the search) opens the groups around it.
    effect(() => {
      const keys = pathKeys(this.entries(), this.selection());
      untracked(() => this.expand(keys));
    });
    afterNextRender(() => {
      this.host.nativeElement.querySelector('[aria-current="page"]')?.scrollIntoView({ block: 'nearest' });
    });
  }

  protected isExpanded(key: string): boolean {
    return this.searching() || this.expandedKeys().has(key);
  }

  protected setExpanded(key: string, expanded: boolean): void {
    if (this.searching() || expanded === this.expandedKeys().has(key)) {
      return;
    }
    const keys = new Set(this.expandedKeys());
    if (expanded) {
      keys.add(key);
    } else {
      keys.delete(key);
    }
    this.store(keys);
  }

  protected choose(values: readonly string[]): void {
    const reference = this.scenarioByKey().get(values[0] ?? '');
    if (reference !== undefined) {
      this.chosen.emit(reference);
    }
  }

  expandAll(): void {
    this.store(new Set(groupKeys(this.entries())));
  }

  collapseAll(): void {
    this.store(new Set());
  }

  private expand(keys: readonly string[]): void {
    if (keys.every((key) => this.expandedKeys().has(key))) {
      return;
    }
    this.store(new Set([...this.expandedKeys(), ...keys]));
  }

  private store(keys: ReadonlySet<string>): void {
    this.expandedKeys.set(keys);
    try {
      this.document.defaultView?.localStorage.setItem(STORAGE_KEY, JSON.stringify([...keys]));
    } catch {
      // Storage can be blocked (private window); the tree still works for this visit.
    }
  }
}

function readStoredKeys(document: Document): ReadonlySet<string> {
  try {
    const stored: unknown = JSON.parse(document.defaultView?.localStorage.getItem(STORAGE_KEY) ?? '[]');
    return new Set(Array.isArray(stored) ? stored.filter((key): key is string => typeof key === 'string') : []);
  } catch {
    return new Set();
  }
}
