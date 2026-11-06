---
name: preview
description: Renders the feature's new screens in the project's previewer (/__preview) with their scenarios, side by side at 390/768/1280, light and dark, and asks the user to approve them. Use after the plan is approved when the feature has a new or changed screen.
---

# Preview

The real screens are the reference. No drawing on a canvas and rebuilding later: the view you write here is the one
that ships.

## Steps

1. For each screen in the plan, write the view-model **first** (`*.view-model.ts`, type + pure function) and the
   scenarios (`*.scenarios.ts`), one example view-model per scenario. Scenarios are the test fixtures (see
   `rules/testing.md`).
2. Write the view (`*.view.ts` + `.html`): only `input()`/`output()`, only design system components (Spartan and
   the project's own), mobile first, no fixed widths (see `rules/mvvm.md` and `rules/responsive.md`).
3. Register the scenarios in the previewer: the project's `/__preview` route is
   [`@ligeirinho/previewer`](https://github.com/loliveirawebdev/ligeirinho/tree/main/packages/previewer). Export
   them with `defineScenarios({ flow, title, component, scenarios })` (`flow` is the feature's flow), then
   regenerate the registry: `pnpm exec ligeirinho-preview-registry --root libs --out
   apps/web/src/app/preview.registry.ts`. Never write a previewer of your own: if the project doesn't have the
   package, install it from ligeirinho's GitHub Releases and wire `previewRoutes(scenarioRegistry)` as its README
   shows, or tell the user the project wasn't created from the template.
4. Start the previewer (`commands.preview` in `.ligeirinho.yml`) and open `/__preview` in a browser your agent can
   drive, with the feature's group: side by side at 390, 768 and 1280, light and dark.
5. Check it yourself before showing it: horizontal scrolling, cut-off text, small touch targets, empty and error
   states with a useful message.
6. Show it to the user and ask for approval. Adjust until they approve.

Don't wire the page to the back end yet: that's part of the build. The approved view and view-model go into the
first build chunk with their component tests.

Once approved, run `scripts/state.sh NNN-name build` and move on to the `build` skill.
