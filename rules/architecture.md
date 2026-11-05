# Architecture

## Fixed layers, dependencies point inward only

```
presentation  →  application  →  domain
infrastructure  →  application (implements the ports)
```

- **Domain**: pure business rules. Entities, value objects, policies. No IO, no framework, no Prisma, no Nest, no
  direct `Date.now()` (the clock is a port).
- **Application**: use cases and ports (interfaces the use case needs: repository, clock, email, queue).
- **Infrastructure**: adapters that implement the ports (Prisma, external HTTP, queue, email).
- **Presentation**: HTTP (controllers, DTOs, guards) on the back end; pages and views on the front end.

**Why:** business rules testable without a database or network, infrastructure swappable without touching rules,
and an obvious place for everything (the agent and any person know where to look and where to write).

**Enforced by:** architecture test with `@nx/enforce-module-boundaries`. Each lib has the tags `layer:domain`,
`layer:application`, `layer:infrastructure` or `layer:presentation`, and the allowed dependencies live in the
template's `eslint.config`. A wrong import breaks the lint.

## One module per business area

In Nest, each business area (e.g. `registrations`, `events`) is a module with the four layers inside. One area
doesn't import another area's infrastructure; areas talk through the application layer (an exposed use case or
port) or through events.

**Why:** an area with a clear boundary can grow, change owners or become a service without surgery.

**Enforced by:** `area:<name>` tags in Nx + `@nx/enforce-module-boundaries`.

## One owner per pattern (rule of two)

If it shows up twice, it becomes a component, function or module with a single owner. This applies to code, to
screen components and to business rules.

**Why:** two copies drift apart. The third copy is born with one of their bugs.

**Enforced by:** jscpd for literal copies (every ignore needs a comment with the reason); the close checklist for
**repetition by meaning** (two functions that do the same thing with different names and shapes).

## No `utils`, `helpers`, `manager`, `common` or generic `shared`

Forbidden as a file, folder, class or module name, **unless** the content is truly generic (knows no business
concept), lives in a single place and has an explicit name for what it does
(e.g. `libs/text/strip-accents.ts`, never `utils/string.ts`).

**Why:** `utils` becomes a junk drawer. Business code hidden there has no owner and gets rewritten by whoever
can't find it.

**Enforced by:** file-name lint (`check-file` in the template) + checklist.
