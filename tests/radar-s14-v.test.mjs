import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
const base=resolve(dirname(fileURLToPath(import.meta.url)),'../js');
const panel=readFileSync(resolve(base,'radar-standards-panel.js'),'utf8');
const db=readFileSync(resolve(base,'radar-iso-windowed-db.js'),'utf8');
const module={exports:{}};
const context={module,globalThis:{},console};
runInNewContext(db,context);
const api=module.exports;
test('API IndexedDB includes global sort index and group index',()=>{
 for(const name of ['page','ensureSortIndex','sortIndexStatus','ensureGroupIndex','groupIndexStatus'])assert.equal(typeof api[name],'function');
});
test('ICS parent membership includes descendants',()=>{
 assert.deepEqual([...api.hierarchy('ics',{icsCodes:['07.020','11.040']})],['07','07.020','11','11.040']);
});
test('TC/SC parent membership includes responsible TC',()=>{
 assert.equal(api.hierarchy('committee',{ownerCommittee:'ISO/TC 121/SC 2'}).includes('ISO/TC 121'),true);
});
test('Unclassified is explicit, never mapped to arbitrary ICS',()=>{
 assert.deepEqual([...api.hierarchy('ics',{icsCodes:[]})],['__unclassified__']);
});
test('Global sort runs in IndexedDB and never uses w2grid local sort for ISO',()=>{
 assert.match(db,/openCursor\(start,backwards\?'prev':'next'\)/);
 assert.match(db,/sortKeys/);
 const isoBlock=panel.slice(panel.indexOf("if(mode==='ics'||mode==='committees'){",panel.indexOf('function refresh()')),panel.indexOf("} else if(mode==='changes'){",panel.indexOf('function refresh()')));
 assert.doesNotMatch(isoBlock,/sortable:true/);
});
test('Text search, independent ICS and committee filters are passed to entire query',()=>{
 assert.match(panel,/icsFilter:icsFacet\?\.value/);
 assert.match(panel,/committeeFilter:committeeFacet\?\.value/);
 assert.match(db,/hierarchy\('ics',item\)\.includes/);
 assert.match(db,/hierarchy\('committee',item\)\.includes/);
 assert.match(db,/const normalized=String\(search\|\|''\)/);
});
test('Continuous scroll is bounded by two windows and has backward recovery',()=>{
 assert.match(panel,/combined\.length-2\*windowSize/);
 assert.match(panel,/autoShift\('next'\)/);
 assert.match(panel,/autoShift\('previous'\)/);
 assert.match(panel,/windowToken/);
});
test('Failed generation cleanup includes derived sort indexes',()=>{
 assert.match(db,/\['records','links','groupLinks','sortKeys'\]/);
});
