import test from 'node:test';
import assert from 'node:assert/strict';
// The diagnostic is a browser IIFE, not an ES module with named exports.
// Import it for side effects and obtain its explicitly exposed API.
// This works with both CommonJS and `type: module` repositories.
await import('../js/radar-s14-q-diagnostic.js');
const run = globalThis.__radarS14Q?.run;
assert.equal(typeof run, 'function', 'S14-Q diagnostic API must expose run()');
function setup({duplicates=false,wrongIcs=false,missing=false}={}){
 globalThis.performance={now:()=>10};
 const docs=[{id:'a',reference:'ISO 1',icsCodes:wrongIcs?['02.010']:['01.010'],ownerCommittee:'ISO/TC 12/SC 1'},
             {id:duplicates?'a':'b',reference:'ISO 2',icsCodes:['01.020'],ownerCommittee:'ISO/TC 12/SC 2'}];
 globalThis.__radarIsoWindowed={
  current:async()=>missing?null:{generation:'g',summary:{release:'r',datasets:{deliverables:{count:2},committees:{count:1}}}},
  groupIndexStatus:async()=>({generation:'g',ready:true}),
  hierarchy:(dimension,r)=>dimension==='ics'?r.icsCodes.flatMap(s=>['01',s]):['ISO/TC 12',r.ownerCommittee],
  page:async ({type='deliverables',after,dimension,limit})=>{
    let rows=type==='committees'?[{id:'c',reference:'ISO/TC 12'}]:docs;
    if(dimension==='ics')rows=docs.filter(r=>r.icsCodes.some(s=>s.startsWith('01')));
    if(dimension==='committee')rows=docs;
    const start=after===null||after===undefined?0:Number(after)+1;
    const records=rows.slice(start,start+limit);
    return {records,next:start+limit<rows.length?String(start+limit-1):null};
  },get:async({id})=>docs.find(r=>r.id===id)||null
 };
 globalThis.w2ui={standardReferencesGrid:{records:[{recid:1}]}};
}
test('two windows and group checks pass without full-array API',async()=>{setup();const r=await run({limit:1});assert.equal(r.status,'passed');assert.equal(r.checks.deliverables.noOverlap,true);assert.equal(r.checks.icsParent.membershipValid,true);});
test('no active generation reports error',async()=>{setup({missing:true});assert.equal((await run()).status,'error');});
test('API missing reports error not unhandled rejection',async()=>{delete globalThis.__radarIsoWindowed;assert.equal((await run()).status,'error');});
test('caps each page request to 100',async()=>{setup();const original=globalThis.__radarIsoWindowed.page;let seen=0;globalThis.__radarIsoWindowed.page=async options=>{seen=Math.max(seen,options.limit);return original(options);};await run({limit:100000});assert.equal(seen,100);});
test('does not claim full-memory proof from optional heap samples',async()=>{setup();const r=await run();assert.match(r.ui.note,/does not prove/);assert.equal(r.memory.before.available,false);});
test('does not change active generation',async()=>{setup();const api=globalThis.__radarIsoWindowed;const before=await api.current();await run();assert.deepEqual(await api.current(),before);});
test('record lookup matches sampled id',async()=>{setup();const r=await run();assert.deepEqual(r.checks.detail,{found:true,idMatches:true});});
