# @ligeirinho/previewer

A dev-only route, `/__preview`, that renders the app's **real** view components with example view-models
("scenarios"). It is not Storybook: no separate build, no stories format, just the views and their scenarios.

The page works like a browser's device mode: **one scenario at a time** in a frame with rulers, which you resize by
dragging its right edge, bottom edge or corner (arrow keys on a focused edge: ±10 px, ±50 with Shift).

- **Sidebar:** every scenario, grouped by flow and entry, with a search; ↑/↓ moves through them.
- **Toolbar:** device presets (phones, tablets, laptop, desktop), width × height, rotate, zoom (fit or a fixed
  scale), dark theme, run steps on or off, replay, open the scenario alone in a tab.
- **Rulers:** px marks and the breakpoints (`sm` 640 … `2xl` 1536); click one to set the width.
- **Panel:** the scenario's play steps (✓ / ✕ with the error) and every output the view emitted, with its value.

Everything (scenario, size, theme, zoom, steps) is in the URL, so a reload or a shared link opens the same view.

## Use

```ts
// task-list.scenarios.ts, next to task-list.view.ts
import { defineScenarios } from '@ligeirinho/previewer';
import { TaskListView } from './task-list.view';
import type { TaskListViewModel } from './task-list.view-model';

export const taskListScenarios = defineScenarios<TaskListViewModel>({
  flow: 'Tasks',          // groups entries in the sidebar
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

`previewRoutes(registry, { viewports, breakpoints, themes })` replaces the device presets
(`[{ label, width, height }]`, defaults in `DEFAULT_PREVIEW_VIEWPORTS`), the ruler's breakpoints
(`[{ label, width }]`, Tailwind's by default) and the themes. `widths: [390, 768]` still works and adds "390 px"
presets.

### Play: states that need an interaction

Some states can't come from the view-model alone: a confirm dialog the view opens itself, a menu that is expanded,
a field with focus. Give the scenario a `play` function; it runs after the first render, in the browser, and the
workbench lists each `step`:

```ts
export const taskListScenarios = defineScenarios<TaskListViewModel, 'empty' | 'full' | 'confirmDelete'>({
  flow: 'Tasks',
  title: 'Task list',
  component: TaskListView,
  scenarios: { empty, full, confirmDelete: full },
  play: {
    confirmDelete: async ({ canvas, step }) => {
      await step('Click “Delete…” on the second task', () => {
        canvas.querySelector<HTMLButtonElement>('[aria-label="Delete: Buy milk…"]')?.click();
      });
    },
  },
});
```

`canvas` is `document.body` (overlays included); `step(label, action)` returns what `action` returns and fails the
play with its label when it throws. Queries from `@testing-library/dom` (`within(canvas).getByRole(...)`) work too
if the project has it. Prefer state in the view-model: use `play` only for what the view keeps to itself. The
"Run steps" toggle (`?play=0` on the render page) shows the scenario as first rendered.

Scenario names are inferred only without a type argument (TypeScript has no partial inference). With
`defineScenarios<TaskListViewModel>(...)`, `scenarios.full` is `TaskListViewModel | undefined` under
`noUncheckedIndexedAccess`. To get it typed exactly, either leave out the type argument (the view-model type comes
from `component`), or pass the names: `defineScenarios<TaskListViewModel, 'empty' | 'full' | 'error'>(...)`.

## Routes

| Path | Shows |
|---|---|
| `/__preview?entry=task-list&scenario=full&w=390&h=844&theme=dark&zoom=fit&play=1` | the workbench (every parameter optional) |
| `/__preview/render/:entryId/:scenarioName?theme=light\|dark&play=0` | one scenario, full page, no previewer chrome; toggles the `dark` class on `<html>`; runs the play unless `play=0`; logs outputs as `[preview] <outputName>` |

The workbench publishes `window.__ligeirinhoPreview = { entries: [{ id, flow, title, scenarios }], basePath }`,
which `@ligeirinho/e2e-kit` reads to check every scenario. The render page sets `data-ligeirinho-preview` on
`<html>` once it is done: `rendered` (after the play, if any), `not-found`, or `play-failed` with the message in
`data-ligeirinho-preview-error`. Inside the workbench's frame it also posts the steps and outputs to the workbench.

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
