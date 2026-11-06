#!/usr/bin/env bash
# Refreshes template/pnpm-lock.yaml after a change to the template's dependencies or to a package.
# The lockfile pins each package tarball's hash; pnpm pack is deterministic, so the tarballs
# init.sh packs later match it as long as the packages don't change.
set -euo pipefail
ligeirinho_root="$(cd "$(dirname "$0")/.." && pwd)"
"$ligeirinho_root/scripts/pack-local.sh" "$ligeirinho_root/template/vendor/ligeirinho" >/dev/null
cd "$ligeirinho_root/template"
pnpm install --lockfile-only
