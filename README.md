# ligeirinho

Um jeito de trabalhar com o [Claude Code](https://claude.com/claude-code) em que você só conversa e ele segue um
processo de desenvolvimento pronto: pergunta o que precisa, planeja, testa, commita e documenta, sem você ter que
pedir.

Nasceu de uso pessoal: eu estava usando o Spec Kit num projeto meu e gostava do resultado, mas o processo ficava
muito lento e gerava muita coisa que não fazia sentido pra mim. O ligeirinho é a minha tentativa de manter o que
funcionava e deixar o resto de lado.

## O que muda no dia a dia

O Claude olha o tamanho do que você pediu e trabalha do tamanho certo:

- **Você fez uma pergunta** ("como funciona o login?"): ele só responde. Não mexe em código.
- **Você pediu um ajuste pequeno** ("muda o texto desse botão", "corrige esse bug"): ele escreve um teste, faz a
  mudança, confere que os testes passam e commita. Sem burocracia.
- **Você pediu uma feature** ("quero que o organizador convide pessoas pra equipe"): ele segue cinco etapas:
  1. **Perguntas** — antes de qualquer código, pergunta o que muda no produto, uma pergunta por vez, sempre
     sugerindo uma resposta.
  2. **Plano** — mostra um plano curto (regras, rotas, telas, riscos, testes) e espera você aprovar.
  3. **Telas** — monta as telas novas de verdade e mostra lado a lado no celular, tablet e desktop pra você
     aprovar.
  4. **Construção** — faz em pedaços: teste primeiro, depois o código, testes verdes, commit. Pedaços que não
     dependem um do outro podem rodar em sessões paralelas.
  5. **Fechamento** — roda todas as verificações, revisa tudo contra as regras e escreve a documentação.

Você só entra pra decidir: responder as perguntas, aprovar o plano, aprovar as telas e liberar o push.

## As regras

O Claude segue as [regras do ligeirinho](rules/README.md) sem você precisar pedir: arquitetura em camadas, nomes
claros, tipagem estrita, testes antes do código, segurança "nega tudo até liberar", telas que funcionam no
celular, e por aí vai. Cada regra explica por que existe e o que garante que ela seja cumprida (lint, teste ou
revisão).

Algumas são garantidas na hora por hooks:

- não dá pra commitar com teste falhando;
- componente de tela (`*.view.ts`) não pode buscar dado nem usar serviço;
- uma feature não termina sem as verificações passando e sem a documentação escrita.

## Como usar num projeto

Peça ao Claude dentro do projeto: **"adota o ligeirinho aqui"**.

Ou faça à mão. Coloque isto no `.claude/settings.json` do projeto (assim quem clonar já recebe o plugin):

```json
{
  "extraKnownMarketplaces": {
    "ligeirinho": { "source": { "source": "github", "repo": "loliveirawebdev/ligeirinho" } }
  },
  "enabledPlugins": { "ligeirinho@ligeirinho": true }
}
```

E crie um `.ligeirinho.yml` na raiz dizendo quais comandos rodam os testes e as verificações
([formato](docs/ligeirinho-yml.md)). Projeto sem esse arquivo não é afetado pelo plugin.

## O que tem aqui

| Pasta | O quê |
|---|---|
| [`rules/`](rules/) | as regras, uma por assunto |
| [`skills/`](skills/) | as instruções de cada etapa (perguntas, plano, telas, construção, fechamento) |
| [`hooks/`](hooks/hooks.json) e [`scripts/`](scripts/) | as travas automáticas |
| [`docs/`](docs/) | [como funciona por dentro](docs/como-funciona.md) e o [formato do `.ligeirinho.yml`](docs/ligeirinho-yml.md) |
| [`HANDOFF.md`](HANDOFF.md) | as decisões que deram origem ao ligeirinho e o que falta construir |

## Status

Regras e plugin prontos pra revisão. Ainda faltam o template de projeto novo (Nx + NestJS + Angular + Prisma em
Docker), os pacotes compartilhados (previewer de telas, configs de lint, checagens da API) e um projeto piloto.
