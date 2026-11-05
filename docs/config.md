# `.ligeirinho.yml`

The file at the repository root that says "this project uses ligeirinho". Without it, the plugin stays quiet.

A **two-level** YAML file (section and key), so hooks can read it without extra dependencies.

```yaml
version: 1

commands:
  test: make test            # fast; runs before every commit (toolbox up, docker compose exec)
  gate: make check           # affected only; the close stage requires it green
  full_gate: make gate       # everything, fresh container; CI and before a release
  preview: make preview      # starts the previewer at /__preview
  e2e: make e2e              # on demand

docs:
  areas: docs/areas
  features: docs/features

preview:
  url: http://localhost:4200/__preview
  widths: 390,768,1280

adoption:
  enabled: false             # true in an existing project: rules old code doesn't meet yet become warnings
```

| Key | Required | Used by |
|---|---|---|
| `commands.test` | yes | the before-commit hook |
| `commands.gate` | yes | `scripts/gate.sh`, close stage |
| `commands.full_gate` | no | `scripts/gate.sh full` |
| `commands.preview` | if there's a front end | preview skill |
| `commands.e2e` | no | on demand |
| `docs.areas`, `docs.features` | no (default `docs/areas`, `docs/features`) | skills, stop hook |
| `preview.url`, `preview.widths` | no (defaults above) | preview skill, `e2e-kit` |
| `adoption.enabled` | no (default `false`) | every rule |

Working state (current feature, stage, green-gate stamp) lives in `.ligeirinho/`, outside git.
