# @ligeirinho/jscpd-config

Copy-paste detection for [architecture.md "One owner per pattern"](../../rules/architecture.md): jscpd 4.3.0 with
ligeirinho's shared config, plus a check that every ignore says why.

```sh
ligeirinho-jscpd            # the whole project
ligeirinho-jscpd apps libs  # some paths
```

Exits 1 when:

1. jscpd finds **any** clone (`minTokens: 50`, threshold 0). Test files are checked too.
2. a `jscpd:ignore-start` has no reason on the same line. Accepted forms:
   `// jscpd:ignore-start — <reason>`, `// jscpd:ignore-start -- <reason>`, `// jscpd:ignore-start: <reason>`
   (also inside `/* */`, `<!-- -->` and `#` comments).

## Config

The shared config is [`jscpd.json`](jscpd.json) (also exported as `@ligeirinho/jscpd-config/jscpd.json`). It ignores
`node_modules`, `dist`, `coverage`, `.nx`, `.angular`, generated code (`*.generated.ts`, `generated/`), `prisma/migrations`,
lockfiles and JSON (Nx and tsconfig files repeat by design; the rule of two is about code).

A `.jscpd.json` in the folder the command runs from is merged on top: its `ignore` entries are **added** to the
shared ones, every other key overrides. Each added ignore should have a reason in the project's `.ligeirinho.yml`.

## API

`runLigeirinhoJscpd({ targetPaths, projectDir, reportProblem })` returns the exit code;
`linesWithIgnoreWithoutReason(source)`, `findIgnoresWithoutReason(paths, ignores)`, `loadJscpdOptions(projectDir)`
and `findDuplicates(options, paths)` are the pieces it is built from.
