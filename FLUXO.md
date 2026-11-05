# Este repositório usa o ligeirinho

Responda ao Lucas em português (PT-BR). O processo é **super opinativo**: as regras em `rules/` valem sempre,
sem ninguém pedir qualidade, segurança ou testes. O Lucas só conversa; ninguém precisa rodar comando.

## Proporcional ao pedido

Antes de agir, classifique o pedido:

| Pedido | O que fazer |
|---|---|
| **Dúvida** (como funciona, por que, onde está) | só responde. Nada de plano nem commit. |
| **Ajuste pequeno** (um arquivo ou poucos, sem regra nova, sem rota nova, sem tela nova) | teste que falha → código → testes verdes → commit. Sem clarify nem plano, a não ser que surja dúvida que muda produto. |
| **Feature** (regra nova, rota nova, tela nova, mais de uma área, ou dúvida de produto) | skill `ligeirinho:feature`: clarify → plano → preview → build → fechamento. |

Na dúvida entre ajuste e feature, pergunte ao Lucas em uma frase.

## Etapas de uma feature (cada uma é uma skill)

1. **`ligeirinho:clarify`** — perguntas, uma por vez, a mais importante primeiro, sempre com recomendação e
   opções. Sem limite. Para quando acabar o que muda produto, regra, contrato ou experiência.
2. **`ligeirinho:plan`** — plano curto: regras de domínio, contrato da API, telas e view-models, riscos e
   padrões (pesquisados e com fontes), lista de testes, pedaços paralelos. O Lucas aprova.
3. **`ligeirinho:preview`** — telas novas no previewer com os cenários, lado a lado. O Lucas aprova.
4. **`ligeirinho:build`** — por pedaço: teste primeiro → código → testes verdes → checklist no diff → commit.
   Pedaços independentes podem ir para sessões paralelas (`ligeirinho:parallel`).
5. **`ligeirinho:close`** — gate verde, e2e das jornadas tocadas, revisão do diff contra as regras, nota da
   feature, doc da área atualizado.

As etapas se encadeiam, mas nenhuma é obrigatória quando não faz sentido (ex.: feature só de back não tem
preview). Aproveite o que já foi decidido na conversa e nas notas em `docs/features/`. **Qualquer etapa volta a
perguntar** se surgir dúvida que muda o produto.

## Onde o Lucas aparece

Só nas decisões: respostas do clarify, aprovação do plano, aprovação das telas e push. Detalhe técnico você
decide e conta no plano. **Nunca faça push sem ele pedir.**

## Hooks que já estão de pé

- Antes de cada `git commit`, os testes rápidos do projeto rodam; se falharem, o commit é barrado.
- Escrever `inject(` ou construtor com dependência em `*.view.ts` é barrado (view é pura).
- Com uma feature em fechamento, a sessão não encerra sem gate verde no commit atual e sem a nota da feature.
