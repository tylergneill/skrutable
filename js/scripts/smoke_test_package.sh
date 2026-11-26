#!/usr/bin/env bash
# Smoke-test the skrutable-js npm package before publishing.
#
# npm has no test registry like TestPyPI, so instead this builds the exact
# tarball `npm publish` would upload (via `npm pack`), installs it into a
# throwaway project, and checks that it loads each way users load it:
#
#   1. Node `import`      -> src/index.js (the "default" export)
#   2. Node `require`     -> src/index.js (needs Node 22.12+)
#   3. ES module bundle   -> dist/skrutable.esm.js (bundlers, esm.sh)
#   4. UMD bundle global  -> dist/skrutable.bundle.js (<script> tags, CDNs)
#
# Each check transliterates a word and compares it with the expected
# Devanagari, and checks the reported version against package.json.
# Nothing is published. Run from anywhere: `make smoke-test-npm-package`.

set -euo pipefail

JS_DIR="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

cd "$JS_DIR"
VERSION="$(node -p "require('./package.json').version")"
echo "Building and packing skrutable-js $VERSION ..."
npm run --silent build
TARBALL="$(npm pack --silent --pack-destination "$WORK")"
echo "Packed $TARBALL; files in the package:"
tar tzf "$WORK/$TARBALL" | sed 's/^package\//  /'

cd "$WORK"
npm init -y >/dev/null
npm install --silent --no-audit --no-fund "./$TARBALL"
PKG="$WORK/node_modules/skrutable-js"

# Input in IAST (with one NFD-encoded letter), expected Devanagari output.
export SMOKE_IN="kr̥ṣṇa"
export SMOKE_IN_NFD="$(node -p "'ṭa'.normalize('NFD')")"
export SMOKE_WANT="कृष्ण"
export SMOKE_WANT_NFD="ट"
export SMOKE_VERSION="$VERSION"

# Shared check, run inside each loading method.
CHECK='
  const out = new T().transliterate(process.env.SMOKE_IN, "IAST", "DEV");
  const outNfd = new T().transliterate(process.env.SMOKE_IN_NFD, "IAST", "DEV");
  if (out !== process.env.SMOKE_WANT) throw new Error(`got ${out}`);
  if (outNfd !== process.env.SMOKE_WANT_NFD) throw new Error(`NFD input gave ${outNfd}`);
  if (v !== process.env.SMOKE_VERSION) throw new Error(`version ${v}`);
'

node --input-type=module -e "
  import { Transliterator as T, version as v } from 'skrutable-js';
  $CHECK console.log('  ok  Node import');"

node -e "
  const { Transliterator: T, version: v } = require('skrutable-js');
  $CHECK console.log('  ok  Node require');"

node --input-type=module -e "
  const { Transliterator: T, version: v } = await import('$PKG/dist/skrutable.esm.js');
  $CHECK console.log('  ok  ES module bundle');"

# Run the UMD bundle in a bare context, as a <script> tag would.
node -e "
  const vm = require('vm'), fs = require('fs');
  const ctx = { console, process };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync('$PKG/dist/skrutable.bundle.js', 'utf8'), ctx);
  vm.runInContext('const T = Skrutable.Transliterator, v = Skrutable.version; ' + process.argv[1] + ' console.log(\"  ok  UMD bundle global\");', ctx);
" "$CHECK"

echo "skrutable-js $VERSION is ready to publish."
