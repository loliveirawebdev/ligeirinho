#!/usr/bin/env bash
# Roda o gate do projeto (comandos.gate do .ligeirinho.yml) com:
#   - lock da máquina: um gate por vez entre sessões paralelas (senão estoura a memória da VM);
#   - aviso de falta de memória quando algo morre com exit 137;
#   - carimbo de gate verde (.ligeirinho/gate-verde = commit atual) que o fechamento confere.
# Uso: gate.sh [completo]   (sem argumento roda comandos.gate; "completo" roda comandos.gate_completo)
set -uo pipefail
source "$(dirname "$0")/lib.sh"

if ! projeto_usa_ligeirinho; then
  echo "ligeirinho: este repositório não tem .ligeirinho.yml." >&2
  exit 1
fi

chave="comandos.gate"
[ "${1:-}" = "completo" ] && chave="comandos.gate_completo"
comando_do_gate="$(ler_configuracao "$chave")"
if [ -z "$comando_do_gate" ]; then
  echo "ligeirinho: .ligeirinho.yml não define $chave." >&2
  exit 1
fi

cd "$(raiz_do_projeto)" || exit 1
if [ -n "$(git status --porcelain -- . ':!.ligeirinho')" ]; then
  echo "ligeirinho: há mudanças sem commit. O gate roda sobre um commit, para o carimbo valer." >&2
  exit 1
fi

pasta_do_lock="${LIGEIRINHO_LOCK:-$HOME/.cache/ligeirinho/gate.lock}"
mkdir -p "$(dirname "$pasta_do_lock")"

lock_esta_abandonado() {
  local dono
  dono="$(cat "$pasta_do_lock/pid" 2>/dev/null || echo)"
  [ -z "$dono" ] || ! kill -0 "$dono" 2>/dev/null
}

avisou_espera=false
until mkdir "$pasta_do_lock" 2>/dev/null; do
  if lock_esta_abandonado; then
    rm -rf "$pasta_do_lock"
    continue
  fi
  if [ "$avisou_espera" = false ]; then
    echo "ligeirinho: outro gate está rodando ($(cat "$pasta_do_lock/projeto" 2>/dev/null)). Esperando a vez…"
    avisou_espera=true
  fi
  sleep 5
done
echo $$ > "$pasta_do_lock/pid"
raiz_do_projeto > "$pasta_do_lock/projeto"
trap 'rm -rf "$pasta_do_lock"' EXIT

echo "ligeirinho: rodando o gate: $comando_do_gate"
bash -c "$comando_do_gate"
codigo_de_saida=$?

if [ "$codigo_de_saida" -eq 0 ]; then
  mkdir -p "$(pasta_de_estado)"
  [ -f "$(pasta_de_estado)/.gitignore" ] || echo '*' > "$(pasta_de_estado)/.gitignore"
  git rev-parse HEAD > "$(pasta_de_estado)/gate-verde"
  echo "ligeirinho: gate verde em $(git rev-parse --short HEAD)."
  exit 0
fi

if [ "$codigo_de_saida" -eq 137 ]; then
  echo "ligeirinho: o gate morreu com exit 137 (falta de memória), provavelmente não é bug." >&2
  echo "Confira a memória da VM do Docker e se não há stack de dev de pé." >&2
fi
echo "ligeirinho: gate vermelho (exit $codigo_de_saida)." >&2
exit "$codigo_de_saida"
