import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=dirname(dirname(fileURLToPath(import.meta.url)));
const source=await readFile(join(root,'js/radar-standards-panel.js'),'utf8');
test('ICS/TC selection is a persistent filter and restarts first page',()=>{
 assert.match(source,/sidebarSelection\[navMode\]=id/);
 assert.match(source,/Promise\.resolve\(\)\.then\(\(\)=>refresh\(\)\)/);
 assert.match(source,/windowHistory=\[null\];windowPosition=0/);
});
test('page size limits requests but does not cap catalogue',()=>{
 assert.match(source,/const WINDOW_SIZES=\[100,250,500\]/);
 assert.match(source,/limit:windowSize/);
 assert.match(source,/windowNext=result\.next/);
});
test('group query and descendants preserve IndexedDB index path',()=>{
 assert.match(source,/options\.dimension=view==='ics'\?'ics':'committee'/);
 assert.match(source,/options\.groupKey=/);
 assert.match(source,/for\(const child of node\.children\|\|\[\]\)visit\(child\)/);
});
test('user sees scope, range, and clear end of results',()=>{
 for(const key of ['windowScopeDescendants','windowRange','windowEnd','windowEmpty','windowNumber'])assert.ok(source.includes(key));
 assert.match(source,/updateButtons\(projected\.length\)/);
});
test('styled select survives regression',()=>{
 assert.match(source,/windowSizeSelect\.size=1/);
 assert.match(source,/height:30px/);
});
