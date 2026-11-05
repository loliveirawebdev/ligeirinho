---
name: init
description: Sets up a repository to use ligeirinho - creates .ligeirinho.yml, enables the plugin for Claude Code, Codex and Antigravity, trims the agent instructions file and creates docs/areas and docs/features. Use when the user asks to adopt ligeirinho in a project (new or existing).
---

# Init

## Existing project (adoption mode)

1. Read the Makefile, `package.json` and the agent instructions files (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`) to
   find the test, gate and preview commands.
2. Create `.ligeirinho.yml` (format in the plugin's `docs/config.md`) with `adoption.enabled: true` and the
   commands you found. Confirm the commands with the user.
3. Enable the plugin for each agent the team uses (see the plugin's `docs/agents.md`), preserving whatever is
   already in each file:
   - **Claude Code**: `.claude/settings.json` with `extraKnownMarketplaces` and `enabledPlugins`.
   - **Codex**: `.codex/config.toml` with `[plugins."ligeirinho@ligeirinho"] enabled = true`.
   - **Antigravity**: nothing in the repo; each person runs `agy plugin install
     https://github.com/loliveirawebdev/ligeirinho`.
4. Add to the top of `AGENTS.md` (create it if needed) the fallback for agents without the plugin or without hooks:
   ```markdown
   This repo uses [ligeirinho](https://github.com/loliveirawebdev/ligeirinho). Follow its flow
   (FLOW.md) and rules (rules/). If your agent has no ligeirinho hooks, run the test command from
   .ligeirinho.yml before every commit yourself.
   ```
5. Create `docs/areas/` and `docs/features/` (with a short `README.md` in each saying what goes there; see
   `rules/docs.md`).
6. Propose the lean instructions file (see `rules/docs.md`): "this repo uses ligeirinho", commands, what's
   specific. Whatever was an area rule goes to `docs/areas/<area>.md`. Show the before/after to the user before
   replacing it.
7. Add `.ligeirinho/` to `.gitignore`.
8. Lint and the configs from ligeirinho's packages come later, one area at a time, with unmet rules as warnings.

## New project

The `template/` (Nx + Nest + Angular + Prisma + Vitest + Spartan, Docker, Makefile) doesn't exist yet. For now, do
steps 2 to 7 with `adoption.enabled: false` and tell the user the template is ligeirinho's next step.
