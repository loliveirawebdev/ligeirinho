---
name: preview
description: Monta as telas novas da feature no previewer do projeto (/__preview) com os cenários, lado a lado em 390/768/1280, claro e escuro, e pede aprovação do Lucas. Use depois do plano aprovado quando a feature tem tela nova ou mudada.
---

# Preview

As telas reais são a referência. Nada de desenhar no canvas e reconstruir depois: a view que você escreve aqui é
a que vai para produção.

## Passos

1. Para cada tela do plano, escreva **primeiro** o view-model (`*.view-model.ts`, tipo + função pura) e os
   cenários (`*.scenarios.ts`), um view-model de exemplo por cenário. Os cenários são as fixtures dos testes
   (ver `rules/testes.md`).
2. Escreva a view (`*.view.ts` + `.html`): só `input()`/`output()`, só componentes do design system (Spartan e
   os do projeto), mobile first, sem largura fixa (ver `rules/mvvm.md` e `rules/responsivo.md`).
3. Registre os cenários no previewer, agrupados pelo fluxo da feature.
4. Suba o previewer (`comandos.preview` do `.ligeirinho.yml`) e abra no navegador embutido do Claude Code
   (`/__preview`), com o grupo da feature: lado a lado em 390, 768 e 1280, claro e escuro.
5. Confira você mesmo antes de mostrar: rolagem horizontal, texto cortado, alvo de toque pequeno, estado vazio
   e de erro com mensagem útil.
6. Mostre ao Lucas e peça aprovação. Ajuste até ele aprovar.

Ainda não ligue a página ao back: isso é do build. A view e o view-model aprovados entram no primeiro pedaço do
build com seus testes de componente.

Ao aprovar, rode `scripts/estado.sh NNN-nome build` e siga para `ligeirinho:build`.
