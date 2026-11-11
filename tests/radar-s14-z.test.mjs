import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {Script} from 'node:vm';
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const src=readFileSync(join(root,'js/radar-s14-z-sources.js'),'utf8');
test('classic script: parses without ES module syntax',()=>{assert.doesNotThrow(()=>new Script(src));});
test('manager uses structured synchronization result',()=>assert.match(src,/__radarLastCatalogSync/));
test('legacy advanced actions remain available',()=>{for(const a of ['distributedSync','changesLoad','rssSync','import','sync'])assert.ok(src.includes(a));});
test('textContent instead of innerHTML for external results',()=>assert.doesNotMatch(src,/\.innerHTML\s*=/));

test('readiness script warns about missing ISO distribution',()=>{
 const dir=mkdtempSync(join(tmpdir(),'radar-s14-z-'));
 try {
  const p=spawnSync(process.execPath,[
   join(root,'tools/check-pages-readiness.mjs'),
   '--repo',root,'--out',dir
  ],{encoding:'utf8'});
  assert.equal(p.status,1);
  const r=JSON.parse(p.stdout);
  assert.ok(r.warnings.some(w=>w.includes('ISO')));
  assert.equal(r.catalogFilesPublished,false);
 } finally {
  rmSync(dir,{recursive:true,force:true});
 }
});
