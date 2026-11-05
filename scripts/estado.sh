#!/usr/bin/env bash
# Marca em que etapa está a feature atual. O estado fica em .ligeirinho/ (fora do git).
#   estado.sh 003-convites plano
#   estado.sh --limpar
set -euo pipefail
source "$(dirname "$0")/lib.sh"

etapas_validas="clarify plano preview build fechamento"
pasta="$(pasta_de_estado)"
mkdir -p "$pasta"
[ -f "$pasta/.gitignore" ] || echo '*' > "$pasta/.gitignore"

if [ "${1:-}" = "--limpar" ]; then
  rm -f "$(arquivo_de_estado)" "$pasta/gate-verde"
  echo "ligeirinho: nenhuma feature em andamento."
  exit 0
fi

feature="${1:?uso: estado.sh <NNN-nome-da-feature> <etapa> | --limpar}"
etapa="${2:?etapas: $etapas_validas}"

if ! grep -qw "$etapa" <<<"$etapas_validas"; then
  echo "ligeirinho: etapa '$etapa' não existe. Use uma destas: $etapas_validas" >&2
  exit 1
fi
if ! grep -Eq '^[0-9]{3}-[a-z0-9]+(-[a-z0-9]+)*$' <<<"$feature"; then
  echo "ligeirinho: o nome da feature deve ser NNN-nome-em-kebab-case (ex.: 003-convites)." >&2
  exit 1
fi

jq -n --arg feature "$feature" --arg etapa "$etapa" '{feature: $feature, etapa: $etapa}' > "$(arquivo_de_estado)"
echo "ligeirinho: feature $feature na etapa $etapa."
