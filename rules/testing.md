# Testing

## Test first, through public behavior

The build loop is always: **failing test → code → the chunk's tests green → commit**. A test talks about what the
use case, function or screen does for whoever uses it, not how it does it inside.

**Why:** this loop is what keeps the code predictable. Tests of internal details break on refactors and miss
behavior bugs.

**Enforced by:** the build skill follows the loop; the commit **hook** runs the tests before every `git commit`
and blocks it if they fail; the close checks that every item in the plan's test list exists.

## Fakes instead of mocks

Every application port has an in-memory fake (`InMemoryRegistrationRepository`) that behaves like the real one.
`vi.mock` of application or domain modules and "was called with" assertions are forbidden. Mocks only for the
outermost edge that has no fake (e.g. the system clock, if there's no port for it).

**Why:** a mock couples the test to the implementation and passes even when the real code would break. A fake is
reused across all tests and in the previewer.

**Enforced by:** lint (`no-restricted-syntax` for `vi.mock` outside `infrastructure`); checklist.

## Scenarios are the fixtures

A scenario (`*.scenarios.ts`) is used in four places:

1. the view's component test;
2. the previewer (`/__preview`);
3. the Bruno seed (the `local` environment);
4. e2e data.

On the back end, test entity factories (`createTestRegistration()`) live in one place per area and feed unit
tests, the seed and e2e.

**Why:** a single example dataset that everyone sees. If the previewer shows it, the tests test it.

**Enforced by:** the close checklist (a new screen without scenarios, or a test with inline data that already
exists in a scenario or factory).

## What each kind of test covers

| Kind | Covers | Tool |
|---|---|---|
| Unit | domain, use cases (with fakes), view-models | Vitest |
| Component | the view with each scenario: renders, emits outputs | Vitest + Angular Testing Library |
| Integration | infrastructure adapters against a real Postgres in Docker; authorization of each route | Vitest + Supertest |
| Responsive | each scenario at 390/768/1280 (see [responsive.md](responsive.md)) | Playwright |
| E2E | critical journeys (see [e2e.md](e2e.md)) | Playwright |

Every new route has tests for **who can and who can't** call it (see [security.md](security.md)).
