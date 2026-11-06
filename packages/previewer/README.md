# @ligeirinho/previewer

A dev-only route, `/__preview`, that renders the app's **real** view components with example view-models
("scenarios"), side by side at 390, 768 and 1280 px, light and dark. It also has a resizable mode with a drag
handle. It is not Storybook: no separate build, no stories format, just the views and their scenarios.

## Use

```ts
// task-list.scenarios.ts, next to task-list.view.ts
import { defineScenarios } from '@ligeirinho/previewer';
import { TaskListView } from './task-list.view';
import type { TaskListViewModel } from './task-list.view-model';

export const taskListScenarios = defineScenarios<TaskListViewModel>({
  flow: 'Tasks',          // groups entries on the grid
  title: 'Task list',     // entry id: 'task-list'
  component: TaskListView, // must have `readonly model = input.required<TaskListViewModel>()`
  scenarios: { empty: {...}, full: {...}, error: {...} },
});
```

```ts
// app.routes.ts
import { previewRoutes } from '@ligeirinho/previewer';
import { scenarioRegistry } from './preview.registry';

export const routes: Routes = [
  ...(isDevMode() ? [{ path: '__preview', children: previewRoutes(scenarioRegistry) }] : []),
];
```

`previewRoutes(registry, { widths, themes })` changes the grid's widths and themes.

Scenario names are inferred only without a type argument (TypeScript has no partial inference). With
`defineScenarios<TaskListViewModel>(...)`, `scenarios.full` is `TaskListViewModel | undefined` under
`noUncheckedIndexedAccess`. To get it typed exactly, either leave out the type argument (the view-model type comes
from `component`), or pass the names: `defineScenarios<TaskListViewModel, 'empty' | 'full' | 'error'>(...)`.

## Routes

| Path | Shows |
|---|---|
| `/__preview?flow=Tasks` | the grid, optionally filtered by flow |
| `/__preview/render/:entryId/:scenarioName?theme=light\|dark` | one scenario, full page, no previewer chrome; toggles the `dark` class on `<html>`; logs outputs as `[preview] <outputName>` |

The grid publishes `window.__ligeirinhoPreview = { entries: [{ id, flow, title, scenarios }], basePath }`, which
`@ligeirinho/e2e-kit` reads to check every scenario. The render page sets
`data-ligeirinho-preview="rendered|not-found"` on `<html>` once it has rendered, so e2e-kit knows when to check.

The render page sits inside your root component, so keep the root to a bare `<router-outlet />` (app chrome in a
layout route) if the scenarios should render without it.

## Registry generator

```sh
ligeirinho-preview-registry --root src --out src/app/preview.registry.ts          # write
ligeirinho-preview-registry --root src --out src/app/preview.registry.ts --check  # exit 1 if stale (gate)
```

It finds every `export const <name> = defineScenarios...` in `*.scenarios.ts` files (skipping `node_modules`,
`dist` and hidden folders) and writes a sorted registry. Exit codes: 0 ok, 1 stale, 2 bad arguments or two
exports with the same name.

## Develop

`pnpm build` (ng-packagr, partial compilation, into `dist/`; CLI with tsc into `dist-cli/`), `pnpm test` (type
tests, Vitest for the pure parts and the CLI, then a Playwright smoke test against the demo app in `demo/`).
