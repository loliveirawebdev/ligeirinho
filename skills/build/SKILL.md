---
name: build
description: Constrói a feature aprovada do ligeirinho por pedaços, cada um no loop teste que falha → código → testes verdes → checklist no diff → commit. Use depois do plano (e do preview) aprovados, ou para um ajuste pequeno.
---

# Build

## Loop por pedaço

Para cada pedaço do plano, na ordem (os independentes podem ir para `ligeirinho:parallel`):

1. **Teste que falha.** Escreva os testes do pedaço que estão na lista do plano, pelo comportamento público. Rode
   e veja falhar pelo motivo certo.
2. **Código.** O mínimo para passar, seguindo as camadas (`rules/arquitetura.md`) e o MVVM (`rules/mvvm.md`).
   Fakes em vez de mocks.
3. **Testes do pedaço verdes.** Rode `comandos.teste` do `.ligeirinho.yml`.
4. **Checklist no diff** (abaixo). Corrija o que falhar.
5. **Commit.** Mensagem curta no formato `tipo(area): o que mudou` (ex.: `feat(inscricoes): cancelar com
   estorno`). O hook roda os testes antes; se barrar, corrija e tente de novo. Nunca contorne o hook.

Um pedaço por commit. Nada de commit com teste vermelho, nada de "arrumo depois".

## Checklist no diff (antes de cada commit)

Rode `git diff --staged` e confira:

- [ ] Nomes explícitos, na língua do negócio; nada de `data`, `tmp`, `res`, `aux`, abreviação.
- [ ] Sem `any`, `!`, cast de "confia em mim".
- [ ] Validação só na borda; erro tipado, nenhum `catch` que esconde.
- [ ] Funções pequenas; nenhum booleano que muda comportamento.
- [ ] Dependências só para dentro; view sem serviço; regra de apresentação no view-model.
- [ ] Nada repetido (literal ou por significado) com o que já existe no repo: procure antes de criar.
- [ ] Sem `utils`/`helpers`/`manager` novo.
- [ ] Rota nova: negada por padrão, teste de quem pode e quem não pode, contrato igual ao plano.
- [ ] Listagem paginada; consulta nova com índice; sem N+1.
- [ ] Segredo fora do código, do log e da URL; operação sensível com auditoria.
- [ ] Sem código morto, sem TODO, comentário só para o porquê.
- [ ] Elementos crus só no design system; nada dependente de hover; alvo de toque ≥ 44 px.

## Dúvida no meio

Surgiu dúvida que muda produto? Pare e pergunte (formato do clarify). Detalhe técnico: decida e anote para a
nota da feature.

## Fim do build

Com todos os pedaços commitados, rode `scripts/estado.sh NNN-nome fechamento` e siga para `ligeirinho:close`.
Ajuste pequeno (sem feature) termina no commit.
