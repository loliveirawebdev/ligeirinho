#!/usr/bin/env bash
# Starts a new project from ligeirinho's template.
# usage: scripts/init.sh <target-dir> [--name <project-name>] [--local]
#
# The template installs ligeirinho's packages from this repository's GitHub Releases. --local instead packs
# them from this checkout into <target-dir>/vendor/ligeirinho/ (committed with the project), to try package
# changes before they are released; it needs pnpm on the host.
set -euo pipefail

target_dir=""
project_name=""
use_local_packages=false
while [ $# -gt 0 ]; do
  case "$1" in
    --name) project_name="${2:?--name needs a value}"; shift 2 ;;
    --local) use_local_packages=true; shift ;;
    -h|--help) sed -n '2,7p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    -*) echo "init: unknown option $1" >&2; exit 2 ;;
    *) target_dir="$1"; shift ;;
  esac
done
[ -n "$target_dir" ] || { echo "usage: scripts/init.sh <target-dir> [--name <project-name>] [--local]" >&2; exit 2; }
if [ -e "$target_dir" ] && [ -n "$(ls -A "$target_dir" 2>/dev/null)" ]; then
  echo "init: $target_dir exists and is not empty" >&2
  exit 2
fi

ligeirinho_root="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$target_dir"
target_dir="$(cd "$target_dir" && pwd)"
project_name="${project_name:-$(basename "$target_dir")}"
if ! printf '%s' "$project_name" | grep -Eq '^[a-z][a-z0-9-]*$'; then
  echo "init: the project name must be kebab-case (got '$project_name'); pass --name" >&2
  exit 2
fi

echo "Copying the template to $target_dir"
cp -R "$ligeirinho_root/template/." "$target_dir/"

# The template is called "app"; only the visible names change (the @app/* import prefix stays).
sed -i.bak "s/\"name\": \"app\"/\"name\": \"$project_name\"/" "$target_dir/package.json" "$target_dir/bruno/bruno.json"
sed -i.bak "1s/^# app$/# $project_name/" "$target_dir/AGENTS.md"
sed -i.bak "s/:-app-nx-cache}/:-$project_name-nx-cache}/" "$target_dir/compose.yaml"

if [ "$use_local_packages" = true ]; then
  echo "Packing ligeirinho's packages into vendor/ligeirinho"
  "$ligeirinho_root/scripts/pack-local.sh" "$target_dir/vendor/ligeirinho" >/dev/null
  sed -i.bak -E 's#"https://github.com/loliveirawebdev/ligeirinho/releases/download/v[^/]+/(ligeirinho-[a-z-]+\.tgz)"#"file:vendor/ligeirinho/\1"#' "$target_dir/package.json"
  (cd "$target_dir" && pnpm install --lockfile-only >/dev/null)
fi
find "$target_dir" -maxdepth 2 -name '*.bak' -delete

cd "$target_dir"
git init -q -b main
git add -A
git -c user.name="${GIT_AUTHOR_NAME:-$(git config user.name || echo ligeirinho)}" \
    -c user.email="${GIT_AUTHOR_EMAIL:-$(git config user.email || echo ligeirinho@localhost)}" \
    commit -q -m "chore: start from the ligeirinho template"

cat <<NEXT

Done. Next:
  cd $target_dir
  make up       # builds the toolbox, starts the databases, installs, migrates (first run takes a few minutes)
  make check    # the gate: lint, types, tests, contract, e2e
  make dev      # API on localhost:3000, web app on localhost:4200
NEXT
