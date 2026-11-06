#!/usr/bin/env bash
# Refreshes template/pnpm-lock.yaml after a change to the template's dependencies or to a package.
# The lockfile records each package tarball's hash. pnpm doesn't refresh the hash of a local tarball
# whose path didn't change, so this script writes it. pnpm pack is deterministic, so the tarballs
# init.sh packs later match it as long as the packages don't change.
set -euo pipefail
ligeirinho_root="$(cd "$(dirname "$0")/.." && pwd)"
vendor_dir="$ligeirinho_root/template/vendor/ligeirinho"
"$ligeirinho_root/scripts/pack-local.sh" "$vendor_dir" >/dev/null
cd "$ligeirinho_root/template"
pnpm install --lockfile-only >/dev/null
for tarball in "$vendor_dir"/ligeirinho-*.tgz; do
  file_name="$(basename "$tarball")"
  integrity="sha512-$(openssl dgst -sha512 -binary "$tarball" | base64 | tr -d '\n')"
  # The line after the package's key holds `resolution: {integrity: ..., tarball: file:vendor/ligeirinho/<file>}`.
  sed -i.bak -E "s#integrity: sha512-[A-Za-z0-9+/=]+, tarball: file:vendor/ligeirinho/$file_name\}#integrity: $integrity, tarball: file:vendor/ligeirinho/$file_name}#" pnpm-lock.yaml
done
rm -f pnpm-lock.yaml.bak
echo "template/pnpm-lock.yaml is up to date"
