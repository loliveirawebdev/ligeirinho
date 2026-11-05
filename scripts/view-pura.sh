#!/usr/bin/env bash
# PreToolUse (Write/Edit/MultiEdit): view (*.view.ts) é pura.
# Barra inject() e construtor com parâmetros. Ver rules/mvvm.md.
set -euo pipefail
source "$(dirname "$0")/lib.sh"

projeto_usa_ligeirinho || exit 0

entrada="$(cat)"
caminho="$(jq -r '.tool_input.file_path // empty' <<<"$entrada")"

case "$caminho" in
  *.view.ts) ;;
  *) exit 0 ;;
esac

conteudo_novo="$(jq -r '
  [.tool_input.content, .tool_input.new_string, (.tool_input.edits // [] | .[].new_string)]
  | map(select(. != null)) | join("\n")
' <<<"$entrada")"

violacoes=()
grep -Eq '(^|[^[:alnum:]_])inject[[:space:]]*(<[^>]*>)?[[:space:]]*\(' <<<"$conteudo_novo" \
  && violacoes+=("usa inject()")
grep -Eq 'constructor[[:space:]]*\([[:space:]]*[^)[:space:]]' <<<"$conteudo_novo" \
  && violacoes+=("tem construtor com dependência")

[ "${#violacoes[@]}" -eq 0 ] && exit 0

{
  echo "ligeirinho: $caminho é uma view e $(IFS=' e '; echo "${violacoes[*]}")."
  echo "View é pura: recebe o view-model por input() e emite intenções por output()."
  echo "Quem injeta serviço e busca dado é a página (*.page.ts); a regra de apresentação vai no view-model (*.view-model.ts)."
  echo "Ver $LIGEIRINHO_RAIZ_DO_PLUGIN/rules/mvvm.md"
} >&2
exit 2
