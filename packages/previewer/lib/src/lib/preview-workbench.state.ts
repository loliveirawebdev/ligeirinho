import type { PreviewTheme, PreviewViewport } from './preview-options';
import type { PreviewEntrySummary } from './scenario-registry';

/** Everything the workbench shows, kept in the URL so a reload or a shared link opens the same view. */
export interface WorkbenchState {
  readonly entryId: string | null;
  readonly scenarioName: string | null;
  readonly width: number;
  readonly height: number;
  readonly theme: PreviewTheme;
  /** `fit` scales the frame down to the canvas; a number is a fixed scale (1 = 100 %). */
  readonly zoom: WorkbenchZoom;
  readonly play: boolean;
}

export type WorkbenchZoom = 'fit' | number;

export interface ScenarioReference {
  readonly entryId: string;
  readonly scenarioName: string;
}

export interface RulerTick {
  /** Distance from the frame's origin on screen, in px (already scaled by the zoom). */
  readonly offset: number;
  readonly value: number;
  readonly labeled: boolean;
}

export const MINIMUM_FRAME_SIZE = 240;
export const MAXIMUM_FRAME_SIZE = 3840;
export const ZOOM_LEVELS: readonly number[] = [0.25, 0.5, 0.75, 1, 1.25, 1.5];
const DEFAULT_VIEWPORT: PreviewViewport = { label: 'iPhone 15', width: 390, height: 844 };

/** Reads the workbench state from the query string; anything missing or invalid falls back to a default. */
export function readWorkbenchState(
  query: { get(name: string): string | null },
  defaultViewport: PreviewViewport | undefined,
): WorkbenchState {
  const viewport = defaultViewport ?? DEFAULT_VIEWPORT;
  return {
    entryId: query.get('entry'),
    scenarioName: query.get('scenario'),
    width: readSize(query.get('w'), viewport.width),
    height: readSize(query.get('h'), viewport.height),
    theme: query.get('theme') === 'dark' ? 'dark' : 'light',
    zoom: readZoom(query.get('zoom')),
    play: query.get('play') !== '0',
  };
}

/** The query parameters of a state, ready for `router.navigate`. */
export function toQueryParameters(state: WorkbenchState): Record<string, string> {
  return {
    entry: state.entryId ?? '',
    scenario: state.scenarioName ?? '',
    w: String(state.width),
    h: String(state.height),
    theme: state.theme,
    zoom: String(state.zoom),
    play: state.play ? '1' : '0',
  };
}

export function clampSize(size: number): number {
  if (!Number.isFinite(size)) {
    return MINIMUM_FRAME_SIZE;
  }
  return Math.min(MAXIMUM_FRAME_SIZE, Math.max(MINIMUM_FRAME_SIZE, Math.round(size)));
}

/** The scale the frame is drawn at: `fit` shrinks it to the available space but never enlarges it. */
export function resolveScale(
  zoom: WorkbenchZoom,
  frame: { readonly width: number; readonly height: number },
  available: { readonly width: number; readonly height: number },
): number {
  if (zoom !== 'fit') {
    return zoom;
  }
  if (available.width <= 0 || available.height <= 0) {
    return 1;
  }
  return Math.min(1, available.width / frame.width, available.height / frame.height);
}

/** Ruler marks from 0 up to `length` CSS px; denser at high zoom, sparser when zoomed out. */
export function rulerTicks(length: number, scale: number): RulerTick[] {
  const step = scale >= 0.75 ? 50 : scale >= 0.4 ? 100 : 200;
  const ticks: RulerTick[] = [];
  for (let value = 0; value <= length; value += step) {
    ticks.push({ offset: value * scale, value, labeled: value % (step * 2) === 0 });
  }
  return ticks;
}

/** The entries whose title or scenario names contain the search text, keeping only the matching scenarios. */
export function filterEntries(entries: readonly PreviewEntrySummary[], search: string): PreviewEntrySummary[] {
  const needle = search.trim().toLowerCase();
  if (needle === '') {
    return [...entries];
  }
  return entries.flatMap((entry) => {
    if (entry.title.toLowerCase().includes(needle) || entry.flow.toLowerCase().includes(needle)) {
      return [entry];
    }
    const scenarios = entry.scenarios.filter((scenarioName) => scenarioName.toLowerCase().includes(needle));
    return scenarios.length > 0 ? [{ ...entry, scenarios }] : [];
  });
}

/** Every scenario in display order, for arrow-key navigation. */
export function flattenScenarios(entries: readonly PreviewEntrySummary[]): ScenarioReference[] {
  return entries.flatMap((entry) => entry.scenarios.map((scenarioName) => ({ entryId: entry.id, scenarioName })));
}

/** The selected scenario if it exists, otherwise the first one. */
export function resolveSelection(
  entries: readonly PreviewEntrySummary[],
  entryId: string | null,
  scenarioName: string | null,
): ScenarioReference | null {
  const entry = entries.find((candidate) => candidate.id === entryId);
  if (entry !== undefined && scenarioName !== null && entry.scenarios.includes(scenarioName)) {
    return { entryId: entry.id, scenarioName };
  }
  return flattenScenarios(entries)[0] ?? null;
}

/** The preset matching the frame size, if any (rotated presets match too). */
export function matchingViewport(
  viewports: readonly PreviewViewport[],
  width: number,
  height: number,
): PreviewViewport | undefined {
  return viewports.find(
    (viewport) =>
      (viewport.width === width && viewport.height === height) ||
      (viewport.width === height && viewport.height === width),
  );
}

function readSize(parameter: string | null, fallback: number): number {
  const size = Number(parameter);
  return parameter === null || parameter === '' || !Number.isFinite(size) ? fallback : clampSize(size);
}

function readZoom(parameter: string | null): WorkbenchZoom {
  const zoom = Number(parameter);
  return ZOOM_LEVELS.includes(zoom) ? zoom : 'fit';
}

/** A piece of a label, marked when it matches the search. */
export interface LabelPart {
  readonly text: string;
  readonly match: boolean;
}

export interface FlowNode {
  readonly key: string;
  readonly flow: string;
  readonly label: readonly LabelPart[];
  readonly entries: readonly EntryNode[];
}

export interface EntryNode {
  readonly key: string;
  readonly id: string;
  readonly title: string;
  readonly label: readonly LabelPart[];
  readonly scenarios: readonly ScenarioNode[];
}

export interface ScenarioNode {
  readonly key: string;
  readonly entryId: string;
  readonly scenarioName: string;
  readonly label: readonly LabelPart[];
  readonly hasPlay: boolean;
}

export interface ScenarioMatch extends ScenarioReference {
  readonly key: string;
  readonly flow: string;
  readonly entryTitle: string;
}

export function flowKey(flow: string): string {
  return `flow:${flow}`;
}

export function entryKey(entryId: string): string {
  return `entry:${entryId}`;
}

export function scenarioKey(reference: ScenarioReference): string {
  return `scenario:${reference.entryId}:${reference.scenarioName}`;
}

/** Splits `text` around every case-insensitive occurrence of `search`. */
export function highlight(text: string, search: string): LabelPart[] {
  const needle = search.trim().toLowerCase();
  if (needle === '') {
    return [{ text, match: false }];
  }
  const parts: LabelPart[] = [];
  const haystack = text.toLowerCase();
  let start = 0;
  for (let found = haystack.indexOf(needle); found !== -1; found = haystack.indexOf(needle, start)) {
    if (found > start) {
      parts.push({ text: text.slice(start, found), match: false });
    }
    parts.push({ text: text.slice(found, found + needle.length), match: true });
    start = found + needle.length;
  }
  if (start < text.length) {
    parts.push({ text: text.slice(start), match: false });
  }
  return parts;
}

/** The sidebar tree, flow → entry → scenario, of the entries that match the search. */
export function buildScenarioTree(
  entries: readonly PreviewEntrySummary[],
  search: string,
  hasPlay: (reference: ScenarioReference) => boolean,
): FlowNode[] {
  const visible = filterEntries(entries, search);
  const flows = [...new Set(visible.map((entry) => entry.flow))];
  return flows.map((flow) => ({
    key: flowKey(flow),
    flow,
    label: highlight(flow, search),
    entries: visible
      .filter((entry) => entry.flow === flow)
      .map((entry) => ({
        key: entryKey(entry.id),
        id: entry.id,
        title: entry.title,
        label: highlight(entry.title, search),
        scenarios: entry.scenarios.map((scenarioName) => {
          const reference = { entryId: entry.id, scenarioName };
          return {
            key: scenarioKey(reference),
            ...reference,
            label: highlight(scenarioName, search),
            hasPlay: hasPlay(reference),
          };
        }),
      })),
  }));
}

/** The flow and entry keys that must be open to show a scenario. */
export function pathKeys(entries: readonly PreviewEntrySummary[], reference: ScenarioReference | null): string[] {
  const entry = entries.find((candidate) => candidate.id === reference?.entryId);
  return entry === undefined ? [] : [flowKey(entry.flow), entryKey(entry.id)];
}

/** Every flow and entry key, for "expand all". */
export function groupKeys(entries: readonly PreviewEntrySummary[]): string[] {
  return [...new Set(entries.map((entry) => flowKey(entry.flow))), ...entries.map((entry) => entryKey(entry.id))];
}

/**
 * Scenarios for the quick switcher: every word of the query must appear in "flow title scenario", in any order.
 * An empty query lists the first ones.
 */
export function searchScenarios(
  entries: readonly PreviewEntrySummary[],
  query: string,
  limit: number,
): ScenarioMatch[] {
  const words = query.toLowerCase().split(/\s+/).filter((word) => word !== '');
  const matches: ScenarioMatch[] = [];
  for (const entry of entries) {
    for (const scenarioName of entry.scenarios) {
      const haystack = `${entry.flow} ${entry.title} ${entry.id} ${scenarioName}`.toLowerCase();
      if (words.every((word) => haystack.includes(word))) {
        const reference = { entryId: entry.id, scenarioName };
        matches.push({ ...reference, key: scenarioKey(reference), flow: entry.flow, entryTitle: entry.title });
      }
      if (matches.length >= limit) {
        return matches;
      }
    }
  }
  return matches;
}
