#!/usr/bin/env bash
# Build every palette variant and publish them side by side on gh-pages,
# with a chooser at the root.
set -euo pipefail
cd "$(dirname "$0")"

IDS=$(python3 -c "import json;print(' '.join(v['id'] for v in json.load(open('public/variants/spec.json'))))")
OUT=$(mktemp -d)

for K in $IDS; do
  cp "src/styles/palette-$K.css"          src/styles/palette.css
  cp "public/variants/$K/logo.webp"       public/logo.webp
  cp "public/variants/$K/logo-white.webp" public/logo-white.webp
  cp "public/variants/$K/logo.png"        public/logo.png
  cp "public/variants/$K/favicon.svg"     public/favicon.svg
  cp "public/variants/$K/og.jpg"          public/og/default.jpg
  SITE_URL=https://shayexd.github.io BASE_PATH="/shaiomedia/$K/" PUBLIC_PREVIEW=1 \
    npx astro build >/dev/null 2>&1
  mkdir -p "$OUT/$K"
  cp -R dist/. "$OUT/$K"/
  echo "  built $K"
done

# leave the working copy on the first variant
FIRST=$(echo $IDS | awk '{print $1}')
cp "src/styles/palette-$FIRST.css" src/styles/palette.css
for f in logo.webp logo-white.webp logo.png favicon.svg; do cp "public/variants/$FIRST/$f" "public/$f"; done
cp "public/variants/$FIRST/og.jpg" public/og/default.jpg

cp public/variants/chooser.html "$OUT/index.html"
touch "$OUT/.nojekyll"

cd "$OUT"
git init -q -b gh-pages && git add -A
git -c user.name="ShayExD" -c user.email="104307803+ShayExD@users.noreply.github.com" \
    commit -q -m "Ten palette variants for comparison"
git remote add origin https://github.com/ShayExD/shaiomedia.git
git push -q -f origin gh-pages
cd - >/dev/null && rm -rf "$OUT"

echo
echo "✓ https://shayexd.github.io/shaiomedia/"
for K in $IDS; do echo "  · https://shayexd.github.io/shaiomedia/$K/"; done
