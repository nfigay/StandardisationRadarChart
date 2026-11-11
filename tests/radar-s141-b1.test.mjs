import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const panel=readFileSync(
  new URL('../js/radar-standards-panel.js',import.meta.url),'utf8'
);

test('démarrage ISO : aucun clic simulé',()=>{
  assert.doesNotMatch(panel,/remote\.click\(\)/);
  assert.match(panel,/await synchronizeDistributedIso\('startup'\)/);
});

test('synchronisation partagée entre démarrage et bouton',()=>{
  assert.match(panel,/function synchronizeDistributedIso\(origin\)/);
  assert.match(panel,/synchronizeDistributedIso\('manual'\)/);
  assert.match(panel,/if\(distributedSyncPromise\)return distributedSyncPromise/);
});

test('résultat ou erreur observable',()=>{
  assert.match(panel,/__radarIsoStartup=\{status:'running'\}/);
  assert.match(panel,/status:'ready'/);
  assert.match(panel,/status:'failed'/);
  assert.match(panel,/__radarLastCatalogSync=result/);
});

test('réutilisation de la génération installée',()=>{
  assert.match(panel,/if\(windowedActive\)/);
  assert.match(panel,/if\(active\)/);
  assert.match(panel,/status:'existing'/);
});

test('aucune opération destructive IndexedDB',()=>{
  assert.doesNotMatch(panel,/deleteDatabase\(/);
  assert.doesNotMatch(panel,/indexedDB\.deleteDatabase/);
});
