# Code

## Meaningful, explicit names

No `x`, `data`, `tmp`, `res`, `item2`, `aux`, `obj`, `val`, `info`, no abbreviations (`usr`, `qty`, `cfg`). Names
in the business language: if the business says "registration", the code says `registration`, not `signup` in one
place and `subscription` in another.

Exceptions: `i`/`j` in a numeric loop a few lines long; `id` when it's the entity's own identifier.

**Why:** code is read much more than it's written. A good name removes the need for a comment and prevents
mix-up bugs.

**Enforced by:** lint (`id-denylist` with the list above, `@typescript-eslint/naming-convention`); checklist for
names that aren't from the business language.

## Validation only at the edge

External input (HTTP, queue, response from an external service, environment variable) is validated **once**, at
the edge, and becomes a domain type. Inside, the types guarantee it; no revalidating and no defensive
`if (!x) throw` scattered around.

**Why:** scattered validation is inconsistent and hides where the data comes in.

**Enforced by:** checklist; DTOs with `class-validator` in Nest and a global `ValidationPipe` with `whitelist` and
`forbidNonWhitelisted`.

## Strict typing

`strict: true` plus `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`. No `any`, no non-null `!`, no
"trust me" `as` (only `as const` and casts inside a tested type guard).

**Why:** types are documentation the compiler checks.

**Enforced by:** lint (`@typescript-eslint/strict-type-checked`, `no-explicit-any`, `no-non-null-assertion`,
`consistent-type-assertions` with `assertionStyle: never` outside guards).

## Explicit, typed errors, never swallowed

Business errors are types (`RegistrationClosed`, `NoSeatsLeft`), not `throw new Error('...')` with a string. A use
case returns a typed result or throws a typed error; the presentation layer maps it to HTTP in a single place. An
empty `catch`, or one that just logs and moves on, is forbidden.

**Why:** a swallowed error becomes a silent bug; a string error can't be handled or tested properly.

**Enforced by:** lint (`no-empty`, `@typescript-eslint/only-throw-error`, a rule that forbids `new Error(` outside
infrastructure); checklist for a `catch` that hides errors.

## Small functions, early returns

- A function does one thing. If its name needs an "and", it's two functions.
- Early return instead of nested `if`.
- **A boolean that changes behavior becomes two functions** (`send(email, true)` → `sendNow` / `scheduleSend`).

**Why:** a small function has a name that explains it, a simple test and a readable diff.

**Enforced by:** lint (`max-lines-per-function: 40`, `max-depth: 2`, `complexity: 8`, `max-params: 3`); checklist
for boolean parameters.

## Comments only for the why

The code says what and how. Comments exist for the why that doesn't fit in the code (an external constraint, a
counterintuitive decision, a link to the source).

**Enforced by:** checklist.

## No dead code, no loose TODOs

Nothing commented out "for later", nothing unused, no `// TODO`. It either goes to the backlog or it doesn't
exist.

**Why:** dead code confuses whoever reads it, including the agent, which tries to keep it working.

**Enforced by:** lint (`no-warning-comments`, `@typescript-eslint/no-unused-vars`); Nx/knip for unused exports in
the gate.
