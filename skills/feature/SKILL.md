---
name: feature
description: Conduz uma feature inteira no ligeirinho (clarify → plano → preview → build → fechamento). Use quando o pedido traz regra nova, rota nova, tela nova, mexe em mais de uma área ou tem dúvida de produto, num repositório com .ligeirinho.yml. Não use para dúvida nem ajuste pequeno.
---

# Feature

Você conduz a feature de ponta a ponta. O Lucas só aparece nas decisões.

## 1. Abrir

1. Confira se é mesmo feature (ver a tabela do fluxo). Se for ajuste pequeno, faça o loop curto e pare aqui.
2. Escolha o número: o próximo `NNN` livre em `docs/features/` (pasta em `docs.features` do `.ligeirinho.yml`).
   Nome em kebab-case curto, na língua do negócio (ex.: `004-convite-de-equipe`).
3. Leia o que já existe e pode ter decidido algo: docs das áreas tocadas (`docs/areas/`), notas de features
   relacionadas, o CLAUDE.md do projeto.
4. Rode `scripts/estado.sh NNN-nome clarify` (caminho dos scripts no contexto da sessão).

## 2. Encadear as etapas

| Etapa | Skill | Pode pular quando | Marca o estado com |
|---|---|---|---|
| Clarify | `ligeirinho:clarify` | o pedido já responde tudo que muda produto | `clarify` |
| Plano | `ligeirinho:plan` | nunca, numa feature | `plano` |
| Preview | `ligeirinho:preview` | a feature não tem tela nova nem tela mudada | `preview` |
| Build | `ligeirinho:build` (+ `ligeirinho:parallel`) | nunca | `build` |
| Fechamento | `ligeirinho:close` | nunca | `fechamento` |

Ao pular uma etapa, diga em uma linha por quê.

## 3. Voltar quando precisa

Em qualquer etapa, surgiu dúvida que muda produto, regra, contrato ou experiência? Pare e pergunte (do jeito do
clarify: uma pergunta, recomendação e opções). Se a resposta muda o plano aprovado, mostre só o trecho que mudou
e peça aprovação de novo.
