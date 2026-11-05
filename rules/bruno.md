# API: Bruno collection

| Rule | Why | Enforced by |
|---|---|---|
| Bruno collection in the repo (`bruno/`), **folders mirroring the URLs** | find a route's request without searching | drift check |
| One environment per place: `local`, `dev`, `prod` | switch environments without editing requests | — |
| Secrets in `.env`, **outside git** | secrets never in code (see [security.md](security.md)) | gitleaks in the gate |
| **Drift check** against the OpenAPI: a route without a request, an orphan request or one with an invalid body fails | the collection never goes stale | `bruno-tools` in the gate |
| A `flows/` folder with requests in sequence for multi-call flows | test a whole flow by hand (invite → accept → login) | — |
| A local seed (`make bruno-env`) creates test data and tokens and fills in the `local` environment | open Bruno and start calling right away | `bruno-tools` |
