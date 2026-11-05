# Testes

## Teste antes, pelo comportamento público

O loop do build é sempre: **teste que falha → código → testes do pedaço verdes → commit**. O teste fala do que o
caso de uso, a função ou a tela fazem para quem usa, não de como fazem por dentro.

**Por quê:** é o que deixou o código previsível no fluxo antigo. Teste de detalhe interno quebra em refatoração
e não pega bug de comportamento.

**Quem cobra:** o build (skill) segue o loop; o **hook** de commit roda os testes antes de cada `git commit` e
barra se falharem; o fechamento confere que todo item da lista de testes do plano existe.

## Fakes em vez de mocks

Cada porta da aplicação tem um fake em memória (`RepositorioDeInscricoesEmMemoria`) que se comporta como o real.
Proibido `vi.mock` de módulo de aplicação ou domínio e asserção sobre "foi chamado com". Mock só para a borda
mais externa que não tem fake (ex.: relógio do sistema, se não houver porta).

**Por quê:** mock acopla o teste à implementação e passa mesmo quando o código real quebraria. Fake é reaproveitado
em todos os testes e no previewer.

**Quem cobra:** lint (`no-restricted-syntax` para `vi.mock` fora de `infrastructure`); checklist.

## Os cenários são as fixtures

Um cenário (`*.scenarios.ts`) é usado em quatro lugares:

1. teste de componente da view;
2. previewer (`/__preview`);
3. seed do Bruno (ambiente `local`);
4. dados do e2e.

Do lado do back, as fábricas de entidade de teste (`criarInscricaoDeTeste()`) moram em um só lugar por área e
alimentam teste de unidade, seed e e2e.

**Por quê:** um dado de exemplo só, que todo mundo vê. Se o previewer mostra, o teste testa.

**Quem cobra:** checklist do fechamento (tela nova sem cenário, ou teste com dado inline que já existe em
cenário/fábrica).

## O que cada tipo de teste cobre

| Tipo | Cobre | Ferramenta |
|---|---|---|
| Unidade | domínio, casos de uso (com fakes), view-models | Vitest |
| Componente | view com cada cenário: renderiza, emite outputs | Vitest + Angular Testing Library |
| Integração | adaptadores de infraestrutura contra Postgres real em Docker; autorização de cada rota | Vitest + Supertest |
| Responsivo | cada cenário em 390/768/1280 (ver [responsivo.md](responsivo.md)) | Playwright |
| E2E | jornadas críticas (ver [e2e.md](e2e.md)) | Playwright |

Toda rota nova tem teste de **quem pode e quem não pode** chamar (ver [seguranca.md](seguranca.md)).
