#!/usr/bin/env bash
# Stop: com uma feature na etapa de fechamento, não deixa encerrar sem
#   1. gate verde no commit atual, com a árvore limpa;
#   2. a nota da feature em docs/features/.
# Fora do fechamento, não interfere (o Claude precisa parar para perguntar no clarify, no plano etc.).
set -euo pipefail
source "$(dirname "$0")/lib.sh"

projeto_usa_ligeirinho || exit 0

entrada="$(cat)"
[ "$(jq -r '.stop_hook_active // false' <<<"$entrada")" = "true" ] && exit 0

[ "$(ler_estado etapa)" = "fechamento" ] || exit 0

feature="$(ler_estado feature)"
cd "$(raiz_do_projeto)"
pendencias=()

carimbo="$(pasta_de_estado)/gate-verde"
commit_atual="$(git rev-parse HEAD 2>/dev/null || echo sem-commit)"
if [ ! -f "$carimbo" ] || [ "$(cat "$carimbo")" != "$commit_atual" ]; then
  pendencias+=("o gate não está verde no commit atual: rode $LIGEIRINHO_RAIZ_DO_PLUGIN/scripts/gate.sh")
fi
if [ -n "$(git status --porcelain --untracked-files=normal -- . ':!.ligeirinho' 2>/dev/null)" ]; then
  pendencias+=("há mudanças sem commit")
fi

pasta_de_notas="$(ler_configuracao docs.features)"
pasta_de_notas="${pasta_de_notas:-docs/features}"
if [ ! -f "$pasta_de_notas/$feature.md" ]; then
  pendencias+=("falta a nota da feature em $pasta_de_notas/$feature.md")
fi

[ "${#pendencias[@]}" -eq 0 ] && exit 0

motivo="ligeirinho: a feature $feature está em fechamento e ainda não pode encerrar: $(printf '%s; ' "${pendencias[@]}")resolva e, quando tudo estiver pronto, rode estado.sh --limpar. Se o Lucas mandou parar no meio, rode estado.sh $feature build para sair do fechamento."
jq -n --arg motivo "$motivo" '{decision: "block", reason: $motivo}'
