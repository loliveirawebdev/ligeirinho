# Fixed stack

| Piece | Choice | Notes |
|---|---|---|
| Monorepo | **Nx** | cache, "affected only", module boundaries |
| Back end | **NestJS** | one module per area, with domain/application/infrastructure/presentation; validation in DTOs; OpenAPI through `@nestjs/swagger` |
| Front end | **Angular** | signals; `input()`/`output()`; view-model with `computed()` |
| Database | **Postgres + Prisma** | Prisma only in infrastructure, behind the ports |
| Tests | **Vitest** on front and back end | |
| Design system | **Spartan** (shadcn for Angular) | |
| Responsive and e2e | **Playwright** | |
| Environment | **Everything in Docker** | the host only needs Docker and `make` |

**Why fixed:** a single stack lets the rules, the template and the packages apply to every project. Changing a
piece is a ligeirinho decision, not a project decision.

## Start from the template, use the packages

| Rule | Why |
|---|---|
| A new project starts from ligeirinho's `template/` (`scripts/init.sh`), never from a hand-assembled setup | the template is the stack above, pinned and passing `make check`; a hand-made setup drifts at once (other versions, no Docker, no gate) |
| The tools the rules need come from ligeirinho's packages (`@ligeirinho/previewer`, `eslint-config`, `spectral-ruleset`, `jscpd-config`, `bruno-tools`, `e2e-kit`), installed from its GitHub Releases | one implementation, fixed once for everyone; a project's own copy of a previewer or lint rule is the duplication `architecture.md` forbids |

**Enforced by:** the `init` and `preview` skills; review at the close.

## Docker

| Rule | Why |
|---|---|
| A single tools image (**toolbox**) with everything pinned to exact versions | same versions everywhere; nothing installed on the host |
| **Toolbox always up** during development; hooks and tests use `docker compose exec` | almost instant; starting a new container on every commit costs seconds each time |
| A new container (`run --rm`) only for the final gate and CI | the gate proves it works from scratch |
| Dependencies in volumes (`node_modules`, the pnpm store), **never in the mounted folder** | mounted folders are slow on macOS |
| Nx task cache shared across worktrees | parallel sessions don't redo the same work |
| Gate runs only what changed (Nx affected); infrastructure changes run everything | fast without losing safety |
| **Machine-wide lock** for gates: one at a time across parallel sessions | two gates at once exhaust the VM's memory |
| Exit 137 is reported as **out of memory**, not as a bug | avoids hunting a bug that doesn't exist |
| Limited concurrency; the gate brings down the dev stack before running; separate test services | predictable memory |

**Enforced by:** the `template/` ships this way; the plugin's gate script (`scripts/gate.sh`) applies the lock and
translates exit 137.
