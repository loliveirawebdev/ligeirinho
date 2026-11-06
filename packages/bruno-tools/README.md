# @ligeirinho/bruno-tools

Keeps a [Bruno](https://www.usebruno.com/) collection in sync with an OpenAPI 3.x document. Used by ligeirinho's
gate and local seed (see `rules/bruno.md`).

```sh
ligeirinho-bruno drift    --openapi <file-or-url> --collection <dir>
ligeirinho-bruno env      --collection <dir> --env <name> --values <json-file> [--force]
ligeirinho-bruno scaffold --openapi <file-or-url> --collection <dir>
```

The OpenAPI document can be JSON or YAML, a file or an `http(s)://` URL. Exit codes: `0` ok, `1` drift found or
the command refused/failed, `2` bad usage.

## `drift`

Reads every request `.bru` file in the collection (not `environments/`, `collection.bru` or `folder.bru`) and fails
with one line per problem:

| Problem | Example |
|---|---|
| An operation without a request | `missing request: POST /tasks` |
| A request that matches no operation | `orphan request: bruno/tasks/old.bru → DELETE /tasks/{}` |
| `body: json` that does not parse, misses a `required` property of the requestBody schema (`$ref` and `allOf` resolved), or is sent to an operation without requestBody | `invalid body: bruno/tasks/create-task.bru → missing required property "title" (POST /tasks)` |
| A request outside the folder its URL requires | `wrong folder: bruno/create-comment.bru → expected tasks/comments/ for POST /tasks/{taskId}/comments` |
| A `.bru` file that does not parse | `unreadable request: bruno/tasks/broken.bru → line 1: …` |

When clean it prints one line: `bruno drift: clean — 6 operations, 7 requests (1 in flows/)`.

**Matching.** Method plus normalized path. The URL loses any leading `{{variable}}` (such as `{{baseUrl}}`), scheme
and host, query string, fragment and trailing slash; Bruno `:param`, `{{param}}` and OpenAPI `{param}` segments all
become `{}`.

**Folder layout rule.** A request lives in the folder made of its path's **static segments**, joined by `/`:

| Path | Folder |
|---|---|
| `/health` | `health/` |
| `/tasks`, `/tasks/{taskId}` | `tasks/` |
| `/tasks/{taskId}/comments` | `tasks/comments/` |

**`flows/`.** Requests under the top-level `flows/` folder (multi-call sequences) must still match an operation, but
have no folder rule and do not count as an operation's request.

**JSON bodies.** Bruno variables (`{{name}}`) are replaced by `0` before parsing, so both `"{{title}}"` and
`{{count}}` are valid.

## `env`

Writes `<collection>/environments/<name>.bru` (overwriting it) from a flat JSON object of single-line string values,
keys sorted:

```
vars {
  baseUrl: http://localhost:3000
  token: local-test-token
}
```

Only the `local` environment holds generated test values, so any other name is refused unless `--force`.

## `scaffold`

Creates a request for every operation that has none: in the folder the layout rule requires, named after the
`operationId` in kebab-case (`createTask` → `create-task.bru`; without one, method + path:
`post-tasks-task-id-comments.bru`). It uses `auth: bearer` with `token: {{token}}` unless the operation's effective
`security` is `[]`, and writes a `body:json` skeleton with the required properties (first enum value, or `""`, `0`,
`false`, `[]`, `{}` by type). It never overwrites a file; a name that is taken is reported as skipped.

## Library

```ts
import { checkDrift, formatDriftProblem, parseBruFile, scaffoldRequests, writeEnvironment } from '@ligeirinho/bruno-tools';

const report = await checkDrift({ openapi: 'openapi.yaml', collection: 'bruno' });
report.problems.map(formatDriftProblem);
```

Also exported: `readHttpRequest`, `readCollection`, `loadApiOperations`, `compareCollection`,
`ensureGeneratedValuesAllowed`, `readEnvironmentValues`, the result types and the typed errors
(`BrunoToolsError` and subclasses).
