# The template

`template/` is the starting point for new projects. `scripts/init.sh <dir>` copies it, names the project after the
folder (or `--name`) and makes the first commit. The project installs ligeirinho's packages from this repository's
[GitHub Releases](https://github.com/loliveirawebdev/ligeirinho/releases): public tarballs, no registry and no
token.

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

## Releasing the packages

1. Bump `version` in every `packages/*/package.json` (they move together).
2. Commit, then push a tag `v<version>`. The `release` workflow checks the versions, runs every package's tests,
   packs them and creates the GitHub Release with the tarballs attached.
3. Run `scripts/update-template-lockfile.sh <version>`: it points `template/package.json` at the new release and
   refreshes `template/pnpm-lock.yaml`. Commit.

An existing project updates by changing the version in its six `@ligeirinho/*` URLs and running `pnpm install`.

## Trying package changes before a release

`scripts/init.sh <dir> --local` packs the packages from this checkout into `<dir>/vendor/ligeirinho/` and installs
them from there (needs pnpm on the host).
