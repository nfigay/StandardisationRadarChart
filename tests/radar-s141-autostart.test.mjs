import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const panel=readFileSync(
  new URL('../js/radar-standards-panel.js',import.meta.url),
  'utf8'
);

const workflow=readFileSync(
  new URL('../.github/workflows/radar-pages.yml',import.meta.url),
  'utf8'
);

test('S14.1 initialisation vérifie le catalogue actif',()=>{
  assert.match(panel,/loadIsoCache\(\)\.then\(async\(\)=>/);
  assert.match(panel,/if\(windowedActive\)\s*\{\s*root\.__radarIsoStartup=\{status:'existing'\};\s*return;/);
  assert.match(panel,/__radarIsoWindowed\?\.current\?\.\(\)/);
  assert.match(panel,/if\(active\)\s*\{\s*root\.__radarIsoStartup=\{status:'existing'\};\s*return;/);
});

test('S14.1 catalogue absent : synchronisation distribuée',()=>{
  assert.match(panel,/synchronizeDistributedIso\('startup'\)/);
  assert.match(
    panel,
    /remote\.addEventListener\('click',\(\)=>/
  );
  assert.match(panel,/__radarIsoCatalogClient\.sync/);
  assert.match(panel,/await loadIsoCache\(\)/);
});

test('S14.1 construction manuelle et automatique des distributions',()=>{
  assert.match(
    workflow,
    /push:\s*\n\s*branches:\s*\[main\]/
  );
  assert.match(workflow,/workflow_dispatch:/);
  assert.match(workflow,/actions\/upload-artifact@v4/);
  assert.match(workflow,/npm run build:dist/);
  assert.match(workflow,/npm run verify:dist/);
  assert.doesNotMatch(workflow,/actions\/deploy-pages@/);
  assert.doesNotMatch(workflow,/actions\/upload-pages-artifact@/);
});
