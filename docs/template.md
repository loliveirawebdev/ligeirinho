# The template

`template/` is the starting point for new projects. `scripts/init.sh <dir>` copies it, packs ligeirinho's
packages into `<dir>/vendor/ligeirinho/` (they aren't on a registry yet) and makes the first commit.

## What's in it

A small task list (create, list, complete), built the way the [rules](../rules/README.md) ask, so the first real
feature has an example to follow in every layer.

| Where | What |
|---|---|
| `libs/tasks/{domain,application,infrastructure,api,web}` | the `tasks` area, one lib per layer, tagged `area:tasks` and `layer:*` |
| `libs/shared/{kernel,database,http,auth}` | typed errors and ids, Prisma client, Problem Details, the deny-by-default access guard |
| `libs/ui/spartan/*` | Spartan components (vendored, sized up for touch) |
| `apps/api` | NestJS composition root; `--export-openapi` writes the contract |
| `apps/web` | Angular (zoneless, signals); `/__preview` in dev |
| `apps/e2e` | Playwright journeys and responsive checks over every preview scenario |
| `prisma/` | schema and migrations |
| `bruno/` | one request per route, kept in sync with the contract |
| `docker/`, `compose.yaml`, `Makefile`, `tools/check.sh` | everything runs in the toolbox container |
| `.ligeirinho.yml`, `AGENTS.md`, `CLAUDE.md`, `.claude/`, `.codex/` | ligeirinho enabled for each agent |

## Versions

Nx 24, Angular 22.2, NestJS 11, Prisma 7 (`prisma-client` generator, `@prisma/adapter-pg`), TypeScript 6.0,
Vitest 5, Playwright 1.65, Spartan 1.9 with Tailwind 4, Postgres 18, ESLint 10. Exact versions are in
`template/package.json` and `template/pnpm-lock.yaml`.

## The gate (`make check`)

`tools/check.sh` runs, for what changed since `main` (everything when an infrastructure file changed):

1. the preview registry is up to date;
2. `nx affected -t lint typecheck test build`;
3. `ligeirinho-jscpd` (copy-paste) and `gitleaks` (secrets);
4. integration tests against a fresh test database;
5. the OpenAPI contract: Spectral with `@ligeirinho/spectral-ruleset` and `ligeirinho-bruno drift`;
6. the e2e journeys and the responsive checks.

`make gate` runs the same for everything in a fresh container, as CI does.

## Changing the template

After changing `template/package.json` or any package, run `scripts/update-template-lockfile.sh`: the lockfile pins
each package tarball's hash. `pnpm pack` is deterministic, so the tarballs `init.sh` packs later match it.
