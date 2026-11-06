import { NgComponentOutlet } from '@angular/common';
import {
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
import { PREVIEW_CONFIG, toPreviewTheme } from './preview-options';
import type { AnyScenarioEntry } from './scenario-entry';
import { type PreviewNotFound, type ResolvedScenario, isPreviewNotFound, resolveScenario } from './scenario-registry';

const RENDER_MARK_ATTRIBUTE = 'data-ligeirinho-preview';

type RenderState =
  | { readonly kind: 'found'; readonly scenario: ResolvedScenario }
  | { readonly kind: 'not-found'; readonly error: PreviewNotFound };

/**
 * Renders one scenario full-page, without previewer chrome, for the grid iframes and e2e checks.
 * Once rendered it sets `data-ligeirinho-preview="rendered|not-found"` on `<html>`; e2e-kit waits for it.
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
  private readonly parameters = toSignal(inject(ActivatedRoute).paramMap, { requireSync: true });
  private readonly queryParameters = toSignal(inject(ActivatedRoute).queryParamMap, { requireSync: true });
  private readonly outlet = viewChild(NgComponentOutlet);
  private subscribedInstance: unknown = null;

  protected readonly renderState = computed<RenderState>(() =>
    this.resolve(this.parameters().get('entryId') ?? '', this.parameters().get('scenarioName') ?? ''),
  );
  protected readonly theme = computed(() => toPreviewTheme(this.queryParameters().get('theme')));
  protected readonly foundComponent = computed(() => this.foundScenario()?.entry.component ?? null);
  protected readonly foundInputs = computed(() => ({ model: this.foundScenario()?.model }));
  protected readonly notFoundMessage = computed(() => {
    const state = this.renderState();
    return state.kind === 'not-found' ? state.error.message : '';
  });

  constructor() {
    effect(() => this.applyTheme());
    afterRenderEffect(() => this.logOutputsOf(this.outlet()?.componentInstance));
    afterRenderEffect(() => this.markRenderState(this.outlet()?.componentInstance));
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

  private markRenderState(instance: object | null | undefined): void {
    const renderMark = this.renderState().kind === 'found' ? 'rendered' : 'not-found';
    if (renderMark === 'rendered' && (instance === null || instance === undefined)) {
      return;
    }
    this.document.documentElement.setAttribute(RENDER_MARK_ATTRIBUTE, renderMark);
  }

  private clearDocumentMarks(): void {
    this.document.documentElement.classList.remove('dark');
    this.document.documentElement.removeAttribute(RENDER_MARK_ATTRIBUTE);
  }

  private logOutputsOf(instance: object | null | undefined): void {
    const entry = this.foundScenario()?.entry;
    if (instance === null || instance === undefined || entry === undefined) {
      return;
    }
    if (instance === this.subscribedInstance) {
      return;
    }
    this.subscribedInstance = instance;
    for (const output of outputsOf(entry)) {
      subscribeToOutput(instance, output, this.destroyRef);
    }
  }
}

interface OutputDescription {
  readonly propName: string;
  readonly templateName: string;
}

function outputsOf(entry: AnyScenarioEntry): readonly OutputDescription[] {
  return reflectComponentType(entry.component)?.outputs ?? [];
}

function subscribeToOutput(instance: object, output: OutputDescription, destroyRef: DestroyRef): void {
  const outputRef: unknown = Reflect.get(instance, output.propName);
  if (!isOutputRef(outputRef)) {
    return;
  }
  const subscription = outputRef.subscribe((emittedValue) => {
    console.log(`[preview] ${output.templateName}`, emittedValue);
  });
  destroyRef.onDestroy(() => subscription.unsubscribe());
}

function isOutputRef(candidate: unknown): candidate is OutputRef<unknown> {
  return (
    typeof candidate === 'object' &&
    candidate !== null &&
    'subscribe' in candidate &&
    typeof candidate.subscribe === 'function'
  );
}
