import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../js/radar-iso-tree-filter.js',import.meta.url),'utf8');
const ctx={setTimeout,globalThis:null};ctx.globalThis=ctx;vm.runInNewContext(source,ctx);
const filter=ctx.__radarIsoTreeFilter;
const maps={ics:new Map([
 ['07',{id:'07',parent:''}],['07.030',{id:'07.030',parent:'07'}],['07.030.20',{id:'07.030.20',parent:'07.030'}],
 ['03',{id:'03',parent:''}],['__unclassified__',{id:'__unclassified__',parent:''}]
]),committees:new Map([
 ['121',{id:'121',parent:''}],['121SC2',{id:'121SC2',parent:'121'}],['262',{id:'262',parent:''}],['__unclassified__',{id:'__unclassified__',parent:''}]
])};
const model={get:(mode,id)=>maps[mode].get(id)};
const committees=[{id:'121SC2',reference:'ISO/TC 121/SC 2'},{id:'262',reference:'ISO/TC 262'}];
const data=[{id:'1',icsCodes:['07.030.20'],ownerCommittee:'ISO/TC 121/SC 2'},{id:'2',icsCodes:['03.100.01'],ownerCommittee:'ISO/TC 262'},{id:'3',icsCodes:[],ownerCommittee:''}];
function pages(rows){return async ({after,limit})=>{const i=after??0;return {records:rows.slice(i,i+limit),next:i+limit<rows.length?i+limit:null};};}
const tree=[{id:'ics:07',nodes:[{id:'ics:07.030',nodes:[{id:'ics:07.030.20',nodes:[]}]}]},{id:'ics:03',nodes:[]}];
test('ICS search retains matching leaf and ancestors, hides nonmatching branches',async()=>{
 const result=await filter.collect({page:pages(data),model,mode:'ics',query:'x',limit:1});
 assert.equal(result.scanned,3);assert.ok(result.windows>=3);assert.ok(result.matched.has('ics:07.030.20'));assert.ok(result.matched.has('ics:07'));
 const filtered=filter.prune(tree,result.matched);assert.equal(filtered.length,2);assert.equal(filtered[0].nodes[0].nodes[0].id,'ics:07.030.20');
});
test('TC search maps reference to node and retains parent',async()=>{
 const result=await filter.collect({page:pages([data[0]]),model,mode:'committees',query:'x',committees});
 assert.ok(result.matched.has('committees:121SC2'));assert.ok(result.matched.has('committees:121'));assert.ok(!result.matched.has('committees:262'));
});
test('empty matches produces empty tree rather than the unfiltered tree',async()=>{
 const result=await filter.collect({page:pages([]),model,mode:'ics',query:'nothing'});
 assert.equal(result.scanned,0);assert.equal(filter.prune(tree,result.matched).length,0);
});
test('no ICS and TC classifies unassigned references',async()=>{
 const ics=await filter.collect({page:pages([data[2]]),model,mode:'ics',query:'x'});
 const tc=await filter.collect({page:pages([data[2]]),model,mode:'committees',query:'x',committees});
 assert.ok(ics.matched.has('ics:__unclassified__'));assert.ok(tc.matched.has('committees:__unclassified__'));
});
test('cancellation discards a stale search before second page',async()=>{
 let cancelled=false;const result=await filter.collect({page:async()=>{cancelled=true;return {records:[data[0]],next:1};},model,mode:'ics',query:'x',cancelled:()=>cancelled});
 assert.equal(result.cancelled,true);
});
test('combined filters are forwarded to every page request',async()=>{
 const seen=[];const page=async options=>{seen.push(options);return pages(data)(options);};
 await filter.collect({page,model,mode:'ics',query:'nano',icsFilter:'07',committeeFilter:'ISO/TC 121',limit:1});
 assert.equal(seen.length,3);assert.ok(seen.every(x=>x.search==='nano'&&x.icsFilter==='07'&&x.committeeFilter==='ISO/TC 121'));
});
test('parent tree input is not mutated',()=>{
 const original=JSON.stringify(tree);filter.prune(tree,new Set(['ics:07.030.20']));assert.equal(JSON.stringify(tree),original);
});
