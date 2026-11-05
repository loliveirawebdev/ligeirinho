---
name: close
description: Fecha uma feature do ligeirinho - gate verde, e2e das jornadas tocadas, revisão do diff inteiro contra as regras, nota da feature e doc da área atualizado. Use depois que todos os pedaços do build estão commitados.
---

# Fechamento

O hook de fim de sessão não deixa encerrar enquanto a feature estiver em `fechamento` sem gate verde no commit
atual e sem a nota.

## Passos

1. **Revisão do diff inteiro** da feature (`git diff <base>...HEAD`) contra as regras, com o checklist do build e
   mais:
   - repetição **por significado** com o resto do repo (o que o jscpd não pega): procure funções, componentes e
     regras parecidas fora do diff;
   - todo item da lista de testes do plano existe;
   - toda rota nova tem os testes de autorização; jornada crítica nova tem e2e;
   - nenhuma regra ficou fora do doc da área.
   Corrija o que achar (com teste, se for comportamento) e commite.
2. **Doc da área** (`docs/areas/<area>.md`): se a feature mudou regra, **edite no lugar**, com o porquê. Apague
   o que ficou falso. Nada de "a partir de X mudou".
3. **Nota da feature** (`docs/features/NNN-nome.md`), ~1 página: Pedido · Clarify · Decisões (e o porquê) ·
   Contrato · Áreas (links). Sem regras. Se desfez decisão de feature antiga, marque lá "substituída por
   [NNN-nome](NNN-nome.md)".
4. **CLAUDE.md**: só se surgiu algo específico do projeto (comando novo, integração nova). Nada de resumo da
   feature.
5. Commite docs **no mesmo commit** da mudança de regra quando der; senão, num commit `docs(area): …` logo em
   seguida.
6. **Gate**: rode `scripts/gate.sh` (lock da máquina e carimbo). Vermelho → corrija, commite, rode de novo.
7. Com o gate verde, rode `scripts/estado.sh --limpar`.
8. Conte ao Lucas em poucas linhas o que foi feito e pergunte se pode fazer push. **Nunca faça push sem ele
   pedir.**
