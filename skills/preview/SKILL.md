---
name: preview
description: Renders the feature's new screens in the project's previewer (/__preview) with their scenarios, one at a time at 390/768/1280, light and dark, and asks the user to approve them. Use after the plan is approved when the feature has a new or changed screen.
---

# Preview

The real screens are the reference. No drawing on a canvas and rebuilding later: the view you write here is the one
that ships.

## Steps

1. For each screen in the plan, write the view-model **first** (`*.view-model.ts`, type + pure function) and the
   scenarios (`*.scenarios.ts`), one example view-model per scenario. Scenarios are the test fixtures (see
   `rules/testing.md`).
2. Write the view (`*.view.ts` + `.html`): only `input()`/`output()`, only design system components (Angular Material and
   the project's own), mobile first, no fixed widths, colors and spacing only from the theme's tokens (see
   `rules/mvvm.md`, `rules/responsive.md` and `rules/design.md`).
3. Register the scenarios in the previewer: the project's `/__preview` route is
   [`@ligeirinho/previewer`](https://github.com/loliveirawebdev/ligeirinho/tree/main/packages/previewer). Export
   them with `defineScenarios({ flow, title, component, scenarios })` (`flow` is the feature's flow; a state the
   view keeps to itself, like a dialog it opens, gets a `play` for that scenario, see the README), then
   regenerate the registry: `pnpm exec ligeirinho-preview-registry --root libs --out
   apps/web/src/app/preview.registry.ts`. Never write a previewer of your own: if the project doesn't have the
   package, install it from ligeirinho's GitHub Releases and wire `previewRoutes(scenarioRegistry)` as its README
   shows, or tell the user the project wasn't created from the template.
4. Start the previewer (`commands.preview` in `.ligeirinho.yml`) and open `/__preview` in a browser your agent can
   drive. It shows one scenario at a time, and everything is in the URL:
   `/__preview?entry=<id>&scenario=<name>&w=390&h=844&theme=dark`. Walk each scenario at 390, 768 and 1280, light
   and dark, and check that its play steps (panel at the bottom) all pass.
5. Review it yourself before showing it, with `rules/design.md` ("The review"): name which of the five failures it
   has and fix that first, then go through hierarchy, content, type, spacing, color, icons and density, in every
   scenario, at every width, in light and dark. Also: no horizontal scrolling, no cut-off text, no small touch
   targets. When you show it, say in one line what the screen's focal element is.
6. Show it to the user and ask for approval: give them the `/__preview?entry=…` link of each screen. Adjust until
   they approve.

Don't wire the page to the back end yet: that's part of the build. The approved view and view-model go into the
first build chunk with their component tests.

Once approved, run `scripts/state.sh NNN-name build` and move on to the `build` skill.
