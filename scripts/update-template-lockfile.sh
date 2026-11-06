#!/usr/bin/env bash
# Points the template at a released version of ligeirinho's packages and refreshes its lockfile.
# usage: scripts/update-template-lockfile.sh <version>     (e.g. 0.2.0; the GitHub Release must exist)
set -euo pipefail
version="${1:?usage: scripts/update-template-lockfile.sh <version>}"
ligeirinho_root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ligeirinho_root/template"
node - "$version" <<'NODE'
const fs = require('node:fs');
const version = process.argv[2];
const manifest = JSON.parse(fs.readFileSync('package.json', 'utf8'));
for (const name of Object.keys(manifest.devDependencies)) {
  if (name.startsWith('@ligeirinho/')) {
    const packageName = name.slice('@ligeirinho/'.length);
    manifest.devDependencies[name] =
      `https://github.com/loliveirawebdev/ligeirinho/releases/download/v${version}/ligeirinho-${packageName}.tgz`;
  }
}
fs.writeFileSync('package.json', `${JSON.stringify(manifest, null, 2)}\n`);
NODE
# --ignore-workspace: template/ sits inside ligeirinho's own pnpm workspace, which pnpm would use instead.
pnpm install --lockfile-only --ignore-workspace
echo "template now uses ligeirinho v$version"
