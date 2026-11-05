# Supported agents

Ligeirinho is plain files: a flow ([FLOW.md](../FLOW.md)), [rules](../rules/), [skills](../skills/) in the
`SKILL.md` format and bash [scripts](../scripts/). Each agent gets a thin layer on top.

| | Claude Code | Codex | Antigravity |
|---|---|---|---|
| Manifest | `.claude-plugin/plugin.json` | `plugin.json` | `plugin.json` |
| Marketplace | `.claude-plugin/marketplace.json` | `.agents/plugins/marketplace.json` | — (installs from the GitHub URL) |
| Skills | `skills/` | `skills/` | `skills/` |
| Hooks | `hooks/hooks.json` | `hooks/hooks.json` (same file) | `hooks.json` (its own format) |
| Status | scripts tested with sample payloads | scripts tested with sample payloads | scripts tested with sample payloads |

The scripts detect which agent called them from the payload and answer in that agent's format, so the logic lives
in one place.

## Claude Code

In the project's `.claude/settings.json` (everyone who clones the repo gets the plugin when they trust the folder):

```json
{
  "extraKnownMarketplaces": {
    "ligeirinho": { "source": { "source": "github", "repo": "loliveirawebdev/ligeirinho" } }
  },
  "enabledPlugins": { "ligeirinho@ligeirinho": true }
}
```

Or install it by hand:

```
/plugin marketplace add loliveirawebdev/ligeirinho
/plugin install ligeirinho@ligeirinho
```

## Codex

1. Clone this repository and open it in Codex once: its repo marketplace makes the plugin show up in `/plugins`.
   Install it from there.
2. Enable it in the project's `.codex/config.toml`:

   ```toml
   [plugins."ligeirinho@ligeirinho"]
   enabled = true
   ```

3. Review and trust the hooks with `/hooks`.

Codex currently runs plugin hooks only for plugins installed manually in the Codex desktop app. Where hooks don't
run, the skills still work and the project's `AGENTS.md` tells the agent to run the checks itself (the `init` skill
adds that line).

## Antigravity

```
agy plugin install https://github.com/loliveirawebdev/ligeirinho
```

Antigravity runs plugin hooks with the plugin root as the working directory and sends a camelCase payload
(`toolCall`, `workspacePaths`); the root `hooks.json` and the scripts handle that. The argument names of its file
edit tools aren't documented, so the pure-view hook looks for a `.view.ts` path in any argument.

## Any other agent

Point it at [FLOW.md](../FLOW.md) and [rules/](../rules/) from the project's `AGENTS.md`. Without hooks, the agent
runs `commands.test` before each commit and `scripts/gate.sh` at the close by itself.
