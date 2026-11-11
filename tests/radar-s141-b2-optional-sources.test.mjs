import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const panel=readFileSync(
  new URL('../js/radar-standards-panel.js',import.meta.url),
  'utf8'
);
const toolbar=readFileSync(
  new URL('../js/radar-iso-toolbar.js',import.meta.url),
  'utf8'
);

const rss=panel.slice(
  panel.indexOf('async function loadRssCache(force=false)'),
  panel.indexOf('/* S14-J change journal */')
);

const startup=panel.slice(
  panel.indexOf("bindLocale();updateStaticLabels();refresh();"),
  panel.indexOf('return true;',panel.indexOf(
    "bindLocale();updateStaticLabels();refresh();"
  ))
);

test('le démarrage ne demande pas le journal facultatif',()=>{
  assert.doesNotMatch(startup,/loadChanges\(\)/);
  assert.match(startup,/loadRssCache\(\)/);
});

test('le cache RSS est lisible sans synchronisation réseau',()=>{
  assert.match(rss,/force\?await api\.syncLocal\(true\):null/);
  assert.match(rss,/await api\.readAll\(\)/);
});

test('les actions facultatives restent disponibles',()=>{
  assert.match(panel,/loadChanges\(\)/);
  assert.match(panel,/loadRssCache\(true\)/);
  assert.match(toolbar,/const OPERATIONS=/);
  assert.match(toolbar,/distributedSync/);
});

test('le catalogue distribué conserve son démarrage automatique',()=>{
  assert.match(panel,/synchronizeDistributedIso\('startup'\)/);
  assert.match(panel,/synchronizeDistributedIso\('manual'\)/);
});

test('le gestionnaire explique les sources distinctes',()=>{
  assert.match(toolbar,/facultatives/);
  assert.match(toolbar,/optional operations/);
  assert.match(toolbar,/Gérer les sources/);
});
