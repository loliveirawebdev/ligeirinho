# Como o ligeirinho funciona

## Transparente

1. O repositório tem `.ligeirinho.yml` e habilita o plugin no `.claude/settings.json` (marketplace + plugin).
   Quem clonar recebe o plugin sozinho ao confiar na pasta.
2. No início de cada sessão, o hook `SessionStart` vê o `.ligeirinho.yml` e coloca no contexto o fluxo
   ([FLUXO.md](../FLUXO.md)), o caminho das regras e a feature em andamento, se houver.
3. As skills disparam pelo pedido, proporcionais ao tamanho: dúvida só responde; ajuste pequeno faz, testa,
   commita; feature passa por clarify → plano → preview → build → fechamento.
4. Os comandos `/ligeirinho:feature`, `:clarify`, `:plan`, `:preview`, `:build`, `:parallel`, `:close` e
   `:init` existem como atalho manual.

## Hooks

| Hook | Quando | O que faz |
|---|---|---|
| `inicio-de-sessao.sh` | `SessionStart` | carrega o fluxo; diz a feature e a etapa em andamento |
| `antes-do-commit.sh` | `PreToolUse` em `Bash` com `git commit` | roda `comandos.teste`; barra o commit se falhar (avisa exit 137 como memória) |
| `view-pura.sh` | `PreToolUse` em `Write`/`Edit` de `*.view.ts` | barra `inject()` e construtor com dependência |
| `fim-de-sessao.sh` | `Stop` | com a feature em `fechamento`, não encerra sem gate verde no commit atual, árvore limpa e nota da feature |

## Scripts

- `scripts/estado.sh NNN-nome <etapa>` / `--limpar`: guarda a etapa em `.ligeirinho/estado.json`.
- `scripts/gate.sh [completo]`: roda o gate com lock da máquina (um gate por vez entre sessões paralelas), traduz
  exit 137 e grava `.ligeirinho/gate-verde` com o commit.

## Adoção

- **Projeto existente:** peça "adota o ligeirinho aqui" (skill `init`, modo adoção): `.ligeirinho.yml` com
  `adocao.ativa: true`, settings do plugin, docs de área e feature, CLAUDE.md enxuto.
- **Projeto novo:** `template/` ainda não existe (próximo passo da construção).

## Instalar à mão (sem o settings do repo)

```
/plugin marketplace add loliveirawebdev/ligeirinho
/plugin install ligeirinho@ligeirinho
```
