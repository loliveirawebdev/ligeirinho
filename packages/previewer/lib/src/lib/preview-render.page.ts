import { NgComponentOutlet } from '@angular/common';
import {
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  type OutputRef,
  afterRenderEffect,
  computed,
  effect,
  inject,
  reflectComponentType,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { PREVIEW_MESSAGE_SOURCE, type PreviewMessage, describeValue } from './preview-messages';
import { PREVIEW_CONFIG, toPreviewTheme } from './preview-options';
import type { AnyScenarioEntry, PlayContext, PlayFunction } from './scenario-entry';
import { type PreviewNotFound, type ResolvedScenario, isPreviewNotFound, resolveScenario } from './scenario-registry';

const RENDER_MARK_ATTRIBUTE = 'data-ligeirinho-preview';
const RENDER_ERROR_ATTRIBUTE = 'data-ligeirinho-preview-error';

type RenderState =
  | { readonly kind: 'found'; readonly scenario: ResolvedScenario }
  | { readonly kind: 'not-found'; readonly error: PreviewNotFound };

/** `rendered` once the view is on screen and its `play` (if any) finished; e2e-kit waits for one of these. */
type RenderMark = 'rendered' | 'not-found' | 'play-failed';

/**
 * Renders one scenario full-page, without previewer chrome, for the workbench's iframe and for e2e checks.
 * Runs the scenario's `play` function (unless `?play=0`), then sets `data-ligeirinho-preview` on `<html>`.
 */
@Component({
  selector: 'ligeirinho-preview-render',
  imports: [NgComponentOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (renderState().kind) {
      @case ('found') {
        <ng-container *ngComponentOutlet="foundComponent(); inputs: foundInputs()" />
      }
      @case ('not-found') {
        <main style="font-family: system-ui, sans-serif; padding: 1rem">
          <h1>Preview not found</h1>
          <p role="alert">{{ notFoundMessage() }}</p>
        </main>
      }
    }
  `,
})
export class PreviewRenderPage {
  private readonly config = inject(PREVIEW_CONFIG);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly applicationRef = inject(ApplicationRef);
  private readonly parameters = toSignal(inject(ActivatedRoute).paramMap, { requireSync: true });
  private readonly queryParameters = toSignal(inject(ActivatedRoute).queryParamMap, { requireSync: true });
  private readonly outlet = viewChild(NgComponentOutlet);
  private settledInstance: unknown = null;

  protected readonly renderState = computed<RenderState>(() =>
    this.resolve(this.parameters().get('entryId') ?? '', this.parameters().get('scenarioName') ?? ''),
  );
  protected readonly theme = computed(() => toPreviewTheme(this.queryParameters().get('theme')));
  private readonly runsPlay = computed(() => this.queryParameters().get('play') !== '0');
  protected readonly foundComponent = computed(() => this.foundScenario()?.entry.component ?? null);
  protected readonly foundInputs = computed(() => ({ model: this.foundScenario()?.model }));
  protected readonly notFoundMessage = computed(() => {
    const state = this.renderState();
    return state.kind === 'not-found' ? state.error.message : '';
  });

  constructor() {
    effect(() => this.applyTheme());
    afterRenderEffect(() => {
      this.settle(this.outlet()?.componentInstance);
    });
    this.destroyRef.onDestroy(() => this.clearDocumentMarks());
  }

  private foundScenario(): ResolvedScenario | null {
    const state = this.renderState();
    return state.kind === 'found' ? state.scenario : null;
  }

  private resolve(entryId: string, scenarioName: string): RenderState {
    try {
      return { kind: 'found', scenario: resolveScenario(this.config.registry, entryId, scenarioName) };
    } catch (error: unknown) {
      if (isPreviewNotFound(error)) {
        return { kind: 'not-found', error };
      }
      throw error;
    }
  }

  private applyTheme(): void {
    this.document.documentElement.classList.toggle('dark', this.theme() === 'dark');
  }

  /** Once per rendered view: listen to its outputs, run its play, then mark the document. */
  private settle(instance: object | null | undefined): void {
    const scenario = this.foundScenario();
    if (scenario === null) {
      this.mark('not-found');
      return;
    }
    if (instance === null || instance === undefined || instance === this.settledInstance) {
      return;
    }
    this.settledInstance = instance;
    this.post({ source: PREVIEW_MESSAGE_SOURCE, kind: 'reset' });
    this.listenToOutputs(instance, scenario.entry);
    const play = this.runsPlay() ? scenario.play : undefined;
    void this.runPlay(play);
  }

  private async runPlay(play: PlayFunction | undefined): Promise<void> {
    if (play === undefined) {
      this.mark('rendered');
      return;
    }
    await this.applicationRef.whenStable();
    try {
      await play(this.playContext());
      await this.applicationRef.whenStable();
      this.mark('rendered');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.document.documentElement.setAttribute(RENDER_ERROR_ATTRIBUTE, message);
      this.mark('play-failed');
    }
  }

  private playContext(): PlayContext {
    let stepCount = 0;
    return {
      canvas: this.document.body,
      step: async (label, action) => {
        const index = stepCount;
        stepCount += 1;
        this.post({ source: PREVIEW_MESSAGE_SOURCE, kind: 'step', index, label, status: 'running' });
        try {
          const result = await action();
          this.post({ source: PREVIEW_MESSAGE_SOURCE, kind: 'step', index, label, status: 'done' });
          return result;
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          this.post({ source: PREVIEW_MESSAGE_SOURCE, kind: 'step', index, label, status: 'failed', error: message });
          throw new Error(`step "${label}" failed: ${message}`, { cause: error });
        }
      },
    };
  }

  private mark(renderMark: RenderMark): void {
    this.document.documentElement.setAttribute(RENDER_MARK_ATTRIBUTE, renderMark);
  }

  private clearDocumentMarks(): void {
    const root = this.document.documentElement;
    root.classList.remove('dark');
    root.removeAttribute(RENDER_MARK_ATTRIBUTE);
    root.removeAttribute(RENDER_ERROR_ATTRIBUTE);
  }

  private listenToOutputs(instance: object, entry: AnyScenarioEntry): void {
    for (const output of outputsOf(entry)) {
      const outputRef: unknown = Reflect.get(instance, output.propName);
      if (!isOutputRef(outputRef)) {
        continue;
      }
      const subscription = outputRef.subscribe((emittedValue) => {
        console.log(`[preview] ${output.templateName}`, emittedValue);
        this.post({
          source: PREVIEW_MESSAGE_SOURCE,
          kind: 'output',
          name: output.templateName,
          value: describeValue(emittedValue),
        });
      });
      this.destroyRef.onDestroy(() => subscription.unsubscribe());
    }
  }

  /** Tells the workbench, when this page is inside its iframe. */
  private post(message: PreviewMessage): void {
    const view = this.document.defaultView;
    if (view === null || view.parent === view) {
      return;
    }
    view.parent.postMessage(message, view.location.origin);
  }
}

interface OutputDescription {
  readonly propName: string;
  readonly templateName: string;
}

function outputsOf(entry: AnyScenarioEntry): readonly OutputDescription[] {
  return reflectComponentType(entry.component)?.outputs ?? [];
}

function isOutputRef(candidate: unknown): candidate is OutputRef<unknown> {
  return (
    typeof candidate === 'object' &&
    candidate !== null &&
    'subscribe' in candidate &&
    typeof candidate.subscribe === 'function'
  );
}
