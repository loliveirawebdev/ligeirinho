import type { AnyScenarioEntry, PlayFunction, ScenarioRegistry } from './scenario-entry';

export class PreviewEntryNotFound extends Error {
  override readonly name = 'PreviewEntryNotFound';

  constructor(readonly entryId: string) {
    super(`No preview entry with id "${entryId}".`);
  }
}

export class PreviewScenarioNotFound extends Error {
  override readonly name = 'PreviewScenarioNotFound';

  constructor(
    readonly entryId: string,
    readonly scenarioName: string,
    readonly availableScenarios: readonly string[],
  ) {
    super(
      `Entry "${entryId}" has no scenario "${scenarioName}". Available: ${availableScenarios.join(', ') || 'none'}.`,
    );
  }
}

export class DuplicatePreviewEntryId extends Error {
  override readonly name = 'DuplicatePreviewEntryId';

  constructor(readonly entryId: string) {
    super(`Two preview entries share the id "${entryId}". Give them different titles.`);
  }
}

export type PreviewNotFound = PreviewEntryNotFound | PreviewScenarioNotFound;

export interface ResolvedScenario {
  readonly entry: AnyScenarioEntry;
  readonly scenarioName: string;
  readonly model: unknown;
  readonly play: PlayFunction | undefined;
}

/** The serializable description the workbench page publishes on `window.__ligeirinhoPreview`. */
export interface PreviewEntrySummary {
  readonly id: string;
  readonly flow: string;
  readonly title: string;
  readonly scenarios: readonly string[];
}

export interface PreviewManifest {
  readonly entries: readonly PreviewEntrySummary[];
  readonly basePath: string;
}

export function assertUniqueEntryIds(registry: ScenarioRegistry): void {
  const seenIds = new Set<string>();
  for (const entry of registry) {
    if (seenIds.has(entry.id)) {
      throw new DuplicatePreviewEntryId(entry.id);
    }
    seenIds.add(entry.id);
  }
}

/** @throws PreviewEntryNotFound | PreviewScenarioNotFound */
export function resolveScenario(
  registry: ScenarioRegistry,
  entryId: string,
  scenarioName: string,
): ResolvedScenario {
  const entry = registry.find((candidate) => candidate.id === entryId);
  if (entry === undefined) {
    throw new PreviewEntryNotFound(entryId);
  }
  if (!Object.hasOwn(entry.scenarios, scenarioName)) {
    throw new PreviewScenarioNotFound(entryId, scenarioName, Object.keys(entry.scenarios));
  }
  return { entry, scenarioName, model: entry.scenarios[scenarioName], play: entry.play?.[scenarioName] };
}

export function isPreviewNotFound(error: unknown): error is PreviewNotFound {
  return error instanceof PreviewEntryNotFound || error instanceof PreviewScenarioNotFound;
}

export function summarizeEntries(registry: ScenarioRegistry): PreviewEntrySummary[] {
  return registry.map((entry) => ({
    id: entry.id,
    flow: entry.flow,
    title: entry.title,
    scenarios: Object.keys(entry.scenarios),
  }));
}

export function listFlows(registry: ScenarioRegistry): string[] {
  return [...new Set(registry.map((entry) => entry.flow))];
}

export interface RenderPathOptions {
  /** false renders the scenario without running its `play` function. Default true. */
  readonly play?: boolean;
}

export function buildRenderPath(
  basePath: string,
  entryId: string,
  scenarioName: string,
  theme: string,
  options: RenderPathOptions = {},
): string {
  const encodedPath = [entryId, scenarioName].map(encodeURIComponent).join('/');
  const playParameter = options.play === false ? '&play=0' : '';
  return `${basePath}/render/${encodedPath}?theme=${encodeURIComponent(theme)}${playParameter}`;
}
