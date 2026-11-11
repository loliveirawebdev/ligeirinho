import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  type ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  linkedSignal,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { type FrameSize, PreviewCanvas } from './preview-canvas';
import { type PreviewStepStatus, isPreviewMessage } from './preview-messages';
import { PREVIEW_CONFIG, type PreviewViewport } from './preview-options';
import {
  type ScenarioReference,
  type WorkbenchState,
  type WorkbenchZoom,
  ZOOM_LEVELS,
  clampSize,
  filterEntries,
  flattenScenarios,
  matchingViewport,
  neighborScenario,
  readWorkbenchState,
  resolveSelection,
  toQueryParameters,
} from './preview-workbench.state';
import { type PreviewManifest, buildRenderPath, summarizeEntries } from './scenario-registry';

declare global {
  interface Window {
    __ligeirinhoPreview?: PreviewManifest;
  }
}

interface StepView {
  readonly index: number;
  readonly label: string;
  readonly status: PreviewStepStatus;
  readonly error: string | undefined;
}

interface EventView {
  readonly id: number;
  readonly name: string;
  readonly value: string;
}

interface FlowGroup {
  readonly flow: string;
  readonly entries: readonly EntryGroup[];
}

interface EntryGroup {
  readonly id: string;
  readonly title: string;
  readonly scenarios: readonly { readonly name: string; readonly hasPlay: boolean }[];
}

const MAXIMUM_EVENTS = 100;
const DEFAULT_VIEWPORT_LABEL = 'iPhone 15';

/**
 * The previewer: one scenario at a time in a resizable frame, like a browser's device mode. A sidebar lists every
 * entry and scenario, the toolbar sets device, size, zoom and theme, and the panel shows the scenario's play steps
 * and the outputs the view emits. All of it lives in the URL.
 */
@Component({
  selector: 'ligeirinho-preview-workbench',
  imports: [RouterLink, PreviewCanvas],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './preview-workbench.page.html',
  styleUrl: './preview-workbench.page.css',
  host: { '(window:message)': 'receive($event)' },
})
export class PreviewWorkbenchPage {
  private readonly config = inject(PREVIEW_CONFIG);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly document = inject(DOCUMENT);
  private readonly basePath = this.document.location.pathname.replace(/\/+$/, '');
  private readonly queryParameters = toSignal(this.route.queryParamMap, { requireSync: true });
  private readonly injector = inject(Injector);
  private readonly scenarioList = viewChild<ElementRef<HTMLElement>>('scenarioList');
  private nextEventId = 0;

  private readonly entries = summarizeEntries(this.config.registry);
  protected readonly viewports = this.config.viewports;
  protected readonly breakpoints = this.config.breakpoints;
  protected readonly zoomLevels = ZOOM_LEVELS;
  protected readonly canSwitchTheme = this.config.themes.includes('light') && this.config.themes.includes('dark');
  protected readonly hasScenarios = this.entries.length > 0;

  protected readonly state = computed<WorkbenchState>(() =>
    readWorkbenchState(this.queryParameters(), defaultViewport(this.config.viewports)),
  );
  /** Follows the URL, and the handles while dragging (the URL is only written when the drag ends). */
  protected readonly frameSize = linkedSignal<FrameSize>(() => ({
    width: this.state().width,
    height: this.state().height,
  }));
  protected readonly selection = computed(() =>
    resolveSelection(this.entries, this.state().entryId, this.state().scenarioName),
  );
  protected readonly search = signal('');
  protected readonly sidebarOpen = signal(true);
  protected readonly panelOpen = signal(true);
  protected readonly replayCount = signal(0);
  protected readonly steps = signal<readonly StepView[]>([]);
  protected readonly events = signal<readonly EventView[]>([]);

  protected readonly flowGroups = computed(() => this.groupByFlow(filterEntries(this.entries, this.search())));
  private readonly visibleScenarios = computed(() => flattenScenarios(filterEntries(this.entries, this.search())));
  protected readonly selectedEntry = computed(() => this.entries.find((entry) => entry.id === this.selection()?.entryId));
  protected readonly selectedHasPlay = computed(() => {
    const selection = this.selection();
    return selection !== null && this.hasPlay(selection.entryId, selection.scenarioName);
  });
  protected readonly presetIndex = computed(() => {
    const preset = matchingViewport(this.viewports, this.frameSize().width, this.frameSize().height);
    return preset === undefined ? -1 : this.viewports.indexOf(preset);
  });
  protected readonly renderPath = computed(() => {
    const selection = this.selection();
    if (selection === null) {
      return '';
    }
    const { theme, play } = this.state();
    return buildRenderPath(this.basePath, selection.entryId, selection.scenarioName, theme, { play });
  });
  protected readonly frameSource = computed(() =>
    // Same-origin URL built from the registry, never from user input; `run` reloads it on replay.
    this.sanitizer.bypassSecurityTrustResourceUrl(`${this.renderPath()}&run=${this.replayCount()}`),
  );
  protected readonly frameTitle = computed(() => {
    const selection = this.selection();
    return selection === null ? 'Preview' : `${this.selectedEntry()?.title ?? selection.entryId}, ${selection.scenarioName}`;
  });

  constructor() {
    publishManifest(this.document, { entries: this.entries, basePath: this.basePath });
    afterNextRender(() => {
      this.document.title = 'Preview';
    });
  }

  protected receive(event: MessageEvent): void {
    if (event.origin !== this.document.location.origin || !isPreviewMessage(event.data)) {
      return;
    }
    const message = event.data;
    if (message.kind === 'reset') {
      this.steps.set([]);
      this.events.set([]);
    } else if (message.kind === 'step') {
      const step: StepView = { index: message.index, label: message.label, status: message.status, error: message.error };
      this.steps.update((steps) => [...steps.filter((existing) => existing.index !== step.index), step]);
    } else {
      const eventView: EventView = { id: this.nextEventId++, name: message.name, value: message.value };
      this.events.update((events) => [...events, eventView].slice(-MAXIMUM_EVENTS));
    }
  }

  protected isSelected(entryId: string, scenarioName: string): boolean {
    const selection = this.selection();
    return selection?.entryId === entryId && selection.scenarioName === scenarioName;
  }

  protected onSearch(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.search.set(event.target.value);
    }
  }

  protected moveSelection(event: Event, offset: number): void {
    event.preventDefault();
    const next = neighborScenario(this.visibleScenarios(), this.selection(), offset);
    if (next === null) {
      return;
    }
    this.select(next);
    afterNextRender(
      () => {
        this.scenarioList()?.nativeElement.querySelector<HTMLElement>('[aria-current="page"]')?.focus();
      },
      { injector: this.injector },
    );
  }

  protected choosePreset(event: Event): void {
    if (!(event.target instanceof HTMLSelectElement)) {
      return;
    }
    const preset = this.viewports[Number(event.target.value)];
    if (preset !== undefined) {
      this.commitSize({ width: preset.width, height: preset.height });
    }
  }

  protected typeSize(event: Event, axis: 'width' | 'height'): void {
    if (!(event.target instanceof HTMLInputElement) || !Number.isFinite(event.target.valueAsNumber)) {
      return;
    }
    const size = clampSize(event.target.valueAsNumber);
    this.commitSize({ ...this.frameSize(), [axis]: size });
  }

  protected rotate(): void {
    const { width, height } = this.frameSize();
    this.commitSize({ width: height, height: width });
  }

  protected chooseZoom(event: Event): void {
    if (event.target instanceof HTMLSelectElement) {
      const zoom: WorkbenchZoom = event.target.value === 'fit' ? 'fit' : Number(event.target.value);
      this.navigate({ zoom });
    }
  }

  protected toggleTheme(): void {
    this.navigate({ theme: this.state().theme === 'dark' ? 'light' : 'dark' });
  }

  protected setPlay(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.navigate({ play: event.target.checked });
    }
  }

  protected replay(): void {
    this.replayCount.update((count) => count + 1);
  }

  protected previewSize(size: FrameSize): void {
    this.frameSize.set(size);
  }

  protected commitSize(size: FrameSize): void {
    this.frameSize.set(size);
    this.navigate({ width: size.width, height: size.height });
  }

  protected scenarioQuery(entryId: string, scenarioName: string): Record<string, string> {
    return toQueryParameters({ ...this.state(), ...this.frameSize(), entryId, scenarioName });
  }

  protected zoomValue(zoom: WorkbenchZoom): string {
    return String(zoom);
  }

  private select(reference: ScenarioReference): void {
    this.navigate({ entryId: reference.entryId, scenarioName: reference.scenarioName });
  }

  private navigate(change: Partial<WorkbenchState>): void {
    const selection = this.selection();
    const next: WorkbenchState = {
      ...this.state(),
      entryId: selection?.entryId ?? null,
      scenarioName: selection?.scenarioName ?? null,
      ...this.frameSize(),
      ...change,
    };
    void this.router.navigate([], { relativeTo: this.route, queryParams: toQueryParameters(next), replaceUrl: true });
  }

  private hasPlay(entryId: string, scenarioName: string): boolean {
    const entry = this.config.registry.find((candidate) => candidate.id === entryId);
    return entry?.play?.[scenarioName] !== undefined;
  }

  private groupByFlow(entries: ReturnType<typeof filterEntries>): FlowGroup[] {
    const flows = [...new Set(entries.map((entry) => entry.flow))];
    return flows.map((flow) => ({
      flow,
      entries: entries
        .filter((entry) => entry.flow === flow)
        .map((entry) => ({
          id: entry.id,
          title: entry.title,
          scenarios: entry.scenarios.map((name) => ({ name, hasPlay: this.hasPlay(entry.id, name) })),
        })),
    }));
  }
}

function defaultViewport(viewports: readonly PreviewViewport[]): PreviewViewport | undefined {
  return viewports.find((viewport) => viewport.label === DEFAULT_VIEWPORT_LABEL) ?? viewports[0];
}

function publishManifest(document: Document, manifest: PreviewManifest): void {
  const view = document.defaultView;
  if (view !== null) {
    view.__ligeirinhoPreview = manifest;
  }
}
