#!/usr/bin/env bash
#
# area-build — construit la démo statique d'Area et la publie dans public/area/.
#
# Le front d'Area (vendor/area/frontend, branche "demo" du submodule) est
# exporté en HTML/JS/CSS statique — voir vendor/area/frontend/next.config.mjs
# (output: 'export'). Rien à héberger : les fichiers sont servis tels quels
# par le portfolio, comme les démos WebAssembly de public/myrpg ou public/rtype.

set -euo pipefail
cd "$(dirname "$0")/.."

FRONTEND=vendor/area/frontend
OUT="$FRONTEND/out"
DEST=public/area

if [ ! -d "$FRONTEND" ]; then
  echo "vendor/area/frontend introuvable — le submodule est-il initialisé ? (git submodule update --init)" >&2
  exit 1
fi

(cd "$FRONTEND" && pnpm install && pnpm build)

rm -rf "$DEST"
mkdir -p "$DEST"
cp -R "$OUT"/. "$DEST"/

echo "démo Area publiée dans $DEST"
