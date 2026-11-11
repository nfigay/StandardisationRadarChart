import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
const panel=readFileSync(new URL('../js/radar-standards-panel.js',import.meta.url),'utf8');
const downloader=readFileSync(new URL('../tools/sync-iso-open-data.mjs',import.meta.url),'utf8');
test('deux sources officielles distinctes : normes et comités',()=>{
 assert.match(downloader,/iso_deliverables_metadata\/json\/iso_deliverables_metadata\.jsonl/);
 assert.match(downloader,/iso_technical_committees\/json\/iso_technical_committees\.jsonl/);
});
test('serveur même origine, sans proxy CORS public',()=>{
 assert.match(panel,/fetch\('\.\/iso-open-data-cache\/manifest\.json'/);
 assert.match(panel,/fetch\('\.\/iso-open-data-cache\/'\+entry\.file/);
 assert.doesNotMatch(downloader,/corsproxy\.io|allorigins/);
});
test('synchronisation automatique seulement si empreinte non déjà chargée',()=>{
  assert.match(panel,/installed\?\.filename===marker/);
  assert.match(panel,/loadIsoCache\(\)\.then\(async\(\)=>/);
  assert.match(panel,/__radarIsoWindowed\?\.current\?\.\(\)/);
  assert.match(panel,/if\(active\)\s*\{\s*root\.__radarIsoStartup=\{status:'existing'\};\s*return;/);
  assert.match(panel,/synchronizeDistributedIso\('startup'\)/);
});
test('l’import existant et les trois vues restent disponibles',()=>{
 assert.match(panel,/Importer JSONL/);
 for(const x of ['ICS et normes','Comités TC \/ SC','Références locales'])assert.ok(panel.includes(x));
});
test('échec rapide si le dépôt cible est invalide, sans réseau',()=>{
 const temp=mkdtempSync(join(tmpdir(),'iso-s14c-test-'));
 const r=spawnSync(process.execPath,[new URL('../tools/sync-iso-open-data.mjs',import.meta.url).pathname,temp],{encoding:'utf8',timeout:5000});
 assert.equal(r.status,1);assert.match(r.stdout,/"ok": false/);assert.match(r.stdout,/radar.html/);
});
