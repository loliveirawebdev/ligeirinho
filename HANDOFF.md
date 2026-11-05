# Ligeirinho — handoff

Processo de desenvolvimento reaproveitável para todos os projetos do Lucas, pensado para trabalhar com o Claude
Code. Nasceu de uma conversa em 2026-11-05, no projeto Plidio, depois de sentir que o Spec Kit pesava demais
(9 documentos e ~550–770 linhas por spec, sessões reaprendendo contexto, tela feita duas vezes: board e código).

**Status:** passos 1 e 2 da §14 construídos (`rules/`, skills e hooks do plugin). Falta revisar as regras, decidir o §13 e fazer o passo 3 (`template/` + pacotes).

Responder ao Lucas em português (PT-BR). Ele quer um processo **super opinativo**: as regras vêm prontas, ele não
deve ter que pedir qualidade, segurança ou testes.

---

## 1. O que o Lucas gostou do fluxo antigo (manter)

1. **Loop de implementação e testes** — teste → código → testes verdes → commit, em pedaços. Deixa o código
   previsível.
2. **Clarify** — perguntas antes de planejar. Já evitou muito problema.
3. **Design first** — ver as telas lado a lado ajuda. O problema era ser lento (desenhar no canvas e depois
   reconstruir no código).

## 2. O que sai

- Spec Kit e seus comandos "definitivos" (mesma sequência e mesmos arquivos para qualquer tamanho de tarefa).
- Documentos que ninguém relê (research, data-model, quickstart, checklists).
- Canvas como referência das telas (vira só rascunho).
- Comparação visual board × tela (a referência é o próprio código).
- Access matrix de rotas (os testes de autorização de cada rota bastam).
- Script próprio de repetição (`find_repeats`): substituído por ferramentas prontas (ver §7).

---

## 3. Como o fluxo funciona: transparente

O repositório declara que usa o ligeirinho, e qualquer sessão do Claude Code nele já segue o fluxo. O Lucas só
conversa normalmente; ninguém precisa rodar comando.

- O projeto tem um `.ligeirinho.yml` e habilita o plugin no `.claude/settings.json` do repo (marketplace +
  plugin). Quem clonar recebe o plugin sozinho.
- Um hook de início de sessão vê o `.ligeirinho.yml` e carrega o fluxo e as regras. Sem esse arquivo, o plugin
  fica quieto.
- As skills disparam pelo pedido, **proporcionais ao tamanho**:
  - ajuste pequeno → faz, testa, commita;
  - feature → clarify → plano → preview das telas → build → fechamento;
  - dúvida → só responde.
- O Lucas só aparece nas decisões: respostas do clarify, aprovação do plano e das telas, push.
- Comandos (`/ligeirinho:clarify`, `:plan`, `:build`, `:close`, `:feature`) existem só como atalho manual.
- "Mais inteligente que o Spec Kit": proporcional, encadeável sem ser obrigatório, aproveita o contexto já
  decidido, e qualquer etapa volta a perguntar se surgir dúvida que muda o produto.

### Etapas

1. **Clarify** — **sem limite de perguntas**. Uma por vez, a mais importante primeiro, sempre com recomendação e
   opções. Para quando acabar o que muda produto, regra, contrato ou experiência. Detalhe técnico o Claude decide
   e conta no plano.
2. **Plano** — curto, aprovado pelo Lucas:
   - o que muda e por quê (regras de domínio);
   - contrato da API (rotas, campos, erros);
   - telas e seus view-models;
   - **riscos e padrões**: segurança, escala e zero trust (ver §5), **pesquisando na internet** como o problema
     costuma ser resolvido (padrões consagrados, docs oficiais, OWASP) e **citando as fontes**;
   - lista de testes (unidade, componente, e2e das jornadas tocadas);
   - pedaços independentes que podem rodar em paralelo.
3. **Preview** — as telas novas renderizadas no previewer com os cenários, lado a lado, para aprovação.
4. **Build** — por pedaço: teste primeiro → código → testes do pedaço verdes → commit. Pedaços independentes
   rodam em sessões paralelas (worktrees), cada uma recebendo o plano aprovado como brief, e são juntados no fim.
5. **Fechamento** — gate verde, e2e das jornadas tocadas, revisão do diff contra as regras (inclusive repetição
   por significado), nota da feature escrita, doc da área atualizado. Um hook impede encerrar sem gate verde e
   sem a nota.

---

## 4. Regras de código (super opinativas, cada uma com o porquê)

Cada regra tem que dizer por que existe e o que a cobra: lint, teste de arquitetura ou checklist aplicado pelo
build no diff antes de cada commit (e conferido de novo no fechamento).

**Arquitetura**
- Camadas fixas: domínio (regra pura, sem IO) → aplicação (casos de uso e portas) → infraestrutura
  (adaptadores) → apresentação (HTTP, views). Dependência só para dentro.
- Front em **MVVM real**: view pura (só recebe view-model e callbacks; não injeta serviço, não busca dado),
  view-model montado por função pura, página fina que busca e liga.
- Um dono por padrão: apareceu duas vezes, vira componente/módulo (regra de dois).
- Nada de `utils`, `helpers`, `manager`, **a não ser algo realmente genérico** (sem conceito do negócio), num
  lugar só e com nome explícito.

**Código**
- **Nomes significativos e explícitos** (clean code): nada de `x`, `data`, `tmp`, `res`, `item2`, `aux`,
  abreviação. Nomes na língua do negócio.
- Validação só na borda; dentro, os tipos garantem.
- Tipagem estrita: sem `any`, sem `!`, sem cast de "confia em mim".
- Erro explícito e tipado, nunca engolido.
- Funções pequenas, retorno antecipado; booleano que muda comportamento vira duas funções.
- Comentário só para o porquê.
- Sem código morto; sem TODO solto (vai para o backlog ou não existe).

**Testes**
- Teste antes, pelo comportamento público. Fakes em vez de mocks.
- **Os cenários do previewer são as mesmas fixtures dos testes** (e da seed do Bruno e do e2e).

---

## 5. Segurança, escala e zero trust

**Zero trust (filosofia de tudo)**
- Negar por padrão: rota, papel ou entidade nova não dá acesso a nada até ser liberada explicitamente.
- Verificar sempre: toda requisição autenticada e autorizada, inclusive entre serviços internos.
- Menor privilégio: cada token, usuário, serviço e conexão só com o que precisa.
- Validar em toda borda: API, filas, respostas externas, variáveis de ambiente na subida.
- Segredo nunca no código, em log ou em URL.
- Mudança sensível gera evento de auditoria.
- Toda rota nova tem teste de quem pode e quem não pode chamar.

**Referências que o plano consulta**: OWASP API Security Top 10 e ASVS.

**Escala**: listagem sempre paginada; índice para cada consulta nova; sem N+1; idempotência em operação
repetível; rate limit; cache só com regra clara de invalidação; trabalho pesado em fila; outbox para evento que
não pode se perder.

---

## 6. Telas, previewer e responsivo

- **As telas reais são a referência.** O previewer só monta as telas cruas com os cenários.
- **Previewer próprio** (não Storybook): rota só de desenvolvimento (ex.: `/__preview`); cenários num arquivo
  ao lado do componente (ex.: `lista-de-modalidades.scenarios.ts`: vazia, cheia, erro, só leitura), cada um um
  view-model de exemplo; agrupado por fluxo, lado a lado em **390, 768 e 1280**, claro e escuro, mais um modo
  com largura arrastável.
- **Canvas** (ou similar) só para rascunho e ideia solta.
- **Responsivo nas regras**: mobile first; layout fluido (sem largura fixa em px para colunas; `max-width` só
  para texto); container queries nos componentes; breakpoints só dos tokens; alvo de toque ≥ 44 px; nada que
  dependa de hover; tabela vira cartões no celular por um componente do design system.
- **Responsivo no gate** (propriedades, não imagem): Playwright abre cada cenário em cada largura e verifica sem
  rolagem horizontal, nenhum clicável cortado ou fora da tela, alvo de toque mínimo, e axe (acessibilidade).
  Tela nova ganha essa checagem só por ter cenários.

---

## 7. Qualidade automatizada

- **Lint estrito** (`@typescript-eslint` strict, regras de nome, limites entre camadas/módulos com
  `@nx/enforce-module-boundaries`).
- **Lint de template** (`@angular-eslint`): proíbe `<button>`, `<input>`, `<select>`, `<textarea>`, `<table>` e
  afins crus fora da biblioteca de componentes; componente de apresentação não injeta serviço.
- **jscpd** para código copiado; todo ignore exige comentário com o motivo.
- **REST check com Spectral** sobre o OpenAPI do Nest (`@nestjs/swagger`). Regras herdadas do Plidio
  (`tools/gates/rest_check.py` lá): segmentos em kebab-case; sem verbo no caminho (lista: approve, cancel,
  create, delete, send, verify, login…); sem nome de front/chamador no caminho (admin, backoffice, internal,
  public…); sem segredo em path/query (code, password, secret, token…); `POST` de criação com 201 e `Location`
  quando legível; exceções só por nome (`/oauth2/*`, `/health`, `/me`, `/.well-known/*`).
- **Revisão no fechamento**: o diff contra as regras, incluindo repetição por significado (o que jscpd não pega).

---

## 8. E2E

- Playwright, só **jornadas críticas** (login, convite e aceite, criar e ver na lista, permissão negada…), de
  ponta a ponta de verdade (front, API, banco), sem mock.
- Elementos por papel e texto acessível (`getByRole`), nunca por classe CSS. Sem `sleep`. Cada teste cria os
  próprios dados (rodam em paralelo). Trace guardado quando falha.
- Mesma seed do Bruno e do previewer.
- Roda na stack inteira em Docker com banco limpo: jornadas afetadas no `make check`, todas no gate completo e no
  CI, e `make e2e` sob demanda.
- O plano lista as jornadas tocadas; jornada crítica nova sem e2e não fecha.

---

## 9. API: Bruno

- Coleção Bruno no repo, pastas espelhando as URLs, um ambiente por lugar (`local`, `dev`, `prod`), segredos em
  `.env` fora do git.
- **Drift check no gate** contra o OpenAPI: rota sem request, request órfão ou inválido quebra.
- Pasta de fluxos (requests em sequência para fluxos com várias chamadas).
- Seed local que gera dados e tokens de teste e preenche o ambiente `local` (como o `make bruno-env` do Plidio).

---

## 10. Docs

- **Regra vive num lugar só: o doc da área** (`docs/areas/<area>.md`), com as regras atuais e o porquê,
  **editado no lugar**. Nunca acrescentar "a partir de X mudou" embaixo do texto velho.
- **Nota da feature** (`docs/features/NNN-nome.md`, ~1 página): pedido, perguntas e respostas do clarify,
  decisões e o porquê, contrato, link para o doc da área. **Não guarda regra.** Se uma decisão for desfeita
  depois, ganha "substituída por <feature>" com link.
- O fechamento confere que, se a feature mudou regra, o doc da área foi editado no mesmo commit e não sobrou
  trecho dizendo o contrário.
- **CLAUDE.md do projeto enxuto**: "este repo usa ligeirinho", comandos de make, o que é específico do projeto.
  Todo o resto vem do plugin. (No Plidio o CLAUDE.md chegou a 881 linhas porque cada spec acrescentou o resumo de
  si e ninguém reescreveu — é o que evitar.)

---

## 11. Stack (fixa)

- **Nx** (monorepo; cache e "só o afetado"; limites entre módulos)
- **NestJS** (um módulo por área do negócio, com domínio/aplicação/infra/apresentação; validação nos DTOs;
  OpenAPI pelo `@nestjs/swagger`)
- **Angular** (signals; `input()`/`output()`; view-model com `computed()`)
- **Postgres + Prisma** (Prisma só na infraestrutura, atrás das portas)
- **Vitest** no front e no back
- **Spartan** (shadcn para Angular)
- **Playwright** (responsivo e e2e)
- **Tudo em Docker** (host só com Docker e `make`)

### Docker (lições do Plidio)
- Uma imagem de ferramentas ("toolbox") com tudo fixado em versão exata.
- **Toolbox sempre de pé** durante o desenvolvimento; hooks e testes com `docker compose exec` (quase
  instantâneo). Container novo (`run --rm`) só no gate final e no CI. (No Plidio cada commit subia um container
  novo e custava segundos.)
- Dependências em volumes (`node_modules`, store do pnpm), nunca na pasta montada (lenta no Mac).
- Cache de tarefas compartilhado entre worktrees.
- Gate só do que mudou (Nx affected); mudança de infra roda tudo.
- **Lock da máquina** para os gates: um por vez entre sessões paralelas (senão estoura a memória da VM); avisa
  quando uma tarefa morre por falta de memória (exit 137) em vez de parecer bug.
- Concorrência limitada; o gate derruba o stack de dev antes de rodar; serviços de teste separados.

---

## 12. Estrutura proposta do repo

```
ligeirinho/
  .claude-plugin/        # plugin.json + marketplace.json
  skills/                # clarify, plan, preview/design, build, parallel, close
  hooks/                 # detecta .ligeirinho.yml; testes antes do commit; gate + nota antes de fechar;
                         #   barra componente de apresentação que injeta serviço
  rules/                 # regras de código, arquitetura, MVVM, testes, segurança, zero trust, responsivo — com o porquê
  packages/
    previewer/           # lib Angular: /__preview, grade lado a lado, larguras, tema
    eslint-config/
    spectral-ruleset/
    jscpd-config/
    bruno-tools/         # drift check + seed do ambiente local
    e2e-kit/             # convenções e helpers do Playwright (responsivo + jornadas)
  template/              # o que o init copia: Nx + Nest + Angular + Prisma + Vitest + Spartan, Docker,
                         #   Makefile, CLAUDE.md enxuto, .ligeirinho.yml
  docs/                  # adoção, atualização, como o fluxo funciona
```

Em cada projeto ficam: cenários do previewer (= fixtures), componentes Spartan, docs de área, notas de feature,
`.ligeirinho.yml`, CLAUDE.md curto.

**Adoção**
- Projeto novo: instalar o plugin, `/ligeirinho:init` numa pasta vazia, `make up`.
- Projeto existente: `init` em modo de adoção (só config, CLAUDE.md e lint; regras ainda não cumpridas entram
  como aviso e viram erro aos poucos).

---

## 13. Em aberto (decidir na próxima sessão)

1. **Pacotes versionados vs. cópia no `init`** para previewer e configs. Recomendação: pacotes para o que é
   processo (atualiza todos os projetos), cópia só para o que é do projeto. Isso faz do ligeirinho um monorepo
   Nx que publica pacotes.
2. **Projeto piloto**: um projeto real e pequeno para estrear o fluxo inteiro e ajustar o que incomodar.
3. Onde publicar os pacotes (npm público, GitHub Packages).
4. Formato exato do `.ligeirinho.yml` (comandos de teste/gate/preview, caminhos de docs, larguras).

## 14. Ordem sugerida de construção

1. `rules/` por escrito — o Lucas revisa antes de tudo.
2. As skills e hooks do plugin, lendo `rules/` e `.ligeirinho.yml`.
3. `template/` + pacotes, testado de ponta a ponta (`init` → `make up` → `make check` verde).
4. Piloto num projeto real; ajustar.

## 15. Pesquisa feita (referências)

- Mercado indo para "design que já é código": Onlook (canvas sobre o app real, gera PR; foco Next.js), Pencil.dev
  (canvas na IDE, `.pen` no repo), Paper, Subframe, Figma com agentes/MCP e Code Layers (beta).
- Consenso sobre spec-driven: proporcional à tarefa; plano curto confirmado passo a passo; spec exaustiva vira
  cascata.
- Não há ferramenta pronta de comparação mockup × página (descartado de qualquer forma).
- Fontes: analyticsindiamag.com (Figma Config 2026), modeinspect.com/blog/figma-alternatives-for-product-teams,
  docs.onlook.com, paper.design/compare/pencil, besthub.dev (SDD counterproductive),
  dev.to/tufailkhan457 (SDD com Claude Code), reflect.run/articles/visual-testing-in-playwright.
