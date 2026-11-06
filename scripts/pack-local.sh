#!/usr/bin/env bash
# Builds every package and packs it into a tarball, for projects that install ligeirinho's packages
# from disk instead of a registry (`scripts/init.sh --local`).
# usage: scripts/pack-local.sh <output-dir>
set -euo pipefail

output_dir="${1:?usage: scripts/pack-local.sh <output-dir>}"
repository_root="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$output_dir"
output_dir="$(cd "$output_dir" && pwd)"

cd "$repository_root"
pnpm install --frozen-lockfile >/dev/null
pnpm -r build >/dev/null
for package_dir in packages/*/; do
  (cd "$package_dir" && pnpm pack --pack-destination "$output_dir" >/dev/null)
done
# Fixed names, so a project's package.json doesn't change when a version does.
for tarball in "$output_dir"/ligeirinho-*-[0-9]*.tgz; do
  mv "$tarball" "$(echo "$tarball" | sed -E 's/-[0-9]+\.[0-9]+\.[0-9]+(-[^.]+)?\.tgz$/.tgz/')"
done
ls "$output_dir"
