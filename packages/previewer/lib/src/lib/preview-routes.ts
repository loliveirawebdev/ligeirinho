import type { Routes } from '@angular/router';
import {
  DEFAULT_PREVIEW_THEMES,
  DEFAULT_PREVIEW_WIDTHS,
  PREVIEW_CONFIG,
  type PreviewConfig,
  type PreviewOptions,
} from './preview-options';
import { PreviewGridPage } from './preview-grid.page';
import { PreviewRenderPage } from './preview-render.page';
import type { ScenarioRegistry } from './scenario-entry';
import { assertUniqueEntryIds } from './scenario-registry';

/**
 * Child routes of the dev-only previewer:
 * `''` → grid page, `render/:entryId/:scenarioName?theme=light|dark` → one scenario, full page.
 *
 * @throws DuplicatePreviewEntryId when two entries resolve to the same id.
 */
export function previewRoutes(registry: ScenarioRegistry, options: PreviewOptions = {}): Routes {
  assertUniqueEntryIds(registry);
  const config: PreviewConfig = {
    registry,
    widths: options.widths ?? DEFAULT_PREVIEW_WIDTHS,
    themes: options.themes ?? DEFAULT_PREVIEW_THEMES,
  };
  return [
    {
      path: '',
      providers: [{ provide: PREVIEW_CONFIG, useValue: config }],
      children: [
        { path: '', pathMatch: 'full', component: PreviewGridPage, title: 'Preview' },
        { path: 'render/:entryId/:scenarioName', component: PreviewRenderPage },
      ],
    },
  ];
}
