#!/usr/bin/env bash
# Funções compartilhadas pelos hooks e scripts do ligeirinho.
# Sem dependências além de bash, git, awk e jq (que vem no macOS 15+).

LIGEIRINHO_RAIZ_DO_PLUGIN="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"

raiz_do_projeto() {
  local diretorio="${CLAUDE_PROJECT_DIR:-$PWD}"
  git -C "$diretorio" rev-parse --show-toplevel 2>/dev/null || echo "$diretorio"
}

arquivo_de_configuracao() {
  echo "$(raiz_do_projeto)/.ligeirinho.yml"
}

projeto_usa_ligeirinho() {
  [ -f "$(arquivo_de_configuracao)" ]
}

# Lê "secao.chave" de um YAML de dois níveis, sem precisar de um parser.
# Ex.: ler_configuracao comandos.teste
ler_configuracao() {
  local caminho="$1"
  local secao="${caminho%%.*}"
  local chave="${caminho#*.}"
  awk -v secao="$secao" -v chave="$chave" '
    /^[^[:space:]#][^:]*:/ {
      nome = $0; sub(/:.*/, "", nome)
      dentro = (nome == secao)
      if (secao == chave && dentro) { valor = $0; sub(/^[^:]*:[[:space:]]*/, "", valor); imprimir(valor); exit }
      next
    }
    dentro && $0 ~ "^[[:space:]]+" chave ":" {
      valor = $0; sub(/^[^:]*:[[:space:]]*/, "", valor); imprimir(valor); exit
    }
    function imprimir(valor) {
      sub(/[[:space:]]+#.*$/, "", valor)
      gsub(/^["\x27]|["\x27]$/, "", valor)
      print valor
    }
  ' "$(arquivo_de_configuracao)"
}

pasta_de_estado() {
  echo "$(raiz_do_projeto)/.ligeirinho"
}

arquivo_de_estado() {
  echo "$(pasta_de_estado)/estado.json"
}

ler_estado() {
  local campo="$1"
  local arquivo
  arquivo="$(arquivo_de_estado)"
  [ -f "$arquivo" ] || return 0
  jq -r --arg campo "$campo" '.[$campo] // empty' "$arquivo"
}
