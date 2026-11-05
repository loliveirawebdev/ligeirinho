#!/usr/bin/env bash
# PreToolUse (Bash): antes de qualquer `git commit`, roda os testes rápidos do projeto.
# Se falharem, barra o commit (exit 2) e devolve a saída para o Claude corrigir.
set -euo pipefail
source "$(dirname "$0")/lib.sh"

projeto_usa_ligeirinho || exit 0

entrada="$(cat)"
comando="$(jq -r '.tool_input.command // empty' <<<"$entrada")"

# Só age em `git commit` (inclusive `git -C pasta commit` e encadeado com && ou ;).
if ! grep -Eq '(^|[;&|[:space:]])git([[:space:]]+-C[[:space:]]+[^[:space:]]+)?[[:space:]]+commit([[:space:]]|$)' <<<"$comando"; then
  exit 0
fi

comando_de_teste="$(ler_configuracao comandos.teste)"
if [ -z "$comando_de_teste" ]; then
  echo "ligeirinho: .ligeirinho.yml não define comandos.teste; não dá para conferir os testes antes do commit." >&2
  exit 2
fi

cd "$(raiz_do_projeto)"
set +e
saida="$(bash -c "$comando_de_teste" 2>&1)"
codigo_de_saida=$?
set -e
[ "$codigo_de_saida" -eq 0 ] && exit 0

{
  echo "ligeirinho: commit barrado, os testes não passaram (\`$comando_de_teste\`)."
  if [ "$codigo_de_saida" -eq 137 ]; then
    echo "Exit 137: o processo morreu por falta de memória, provavelmente não é bug. Confira se outro gate está rodando."
  fi
  echo
  tail -n 80 <<<"$saida"
} >&2
exit 2
