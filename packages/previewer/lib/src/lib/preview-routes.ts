import type { Routes } from '@angular/router';
import { PREVIEW_CONFIG, type PreviewOptions, toPreviewConfig } from './preview-options';
import { PreviewWorkbenchPage } from './preview-workbench.page';
import { PreviewRenderPage } from './preview-render.page';
import type { ScenarioRegistry } from './scenario-entry';
import { assertUniqueEntryIds } from './scenario-registry';

/**
 * Child routes of the dev-only previewer:
 * `''` → the workbench, `render/:entryId/:scenarioName?theme=light|dark&play=0` → one scenario, full page.
 *
 * @throws DuplicatePreviewEntryId when two entries resolve to the same id.
 */
export function previewRoutes(registry: ScenarioRegistry, options: PreviewOptions = {}): Routes {
  assertUniqueEntryIds(registry);
  const config = toPreviewConfig(registry, options);
  return [
    {
      path: '',
      providers: [{ provide: PREVIEW_CONFIG, useValue: config }],
      children: [
        { path: '', pathMatch: 'full', component: PreviewWorkbenchPage, title: 'Preview' },
        { path: 'render/:entryId/:scenarioName', component: PreviewRenderPage },
      ],
    },
  ];
}
