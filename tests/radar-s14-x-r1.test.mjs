import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const src=await readFile(resolve(root,'js/radar-standards-panel.js'),'utf8');

test('panel is classic-script compatible',()=>{
 assert.ok(src.startsWith('/* S13-R12'));
 assert.doesNotMatch(src,/\bimport\(treeFilterModuleUrl\)/);
 assert.match(src,/loadTreeFilter\(\)\.then\(treeFilter=>treeFilter\.collect\(/);
 new vm.Script(src,{filename:'radar-standards-panel.js'});
});
test('classic tree-filter registration is compatible',async()=>{
 const js=await readFile(resolve(root,'js/radar-iso-tree-filter.js'),'utf8');
 const window={};window.window=window;
 vm.runInNewContext(js,{window,globalThis:window,setTimeout});
 assert.equal(typeof window.__radarIsoTreeFilter.collect,'function');
 assert.equal(typeof window.__radarIsoTreeFilter.prune,'function');
});
test('loader has async handling and recovery',()=>{
 assert.match(src,/if\(treeFilterLoading\)return treeFilterLoading/);
 assert.match(src,/script\.onload=/);
 assert.match(src,/script\.onerror=/);
 assert.match(src,/treeFilterLoading=null;throw error/);
});
