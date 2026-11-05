# Real MVVM on the front end

Three pieces per screen, each in a file with a fixed suffix:

| Piece | File | May | May not |
|---|---|---|---|
| **View** | `*.view.ts` (+ `.html`) | receive the view-model through `input()`, emit intents through `output()`, use design system components | `inject()`, constructor with dependencies, fetch data, know about routes, know about HTTP |
| **View-model** | `*.view-model.ts` | pure function `buildXxxViewModel(state) → XxxViewModel` | IO, Angular, signals, effects |
| **Page** | `*.page.ts` | inject services, fetch data, keep state in signals, build the view-model with `computed()`, wire outputs to actions | presentation logic (it belongs in the view-model) |

Plus one file next to the view: `*.scenarios.ts` with the scenarios (empty, full, error, read-only…), each one an
example view-model. Scenarios are the fixtures for the tests and the previewer (see [testing.md](testing.md)).

**Why:**
- A pure view renders in the previewer with any scenario, without mocking services.
- A view-model built by a pure function is tested with one line per case, without TestBed.
- A thin page has little that can go wrong, and its test only covers the wiring.

**Enforced by:**
- **hook** in the plugin: blocks `inject(` and constructors with parameters in `*.view.ts` as they are written.
- **lint**: an `@angular-eslint` / `no-restricted-syntax` rule in the template for the same case in `*.view.ts`;
  `no-restricted-imports` prevents `*.view-model.ts` from importing `@angular/*`.
- **checklist**: presentation logic inside the page or the view.

## Raw elements only in the design system

Outside the component library (Spartan + the project's own components), raw `<button>`, `<input>`, `<select>`,
`<textarea>`, `<table>` and `<dialog>` are forbidden in templates.

**Why:** accessibility, states (focus, disabled, loading) and responsiveness solved once.

**Enforced by:** template lint (`@angular-eslint/template` with a forbidden-elements rule).

## Signals

`input()` / `output()` / `computed()` / `signal()`. No `@Input()` decorator, hand-made `EventEmitter` or
`BehaviorSubject` for screen state.

**Why:** a single reactivity model, with predictable change detection.

**Enforced by:** lint (`@angular-eslint/prefer-signals`, `prefer-output-readonly`).
