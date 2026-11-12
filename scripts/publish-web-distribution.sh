#!/bin/bash
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT"

echo "===== PUBLICATION DISTRIBUTION WEB ====="

test "$(git branch --show-current)" = main

test -z "$(git diff --name-only)"
test -z "$(git diff --cached --name-only)"

SOURCE_FULL=$(git rev-parse HEAD)
SOURCE=$(git rev-parse --short HEAD)

echo "Source : $SOURCE"

node scripts/build-web-distribution.mjs verify dist

node --input-type=module - "$SOURCE" <<'JS'
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

for(const filename of [
  'release-manifest.json',
  'distributions.json',
  'site-manifest.json'
]){
  const manifest=JSON.parse(
    readFileSync('dist/'+filename,'utf8')
  );

  assert.equal(
    manifest.sourceCommit,
    process.argv[2],
    'Stale distribution: '+filename
  );

  console.log(
    'PROVENANCE OK :',
    filename,
    manifest.sourceCommit
  );
}
JS

echo "===== ETAT DISTANT ====="

git fetch origin main gh-pages

REMOTE_MAIN=$(git rev-parse origin/main)
PREVIOUS_DIST=$(git rev-parse origin/gh-pages)

git merge-base --is-ancestor \
  "$REMOTE_MAIN" "$SOURCE_FULL"

PUBLISH_DIR=$(mktemp -d /tmp/radar-release.XXXXXX)

CHECK_DIR=$(mktemp -d /tmp/radar-release-check.XXXXXX)

echo "Depot temporaire : $PUBLISH_DIR"
echo "Distribution precedente : $PREVIOUS_DIST"

git -C "$PUBLISH_DIR" init -b gh-pages

git -C "$PUBLISH_DIR" config \
  user.name "$(git config user.name)"

git -C "$PUBLISH_DIR" config \
  user.email "$(git config user.email)"

git -C "$PUBLISH_DIR" config \
  core.autocrlf false

git -C "$PUBLISH_DIR" remote add \
  origin "$(git remote get-url origin)"

git -C "$PUBLISH_DIR" fetch origin gh-pages

test "$(git -C "$PUBLISH_DIR" rev-parse FETCH_HEAD)" = \
     "$PREVIOUS_DIST"

git -C "$PUBLISH_DIR" checkout \
  -B gh-pages FETCH_HEAD

# Importer le commit source dans le depot temporaire
# pour permettre la publication atomique.

git -C "$PUBLISH_DIR" fetch \
  "$ROOT" refs/heads/main

test "$(git -C "$PUBLISH_DIR" rev-parse FETCH_HEAD)" = \
     "$SOURCE_FULL"

echo "===== NOUVELLE DISTRIBUTION ====="

# Nettoyage strictement limite au depot temporaire.
# Le repertoire de developpement reste intact.

git -C "$PUBLISH_DIR" rm -r --quiet -- .

cp -R "$ROOT/dist/." "$PUBLISH_DIR/"

git -C "$PUBLISH_DIR" add -f -- .

if git -C "$PUBLISH_DIR" diff --cached --quiet; then
  echo "Distribution deja identique."
else
  git -C "$PUBLISH_DIR" commit \
    -m "Web distributions from $SOURCE"
fi

NEW_DIST=$(git -C "$PUBLISH_DIR" rev-parse HEAD)

git -C "$PUBLISH_DIR" merge-base \
  --is-ancestor "$PREVIOUS_DIST" "$NEW_DIST"

echo "===== VERIFICATION DES OCTETS GIT ====="

git -C "$PUBLISH_DIR" archive HEAD |
  tar -x -C "$CHECK_DIR"

node scripts/build-web-distribution.mjs \
  verify "$CHECK_DIR"

cmp "$ROOT/dist/site-manifest.json" \
    "$CHECK_DIR/site-manifest.json"

cmp "$ROOT/dist/index.html" \
    "$CHECK_DIR/index.html"

echo "Archive Git conforme aux manifestes."

echo "===== CONTROLE DE CONCURRENCE ====="

CURRENT_MAIN=$(git ls-remote --heads origin main |
  awk '{print $1}')

CURRENT_DIST=$(git ls-remote --heads origin gh-pages |
  awk '{print $1}')

test "$CURRENT_MAIN" = "$REMOTE_MAIN"
test "$CURRENT_DIST" = "$PREVIOUS_DIST"

echo "===== PUBLICATION ATOMIQUE ====="

git -C "$PUBLISH_DIR" push --atomic origin \
  "$SOURCE_FULL:refs/heads/main" \
  "HEAD:refs/heads/gh-pages"

echo "===== VERIFICATION DISTANTE ====="

git fetch origin main gh-pages

test "$(git rev-parse origin/main)" = \
     "$SOURCE_FULL"

test "$(git rev-parse origin/gh-pages)" = \
     "$NEW_DIST"

git show origin/gh-pages:site-manifest.json \
  > "$CHECK_DIR/remote-manifest.json"

cmp "$ROOT/dist/site-manifest.json" \
    "$CHECK_DIR/remote-manifest.json"

echo "SOURCE_COMMIT=$SOURCE"
echo "DISTRIBUTION_COMMIT=$NEW_DIST"

echo "Publication atomique fast-forward verifiee."

echo "Depot temporaire conserve : $PUBLISH_DIR"
echo "Archive de controle : $CHECK_DIR"
