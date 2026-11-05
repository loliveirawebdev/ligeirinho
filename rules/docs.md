# Docs

## Regra vive num lugar só: o doc da área

`docs/areas/<area>.md` tem as regras **atuais** da área e o porquê de cada uma. Mudou a regra, **edita no
lugar**. Proibido acrescentar "a partir de X mudou" embaixo do texto velho.

**Por quê:** quem lê (pessoa ou Claude) precisa saber como é hoje, não reconstruir a história. No Plidio, regra
espalhada em specs fez sessões reaprenderem contexto toda vez.

**Quem cobra:** checklist do fechamento: se a feature mudou regra, o doc da área foi editado **no mesmo commit**
e não sobrou trecho dizendo o contrário.

## Nota da feature

`docs/features/NNN-nome.md`, mais ou menos uma página:

1. **Pedido** — o que o Lucas pediu, nas palavras dele.
2. **Clarify** — perguntas e respostas.
3. **Decisões** — o que foi decidido e por quê (inclusive o que o Claude decidiu sozinho).
4. **Contrato** — rotas, campos, erros (ou link para o OpenAPI).
5. **Áreas** — link para o doc de cada área tocada.

A nota **não guarda regra** (regra é no doc da área). Se uma decisão for desfeita depois, a nota ganha
"substituída por [NNN-outra](NNN-outra.md)" ao lado da decisão.

**Quem cobra:** o hook de fim de sessão não deixa encerrar o fechamento sem a nota.

## CLAUDE.md do projeto enxuto

Só três coisas:

1. "Este repo usa o ligeirinho."
2. Comandos de `make`.
3. O que é específico do projeto (domínio em uma frase, integrações externas, armadilhas conhecidas).

Todo o resto vem do plugin. Nada de resumo de feature no CLAUDE.md.

**Por quê:** no Plidio o CLAUDE.md chegou a 881 linhas porque cada spec acrescentou o resumo de si e ninguém
reescreveu.

**Quem cobra:** checklist do fechamento: CLAUDE.md cresceu? Tem que ser coisa específica do projeto, senão vai
para o doc da área.
