# @ligeirinho/eslint-config

ESLint flat config that enforces the **lint** half of the [ligeirinho rules](../../rules/README.md). Needs ESLint 10
and TypeScript `>=5.8 <6.1`.

```js
// eslint.config.mjs
import { base, angular, nest, playwright, boundaries } from '@ligeirinho/eslint-config';

export default [
  ...base({ tsconfigRootDir: import.meta.dirname, adoption: false }),
  ...angular({ files: ['apps/web/**/*.ts'], templates: ['apps/web/**/*.html'], designSystemPaths: ['libs/ui/**'] }),
  ...nest({ files: ['apps/api/**/*.ts', 'libs/**/api/**/*.ts'] }),
  ...playwright({ files: ['apps/e2e/**/*.ts'] }),
  ...boundaries({ areas: ['tasks'] }),
];
```

Every factory takes `adoption?: boolean`. With `true`, its errors become warnings (projects in adoption, see
[rules/README.md](../../rules/README.md)).

`base` and `angular` also take `vendoredPaths?: string[]` (default `['libs/ui/spartan/**']`): generated code the
project doesn't own. There, `base` keeps only the correctness presets (`@eslint/js` recommended and
strict-type-checked) and drops stylistic, naming, size, file-name and `@ligeirinho` rules; `angular` drops all its
rules.

## Factories and the rules they enforce

| Factory | Rules | Enforces |
|---|---|---|
| `base({ tsconfigRootDir })` | `typescript-eslint` strict-type-checked + stylistic-type-checked; `no-explicit-any`, `no-non-null-assertion`, `consistent-type-assertions` (never; `as const` allowed), `only-throw-error`, `no-empty`, `no-warning-comments`, `no-unused-vars` | [code.md](../../rules/code.md) |
| | `id-denylist` (x, data, tmp, temp, res, resp, item2, aux, obj, val, info, usr, qty, cfg, cb, e, err), `naming-convention` | [code.md](../../rules/code.md) names |
| | `max-lines-per-function` 40 (not in tests), `max-depth` 2, `complexity` 8, `max-params` 3 | [code.md](../../rules/code.md) small functions |
| | `@ligeirinho/no-new-error` (outside `/infrastructure/`) | [code.md](../../rules/code.md) typed errors |
| | `check-file` kebab-case files and folders, `@ligeirinho/no-generic-names` (utils, helpers, helper, manager, common, misc), no `*Manager`/`*Utils`/`*Helper` classes | [architecture.md](../../rules/architecture.md) |
| | `@ligeirinho/no-vi-mock` in tests (outside `/infrastructure/`) | [testing.md](../../rules/testing.md) |
| `angular({ files, templates, designSystemPaths?, rawElements?, designSystemAttributes?, vendoredPaths? })` | `angular-eslint` TS + template recommended + accessibility; `prefer-signals`, `prefer-output-readonly`, `prefer-output-emitter-ref` | [mvvm.md](../../rules/mvvm.md) signals |
| | `*.view.ts`: `@ligeirinho/no-inject-in-view`, `@ligeirinho/no-constructor-dependencies-in-view` | [mvvm.md](../../rules/mvvm.md) pure view |
| | `*.view-model.ts`: `no-restricted-imports` of `@angular/*` | [mvvm.md](../../rules/mvvm.md) view-model |
| | templates (and inline templates): `@ligeirinho/no-raw-elements` (button, input, select, textarea, table, dialog), off in `designSystemPaths`; allowed anywhere when the element carries an attribute or input matching `designSystemAttributes` (default `[/^mat/i]`: Angular Material's `<button matButton>`, `<input matInput>`, `<table mat-table>`) | [mvvm.md](../../rules/mvvm.md) raw elements |
| `nest({ files })` | `*.controller.ts` can't import `/infrastructure/`; `/domain/` can't import Nest, Prisma, Express, Fastify; `/application/` can't import Prisma; `@ligeirinho/no-system-clock` in domain and application | [architecture.md](../../rules/architecture.md) |
| `playwright({ files })` | `eslint-plugin-playwright` recommended, `no-wait-for-timeout`, `prefer-native-locators`, `@ligeirinho/no-css-class-locator` | [e2e.md](../../rules/e2e.md) |
| `boundaries({ areas, files? })` | `@nx/enforce-module-boundaries`: domain → domain; application → domain, application; infrastructure → domain, application, infrastructure; presentation → domain, application, presentation, `type:ui`; `type:app` and `type:e2e` → anything; `type:ui` → `type:ui`; `area:<name>` → itself, `area:shared` and `type:ui`; `area:shared` → itself and `type:ui`. Tool configs (`*.config.*`) are skipped | [architecture.md](../../rules/architecture.md) |

The `@ligeirinho/*` rules live in the exported `ligeirinhoPlugin`. They are separate rules instead of
`no-restricted-syntax` selectors because `no-restricted-syntax` is one rule key: two configs that touch the same
file (base + view, base + test) would overwrite each other's selectors.
