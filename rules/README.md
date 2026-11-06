# Ligeirinho rules

Highly opinionated rules. Nobody has to ask for quality, security or tests: these rules apply whenever the
repository has a `.ligeirinho.yml`.

Each rule says **why it exists** and **what enforces it**. One of these four enforces each rule:

| Enforcer | When it runs | Example |
|---|---|---|
| **lint** | in the editor, in `make test` and in the gate | `@typescript-eslint` strict, `@angular-eslint`, Spectral, jscpd |
| **architecture test** | in `make test` and in the gate | layer boundaries with `@nx/enforce-module-boundaries` |
| **hook** | immediately, during the agent session | blocks `inject()` in views; runs tests before each commit |
| **checklist** | the build applies it to the diff before each commit; the close checks it again | naming, repetition by meaning, comments only for the why |

A rule without an enforcer doesn't get in. If a rule can only be enforced by the checklist, it stays there until
it can become a lint rule.

## Files

1. [architecture.md](architecture.md) — layers, modules, one owner per pattern
2. [mvvm.md](mvvm.md) — pure view, view-model built by a pure function, thin page
3. [code.md](code.md) — naming, code in English, types, errors, functions, comments
4. [testing.md](testing.md) — test first, fakes, fixtures = scenarios
5. [security.md](security.md) — zero trust, OWASP, auditing
6. [scale.md](scale.md) — pagination, indexes, N+1, idempotency, queues
7. [responsive.md](responsive.md) — mobile first, layout rules, gate checks
8. [design.md](design.md) — hierarchy, content, type, spacing, color, icons; the screen review
9. [rest-api.md](rest-api.md) — REST contract and the Spectral rules
10. [e2e.md](e2e.md) — critical journeys with Playwright
11. [bruno.md](bruno.md) — API collection and drift check
12. [docs.md](docs.md) — area doc, feature note, lean agent instructions file
13. [stack.md](stack.md) — fixed stack and Docker

## Projects in adoption

With `adoption.enabled: true` in `.ligeirinho.yml`, rules that existing code doesn't meet yet are **warnings**
instead of errors. Warnings become errors gradually, one area at a time. New code follows every rule from day one.
