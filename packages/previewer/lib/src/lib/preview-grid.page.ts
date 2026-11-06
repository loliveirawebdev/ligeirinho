import { ChangeDetectionStrategy, Component, DOCUMENT, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DomSanitizer, type SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PREVIEW_CONFIG, type PreviewTheme } from './preview-options';
import { PreviewResizableFrame } from './preview-resizable-frame';
import {
  type PreviewEntrySummary,
  type PreviewManifest,
  buildRenderPath,
  listFlows,
  summarizeEntries,
} from './scenario-registry';

declare global {
  interface Window {
    __ligeirinhoPreview?: PreviewManifest;
  }
}

interface FrameView {
  readonly width: number;
  readonly theme: PreviewTheme;
  readonly source: SafeResourceUrl;
  readonly title: string;
}

interface ScenarioView {
  readonly name: string;
  readonly frames: readonly FrameView[];
  readonly resizableSource: SafeResourceUrl;
}

interface EntryView {
  readonly id: string;
  readonly title: string;
  readonly scenarios: readonly ScenarioView[];
}

interface FlowView {
  readonly flow: string;
  readonly entries: readonly EntryView[];
}

const MINIMUM_FRAME_HEIGHT = 200;

/** Every scenario of every entry, side by side at each width and theme, grouped by flow. */
@Component({
  selector: 'ligeirinho-preview-grid',
  imports: [RouterLink, PreviewResizableFrame],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './preview-grid.page.html',
  styleUrl: './preview-grid.page.css',
})
export class PreviewGridPage {
  private readonly config = inject(PREVIEW_CONFIG);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly basePath = currentBasePath(inject(DOCUMENT));
  private readonly queryParameters = toSignal(inject(ActivatedRoute).queryParamMap, { requireSync: true });

  protected readonly flows = listFlows(this.config.registry);
  protected readonly themes = this.config.themes;
  protected readonly selectedFlow = computed(() => this.queryParameters().get('flow'));
  protected readonly resizable = signal(false);
  protected readonly resizableTheme = signal<PreviewTheme>(this.config.themes[0] ?? 'light');
  protected readonly frameHeight = signal(640);
  protected readonly flowViews = computed(() => this.buildFlowViews(this.selectedFlow(), this.resizableTheme()));

  constructor() {
    publishManifest(inject(DOCUMENT), {
      entries: summarizeEntries(this.config.registry),
      basePath: this.basePath,
    });
  }

  protected setResizable(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.resizable.set(event.target.checked);
    }
  }

  protected setFrameHeight(event: Event): void {
    if (event.target instanceof HTMLInputElement && Number.isFinite(event.target.valueAsNumber)) {
      this.frameHeight.set(Math.max(MINIMUM_FRAME_HEIGHT, event.target.valueAsNumber));
    }
  }

  protected setResizableTheme(event: Event): void {
    if (event.target instanceof HTMLSelectElement) {
      this.resizableTheme.set(event.target.value === 'dark' ? 'dark' : 'light');
    }
  }

  private buildFlowViews(selectedFlow: string | null, resizableTheme: PreviewTheme): FlowView[] {
    const entries = summarizeEntries(this.config.registry);
    return this.flows
      .filter((flow) => selectedFlow === null || flow === selectedFlow)
      .map((flow) => ({
        flow,
        entries: entries
          .filter((entry) => entry.flow === flow)
          .map((entry) => this.buildEntryView(entry, resizableTheme)),
      }));
  }

  private buildEntryView(entry: PreviewEntrySummary, resizableTheme: PreviewTheme): EntryView {
    return {
      id: entry.id,
      title: entry.title,
      scenarios: entry.scenarios.map((name) => ({
        name,
        frames: this.buildFrames(entry, name),
        resizableSource: this.renderSource(entry.id, name, resizableTheme),
      })),
    };
  }

  private buildFrames(entry: PreviewEntrySummary, scenarioName: string): FrameView[] {
    return this.config.widths.flatMap((width) =>
      this.config.themes.map((theme) => ({
        width,
        theme,
        source: this.renderSource(entry.id, scenarioName, theme),
        title: `${entry.title}, ${scenarioName}, ${width} px, ${theme}`,
      })),
    );
  }

  private renderSource(entryId: string, scenarioName: string, theme: PreviewTheme): SafeResourceUrl {
    // Same-origin URL built from the registry, never from user input.
    return this.sanitizer.bypassSecurityTrustResourceUrl(buildRenderPath(this.basePath, entryId, scenarioName, theme));
  }
}

function currentBasePath(document: Document): string {
  return document.location.pathname.replace(/\/+$/, '');
}

function publishManifest(document: Document, manifest: PreviewManifest): void {
  const view = document.defaultView;
  if (view !== null) {
    view.__ligeirinhoPreview = manifest;
  }
}
