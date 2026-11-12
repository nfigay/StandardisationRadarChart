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

test('GitHub workflow builds and verifies the complete distribution',()=>{
  assert.match(workflow,/npm run build:pages/);
  assert.match(workflow,/npm run verify:pages/);
  assert.match(workflow,/npm run build:client/);
  assert.match(workflow,/npm run verify:client/);
  assert.match(workflow,/npm run assemble:products/);
  assert.match(workflow,/npm run verify:products/);
  assert.match(workflow,/npm run build:dist/);
  assert.match(workflow,/npm run verify:dist/);
  assert.match(workflow,/actions\/upload-artifact@v4/);
  assert.match(workflow,/path:\s*dist\//);
  assert.doesNotMatch(workflow,/actions\/deploy-pages@/);

  const authorBuild=workflow.indexOf('npm run build:pages');
  const clientBuild=workflow.indexOf('npm run build:client');
  const assembly=workflow.indexOf('npm run assemble:products');
  const finalBuild=workflow.indexOf('npm run build:dist');
  const finalVerify=workflow.indexOf('npm run verify:dist');
  const upload=workflow.indexOf('actions/upload-artifact@v4');

  assert.ok(authorBuild<clientBuild);
  assert.ok(clientBuild<assembly);
  assert.ok(assembly<finalBuild);
  assert.ok(finalBuild<finalVerify);
  assert.ok(finalVerify<upload);
});


test('workflow preserves catalogue checks and final Pages metadata',()=>{
  assert.doesNotMatch(workflow,/cp -R catalog-distribution/);
  assert.doesNotMatch(workflow,/cp radar-catalog-config\.json/);

  assert.match(
    workflow,
    /node tools\/check-pages-readiness\.mjs/
  );

  assert.match(workflow,/--strict/);

  const distBuilder=readFileSync(
    new URL('../scripts/build-web-distribution.mjs',import.meta.url),
    'utf8'
  );

  assert.match(
    distBuilder,
    /writeFileSync\(\s*join\(output,'\.nojekyll'\),''/
  );

  assert.match(
    distBuilder,
    /verifyInventory\(root,site\.files\)/
  );

  assert.match(
    distBuilder,
    /verifyProducts\(root\)/
  );

  assert.match(workflow,/include-hidden-files:\s*true/);
});
