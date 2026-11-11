import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const pkg=JSON.parse(readFileSync(
  new URL('../package.json',import.meta.url),'utf8'
));
const builder=readFileSync(
  new URL('../scripts/build-pages-complete.mjs',import.meta.url),'utf8'
);
const workflow=readFileSync(
  new URL('../.github/workflows/radar-pages.yml',import.meta.url),'utf8'
);

test('one command builds the complete Pages artifact',()=>{
  assert.equal(pkg.scripts['build:pages'],
    'node scripts/build-pages-complete.mjs');
  assert.match(builder,/scripts\/build-safe\.mjs/);
  assert.match(builder,/radar-catalog-config\.json/);
  assert.match(builder,/catalog-distribution/);
});

test('build protects existing output and validates manifest',()=>{
  assert.match(builder,/if\(existsSync\(output\)\)/);
  assert.match(builder,/manifest\.catalogId!=='iso'/);
  assert.match(builder,/statSync\(file\)\.size!==dataset\.bytes/);
  assert.match(builder,/check-pages-readiness\.mjs/);
  assert.match(builder,/--strict/);
});

test('GitHub workflow uses the same complete build command',()=>{
  assert.match(workflow,/npm run build:pages/);
  assert.match(workflow,/deploy-pages@v4/);
});


test('workflow does not copy the catalogue twice',()=>{
  assert.doesNotMatch(workflow,/cp -R catalog-distribution/);
  assert.doesNotMatch(workflow,/cp radar-catalog-config\.json/);
  assert.match(workflow,/touch \.radarchart-build\/pages\/\.nojekyll/);
  assert.match(workflow,/node tools\/check-pages-readiness\.mjs/);
});
