import type { Page } from '@playwright/test';

/** What `@ligeirinho/previewer` publishes on `window.__ligeirinhoPreview` from its workbench page. */
export interface PreviewManifest {
  readonly entries: readonly PreviewEntrySummary[];
  readonly basePath: string;
}

export interface PreviewEntrySummary {
  readonly id: string;
  readonly flow: string;
  readonly title: string;
  readonly scenarios: readonly string[];
}

export type PreviewTheme = 'light' | 'dark';

export class PreviewManifestMissing extends Error {
  override readonly name = 'PreviewManifestMissing';

  constructor(readonly previewPath: string) {
    super(
      `${previewPath} did not publish window.__ligeirinhoPreview. Is the previewer route registered (dev mode) at this path?`,
    );
  }
}

const MANIFEST_TIMEOUT_MS = 15_000;

/** @throws PreviewManifestMissing */
export async function readPreviewManifest(page: Page, previewPath: string): Promise<PreviewManifest> {
  // Only the manifest matters, so don't wait for the workbench's frame to load.
  await page.goto(previewPath, { waitUntil: 'commit' });
  const manifestHandle = await page
    .waitForFunction(() => Reflect.get(window, '__ligeirinhoPreview'), undefined, { timeout: MANIFEST_TIMEOUT_MS })
    .catch(() => null);
  if (manifestHandle === null) {
    throw new PreviewManifestMissing(previewPath);
  }
  const manifest: unknown = await manifestHandle.jsonValue();
  if (!isPreviewManifest(manifest)) {
    throw new PreviewManifestMissing(previewPath);
  }
  return manifest;
}

export function buildRenderUrl(basePath: string, entryId: string, scenarioName: string, theme: PreviewTheme): string {
  const encodedPath = [entryId, scenarioName].map(encodeURIComponent).join('/');
  return `${basePath}/render/${encodedPath}?theme=${theme}`;
}

function isPreviewManifest(candidate: unknown): candidate is PreviewManifest {
  return (
    typeof candidate === 'object' &&
    candidate !== null &&
    'basePath' in candidate &&
    typeof candidate.basePath === 'string' &&
    'entries' in candidate &&
    Array.isArray(candidate.entries) &&
    candidate.entries.every(isPreviewEntrySummary)
  );
}

function isPreviewEntrySummary(candidate: unknown): candidate is PreviewEntrySummary {
  return (
    typeof candidate === 'object' &&
    candidate !== null &&
    'id' in candidate &&
    typeof candidate.id === 'string' &&
    'flow' in candidate &&
    typeof candidate.flow === 'string' &&
    'title' in candidate &&
    typeof candidate.title === 'string' &&
    'scenarios' in candidate &&
    Array.isArray(candidate.scenarios) &&
    candidate.scenarios.every((scenarioName: unknown) => typeof scenarioName === 'string')
  );
}
