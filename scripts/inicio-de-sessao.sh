#!/usr/bin/env bash
# SessionStart: se o repositório tem .ligeirinho.yml, carrega o fluxo e diz onde estão as regras.
# Sem o arquivo, fica quieto.
set -euo pipefail
source "$(dirname "$0")/lib.sh"

projeto_usa_ligeirinho || exit 0

cat "$LIGEIRINHO_RAIZ_DO_PLUGIN/FLUXO.md"

cat <<EOF

## Onde estão as coisas

- Regras (leia as que a tarefa toca antes de planejar ou escrever código): $LIGEIRINHO_RAIZ_DO_PLUGIN/rules/
- Scripts do ligeirinho: $LIGEIRINHO_RAIZ_DO_PLUGIN/scripts/
  - \`estado.sh <feature> <etapa>\` marca a etapa da feature atual; \`estado.sh --limpar\` encerra.
  - \`gate.sh\` roda o gate do projeto com lock da máquina e grava o carimbo de gate verde.
- Configuração do projeto: $(arquivo_de_configuracao)
EOF

if [ "$(ler_configuracao adocao.ativa)" = "true" ]; then
  echo "- Projeto em **adoção**: regra ainda não cumprida no código antigo é aviso; código novo segue tudo."
fi

feature_atual="$(ler_estado feature)"
if [ -n "$feature_atual" ]; then
  echo
  echo "## Feature em andamento"
  echo
  echo "Feature \`$feature_atual\`, etapa \`$(ler_estado etapa)\`. Retome dela (a nota e o plano estão em $(ler_configuracao docs.features))."
fi
