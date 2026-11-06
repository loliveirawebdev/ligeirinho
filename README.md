# ligeirinho

A way of working with coding agents (Claude Code, Codex, Antigravity) where you just talk and the agent follows a
ready-made development process: it asks what it needs to know, plans, tests, commits and writes the docs, without
you having to ask.

It started as a personal thing: I was using Spec Kit on a project of mine and liked what came out of it, but the
process got really slow and produced a lot of stuff that didn't make sense for me. Ligeirinho is my attempt to keep
what worked and leave the rest behind.

## What changes day to day

The agent looks at the size of what you asked for and works at that size:

- **You asked a question** ("how does login work?"): it just answers. No code changes.
- **You asked for a small change** ("change this button's text", "fix this bug"): it writes a test, makes the
  change, checks the tests pass and commits. No ceremony.
- **You asked for a feature** ("I want organizers to invite people to their team"): it goes through five stages:
  1. **Questions** — before any code, it asks what changes in the product, one question at a time, always
     suggesting an answer.
  2. **Plan** — it shows a short plan (rules, routes, screens, risks, tests) and waits for your approval.
  3. **Screens** — it builds the new screens for real and shows them side by side on phone, tablet and desktop for
     you to approve.
  4. **Build** — it works in chunks: test first, then code, green tests, commit. Chunks that don't depend on each
     other can run in parallel sessions.
  5. **Close** — it runs every check, reviews everything against the rules and writes the docs.

You only step in to decide: answer the questions, approve the plan, approve the screens and give the go-ahead to
push.

## The rules

The agent follows [ligeirinho's rules](rules/README.md) without you asking: layered architecture, clear names,
strict typing, tests before code, "deny everything until allowed" security, screens that work on phones and look
designed (not generated), and so on.
Each rule explains why it exists and what makes sure it's followed (lint, a test or a review).

Some are enforced on the spot by hooks:

- you can't commit with failing tests;
- a screen component (`*.view.ts`) can't fetch data or use services;
- a feature can't finish without the checks passing and the docs written.

## Using it in a project

**New project:** from a clone of this repository (needs only Docker and make):

```sh
scripts/init.sh ../my-app
cd ../my-app && make up && make check
```

You get a working app (a small task list) with everything already set up: Nx, NestJS, Angular with Spartan,
Prisma and Postgres, Vitest, Playwright, the lint and API checks, a Bruno collection, and the plugin enabled for
each agent. Everything runs in Docker. Details in [template.md](docs/template.md).

**Existing project:** ask the agent inside it: **"adopt ligeirinho here"**.

Or do it by hand: create a `.ligeirinho.yml` at the root saying which commands run the tests and the checks
([format](docs/config.md)), and enable the plugin for your agent ([how, per agent](docs/agents.md)). Projects
without that file aren't affected by the plugin.

## What's in here

| Folder | What |
|---|---|
| [`FLOW.md`](FLOW.md) | the flow the agent follows, loaded at the start of every session |
| [`rules/`](rules/) | the rules, one file per topic |
| [`skills/`](skills/) | the instructions for each stage (questions, plan, screens, build, close) |
| [`scripts/`](scripts/) and the hook configs | the automatic guards, shared by every agent, plus `init.sh` |
| [`template/`](template/) | the starting point for new projects |
| [`packages/`](packages/) | the tools the rules need: screen previewer, lint, API and copy-paste checks, Bruno and e2e helpers |
| [`docs/`](docs/) | [supported agents](docs/agents.md), [how it works inside](docs/how-it-works.md), the [`.ligeirinho.yml` format](docs/config.md) and [the template](docs/template.md) |

## Status

The rules, the plugin, the template and the packages are ready for review. A project created with `init.sh` passes
`make check` (lint, types, unit, integration and e2e tests, responsive checks, API contract) in Docker. The hooks
were tested with each agent's payload format, but only outside the real agents so far. The packages are published as
[GitHub Release](https://github.com/loliveirawebdev/ligeirinho/releases) tarballs. Still missing: a pilot project.

## Credits

The design rules ([rules/design.md](rules/design.md)) adapt, for real app screens, the craft rules in Benji Taylor's
[stageshow](https://github.com/benjitaylor/skills/tree/main/stageshow) skill (MIT).
