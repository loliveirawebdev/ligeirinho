---
name: parallel
description: Distribui os pedaços independentes do plano aprovado do ligeirinho em sessões paralelas, cada uma no seu worktree, e junta tudo no fim. Use no build quando o plano tem dois ou mais pedaços que não dependem um do outro nem mexem nos mesmos arquivos.
---

# Pedaços em paralelo

## Quando vale

Dois ou mais pedaços que: não precisam do resultado um do outro, não mexem nos mesmos arquivos e podem ser
commitados separados. Se sobra só um, faça aqui mesmo.

## Brief de cada sessão

Cada sessão nasce num worktree próprio, a partir do commit atual, e recebe como brief:

1. "Este repo usa o ligeirinho. Faça só o pedaço abaixo, no loop do `ligeirinho:build`."
2. O **plano aprovado inteiro** (para contexto) e, destacado, **o pedaço dela**: o que muda, os testes, os
   arquivos que pode tocar.
3. "Não mexa em arquivo fora do pedaço. Não faça push. Ao terminar, responda com o nome do branch e a lista de
   commits."

## Recursos da máquina

O `gate.sh` tem lock: só um gate roda por vez na máquina, os outros esperam. Os testes rápidos (`comandos.teste`)
rodam no toolbox de pé, com `docker compose exec`. Se algo morrer com exit 137, é memória: espere o outro
terminar, não cace bug.

## Juntar

Quando todas terminarem:

1. Confira o diff de cada branch contra o pedaço do plano.
2. Junte os branches no branch da feature, um por vez, rodando `comandos.teste` depois de cada um.
3. Conflito: resolva preservando os dois pedaços e rode os testes de novo.
4. Siga para o fechamento.
