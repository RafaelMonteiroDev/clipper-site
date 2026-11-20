#!/usr/bin/env sh
# Build and publish dist/ to the gh-pages branch (GitHub Pages serves it).
set -e
pnpm build
touch dist/.nojekyll
cd dist
git init -q -b gh-pages
git add -A
git -c user.name="$(git -C .. config user.name)" -c user.email="$(git -C .. config user.email)" commit -q -m "Publicar o site"
git push -q -f "$(git -C .. remote get-url origin)" gh-pages
rm -rf .git
