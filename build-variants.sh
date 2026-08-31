#!/usr/bin/env bash
# Build both palette variants side by side and publish them to gh-pages as
# /k1/ and /k2/, with a small chooser at the root.
set -euo pipefail
cd "$(dirname "$0")"

OUT=$(mktemp -d)

for K in k1 k2; do
  cp "src/styles/palette-$K.css" src/styles/palette.css
  cp "public/variants/$K/logo.webp"       public/logo.webp
  cp "public/variants/$K/logo-white.webp" public/logo-white.webp
  cp "public/variants/$K/logo.png"        public/logo.png
  cp "public/variants/$K/favicon.svg"     public/favicon.svg
  cp "public/variants/$K/og.jpg"          public/og/default.jpg
  SITE_URL=https://shayexd.github.io BASE_PATH="/shaiomedia/$K/" PUBLIC_PREVIEW=1 npx astro build
  mkdir -p "$OUT/$K"
  cp -R dist/. "$OUT/$K"/
done

# restore the working copy to k1 so local dev is not left half-swapped
cp src/styles/palette-k1.css src/styles/palette.css
cp public/variants/k1/logo.webp public/logo.webp
cp public/variants/k1/logo-white.webp public/logo-white.webp
cp public/variants/k1/logo.png public/logo.png
cp public/variants/k1/favicon.svg public/favicon.svg
cp public/variants/k1/og.jpg public/og/default.jpg

cp public/variants/chooser.html "$OUT/index.html"
touch "$OUT/.nojekyll"

cd "$OUT"
git init -q -b gh-pages
git add -A
git -c user.name="ShayExD" -c user.email="104307803+ShayExD@users.noreply.github.com" \
    commit -q -m "Palette comparison: K1 and K2"
git remote add origin https://github.com/ShayExD/shaiomedia.git
git push -q -f origin gh-pages
cd - >/dev/null
rm -rf "$OUT"

echo "✓ K1: https://shayexd.github.io/shaiomedia/k1/"
echo "✓ K2: https://shayexd.github.io/shaiomedia/k2/"
