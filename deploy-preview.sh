#!/usr/bin/env bash
# Rebuild the GitHub Pages preview and push it to gh-pages.
# The preview is noindex so it never competes with the real domain.
set -euo pipefail
cd "$(dirname "$0")"

SITE_URL=https://shayexd.github.io BASE_PATH=/shaiomedia/ PUBLIC_PREVIEW=1 npx astro build
touch dist/.nojekyll

TMP=$(mktemp -d)
cp -R dist/. "$TMP"/
cd "$TMP"
git init -q -b gh-pages
git add -A
git -c user.name="ShayExD" -c user.email="104307803+ShayExD@users.noreply.github.com" \
    commit -q -m "Preview build $(date +%Y-%m-%d\ %H:%M)"
git remote add origin https://github.com/ShayExD/shaiomedia.git
git push -q -f origin gh-pages
cd - >/dev/null
rm -rf "$TMP"

echo "✓ https://shayexd.github.io/shaiomedia/ (may take ~30s to refresh)"
