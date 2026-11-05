# ligeirinho

Processo de desenvolvimento opinativo e proporcional para o [Claude Code](https://claude.com/claude-code).
Nasceu para substituir o Spec Kit: menos documento, mais loop de teste, telas reais como referência.

- **Proporcional:** dúvida só responde; ajuste pequeno faz, testa e commita; feature passa por
  clarify → plano → preview → build → fechamento.
- **Transparente:** o repositório tem `.ligeirinho.yml` e qualquer sessão do Claude Code já segue o fluxo.
- **Super opinativo:** as [regras](rules/README.md) vêm prontas, cada uma com o porquê e quem cobra.

## Usar num projeto

No `.claude/settings.json` do projeto:

```json
{
  "extraKnownMarketplaces": {
    "ligeirinho": { "source": { "source": "github", "repo": "loliveirawebdev/ligeirinho" } }
  },
  "enabledPlugins": { "ligeirinho@ligeirinho": true }
}
```

E um `.ligeirinho.yml` na raiz ([formato](docs/ligeirinho-yml.md)). Ou peça ao Claude: "adota o ligeirinho aqui".

## Conteúdo

| Pasta | O quê |
|---|---|
| [`rules/`](rules/) | regras de arquitetura, MVVM, código, testes, segurança, escala, responsivo, REST, e2e, Bruno, docs, stack |
| [`skills/`](skills/) | `feature`, `clarify`, `plan`, `preview`, `build`, `parallel`, `close`, `init` |
| [`hooks/`](hooks/hooks.json) + [`scripts/`](scripts/) | fluxo no início da sessão, testes antes do commit, view pura, gate e nota no fechamento |
| [`docs/`](docs/) | [como funciona](docs/como-funciona.md), [formato do `.ligeirinho.yml`](docs/ligeirinho-yml.md) |
| [`HANDOFF.md`](HANDOFF.md) | as decisões que originaram o processo e o que falta construir |

## Status

Passos 1 e 2 da construção (regras e plugin) prontos para revisão. Faltam o `template/` e os pacotes
(previewer, eslint-config, spectral-ruleset, jscpd-config, bruno-tools, e2e-kit) e o piloto num projeto real.
