---
name: clarify
description: Faz as perguntas de produto antes de planejar, uma por vez, com recomendação e opções. Use no começo de uma feature do ligeirinho, ou em qualquer etapa quando surgir dúvida que muda produto, regra, contrato ou experiência.
---

# Clarify

Pergunte antes de planejar. Já evitou muito problema.

## Regras

1. **Uma pergunta por vez.** A mais importante primeiro: a que, respondida diferente, mais muda o resto.
2. **Sempre com recomendação e opções.** Formato:
   > **Pergunta:** quem pode cancelar uma inscrição paga?
   > **Recomendo:** só o organizador, com estorno automático, porque … (cite a fonte se for padrão de mercado).
   > **Opções:** (a) só o organizador · (b) organizador e o próprio inscrito até X dias antes · (c) outra
   Use a ferramenta de pergunta do Claude Code (`AskUserQuestion`) quando ela existir, com a recomendação como
   primeira opção.
3. **Sem limite de perguntas.** Pare quando acabar o que muda **produto, regra, contrato ou experiência**.
4. **Detalhe técnico não é pergunta.** Biblioteca, nome de tabela, estrutura de pasta: você decide e conta no
   plano.
5. **Aproveite o que já foi decidido.** Antes de perguntar, procure a resposta no doc da área, nas notas de
   feature e na conversa. Se achou, não pergunte; cite de onde veio no plano.
6. Pergunte também o que as regras obrigam a decidir e o pedido não diz: quem pode e quem não pode (zero
   trust), o que é operação sensível (auditoria), o que acontece em repetição (idempotência), estados vazios e
   de erro das telas.

## Saída

Guarde perguntas e respostas para a seção **Clarify** da nota da feature (`docs/features/NNN-nome.md`). Pode
criar a nota já agora com **Pedido** e **Clarify** preenchidos.

Ao terminar, siga para `ligeirinho:plan` e rode `scripts/estado.sh NNN-nome plano`.
