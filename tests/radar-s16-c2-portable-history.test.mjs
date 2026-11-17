import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
const code=await fs.readFile(new URL('../js/radar-standard-sources.js',import.meta.url),'utf8');
const panel=await fs.readFile(new URL('../js/radar-standards-panel.js',import.meta.url),'utf8');
function instance({viewer=false}={}){
 const host={__radarApplicationProfile:viewer?{viewer:true}:undefined};
 vm.runInNewContext(code,{window:host,URL,TextEncoder,TextDecoder,AbortSignal});
 return host.__radarStandardSources;
}
const html=`<table><tr><th>Version</th><th>Adoption Date</th><th>URL</th></tr><tr><td>2.4.1</td><td>July 2011</td><td><a href="/spec/UML/2.4.1">2.4.1</a></td></tr><tr><td>1.4</td><td>September 2001</td><td><a href="/spec/UML/1.4">1.4</a></td></tr></table>`;
const snapshot=instance().omg.parseOmgHistory(html,'UML',{acquiredAt:'2026-11-17T07:00:00.000Z',sourceDigest:'a'.repeat(64)});

test('C2 explicit private OMG history can move between browser origins without a relay',async()=>{
 const a=instance(),b=instance();
 assert.equal(b.omgHistoryStatus('UML'),null);
 const status=await a.importOmgHistory(JSON.stringify(snapshot));
 assert.equal(status.count,2);assert.equal(status.origin,'explicit-file');
 const exported=await a.exportOmgHistory('UML');
 assert.equal(JSON.parse(exported).distribution,'private-only');
 const imported=await b.importOmgHistory(exported);
 assert.equal(imported.family,'UML');assert.equal(imported.count,2);
 assert.deepEqual([...b.searchOmgHistory('UML').rows].map(x=>x.key),['UML/2.4.1','UML/1.4']);
 assert.equal(b.selectedOmgHistory('UML','UML/1.4',imported.generation).edition,'1.4');
});
test('C2 rejects malformed, misleading and foreign histories before changing state',async()=>{
 const a=instance();await a.importOmgHistory(JSON.stringify(snapshot));
 const before=a.omgHistoryStatus('UML').generation;
 const foreign=structuredClone(snapshot);foreign.records[0].url='https://evil.example/spec/UML/2.4.1';
 await assert.rejects(a.importOmgHistory(JSON.stringify(foreign)),/Non-canonical|URL|OMG/);
 const partial=structuredClone(snapshot);partial.coverage.complete=false;
 await assert.rejects(a.importOmgHistory(JSON.stringify(partial)),/Invalid/);
 const index={...snapshot,sourceId:'omg-specifications'};
 await assert.rejects(a.importOmgHistory(JSON.stringify(index)),/Invalid/);
 assert.equal(a.omgHistoryStatus('UML').generation,before);
 assert.equal(a.searchOmgHistory('UML').total,2);
 await assert.rejects(a.exportOmgHistory('SysML'),/No acquired/);
});
test('C2 Viewer cannot import or export a private OMG history',async()=>{
 const a=instance({viewer:true});
 await assert.rejects(a.importOmgHistory(JSON.stringify(snapshot)),/denied/);
 await assert.rejects(a.exportOmgHistory('UML'),/denied/);
});
test('C2 W2UI exposes explicit import and export of private history, and distinguishes JSON kinds',()=>{
 assert.match(panel,/omgHistoryImport/);assert.match(panel,/omgHistoryExport/);
 assert.match(panel,/payload\?\.sourceId==='omg-formal-history'/);
 assert.match(panel,/sourceApi\(\)\.importOmgHistory\(raw\)/);
 assert.match(panel,/api\.exportOmgHistory\(documentOmgFamily\)/);
 assert.match(panel,/S16-OMG-History-/);
});
