# app

This repo uses [ligeirinho](https://github.com/loliveirawebdev/ligeirinho). Follow its flow (FLOW.md) and rules
(rules/). If your agent has no ligeirinho hooks, run `make test` before every commit and `make check` before you say
a feature is done.

Everything runs in Docker; the host only needs Docker and make. `make help` lists the commands.

| Command | What it does |
|---|---|
| `make up` | start the toolbox and databases, install, migrate |
| `make dev` | API on localhost:3000, web app on localhost:4200 |
| `make preview` | web app; screens with scenarios at localhost:4200/__preview |
| `make test` | lint, types and unit tests of what changed (before every commit) |
| `make check` | the gate for what changed since main |
| `make gate` | the full gate in a fresh container (CI) |
| `make seed` / `make bruno-env` | example data and test tokens for Bruno |

## Specific to this repo

- Areas: `tasks`. Each area's rules are in `docs/areas/<area>.md`; feature notes in `docs/features/`.
- New area: `libs/<area>/{domain,application,infrastructure,api,web}`, tagged `area:<area>` and `layer:<layer>`, and
  added to `boundaries({ areas })` in `eslint.config.mjs`.
- Spartan components are added with `pnpm exec nx g @spartan-ng/cli:ui` into `libs/ui/spartan`; a new one is brought
  to the shared look (ligeirinho rules/design.md, "The look": flat, 44 px, tokens only). This app changes only the
  THEME block of `apps/web/src/styles.css`.
- `apps/web/src/app/preview.registry.ts` is generated: `pnpm exec ligeirinho-preview-registry --root libs --out
  apps/web/src/app/preview.registry.ts`.
- The API contract is generated from the code (`nx run api:openapi`); the Bruno collection in `bruno/` must match it.
