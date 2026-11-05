# E2E

## Only critical journeys, truly end to end

E2E covers the journeys that stop the product if they break: login, invite and accept, create and see it in the
list, permission denied, payment… Real front end, API and database, **no mocks**.

**Why:** e2e is expensive and slow. Everything else is already covered by unit, component and integration tests.

**Enforced by:** the plan lists the journeys touched; **a new critical journey without e2e doesn't close** (close
checklist).

## How to write them

| Rule | Why |
|---|---|
| Elements by role and accessible text (`getByRole`, `getByLabel`), **never by CSS class** | tests what the user sees, and enforces accessibility on the side |
| **No `sleep`** / `waitForTimeout`; wait for state (`expect(...).toBeVisible()`) | sleep is slow and flaky at the same time |
| **Each test creates its own data** (through the factories/seed) | tests run in parallel and in any order |
| Trace kept on failure | you can see what happened without running it again |
| Same seed as Bruno and the previewer | a single example dataset (see [testing.md](testing.md)) |

**Enforced by:** Playwright lint (`eslint-plugin-playwright`: `no-wait-for-timeout`, `prefer-native-locators`, a
rule that forbids `locator('.class')`); `e2e-kit` config with `trace: 'retain-on-failure'`.

## Where it runs

The whole stack in Docker with a clean database:

- `make check` → journeys affected by the change;
- full gate and CI → all of them;
- `make e2e` → on demand.
