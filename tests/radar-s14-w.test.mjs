import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
const source=readFileSync(resolve(dirname(fileURLToPath(import.meta.url)),'../js/radar-s14-w-functional-audit.js'),'utf8');
function boot(api){const module={exports:{}};runInNewContext(source,{module,globalThis:{__radarIsoWindowed:api,w2ui:{standardReferencesGrid:{records:Array(80)}}},console,Date,performance});return module.exports;}
function fixture({valid=true,sortReady=false}={}){
 const data=[{id:'a',reference:'ISO 1',title:'Zeta',titleI18n:{fr:'Zeta',en:'Zulu'},currentStage:'50',icsCodes:['07.010'],ownerCommittee:'ISO/TC 121'},
 {id:'b',reference:'ISO 2',title:'Alpha',titleI18n:{fr:'Alpha',en:'Alpha'},currentStage:'30',icsCodes:['07.020'],ownerCommittee:'ISO/TC 121'},
 {id:'c',reference:'ISO 3',title:'Beta',titleI18n:{fr:'Beta',en:'Beta'},currentStage:'40',icsCodes:['11'],ownerCommittee:'ISO/TC 1'}];
 let ready=sortReady,builds=0,maxLimit=0;
 const api={current:async()=>({generation:'g',summary:{release:'r'}}),sortIndexStatus:async()=>({ready}),ensureSortIndex:async({onProgress})=>{builds++;ready=true;onProgress({processed:3});return {ready:true,processed:3};},page:async q=>{
  maxLimit=Math.max(q.limit,maxLimit);
  let rows=data.filter(r=>(!q.icsFilter||r.icsCodes.includes(q.icsFilter))&&(!q.committeeFilter||r.ownerCommittee===q.committeeFilter)&&(!q.search||r.reference.toLowerCase().includes(q.search.toLowerCase())));
  const key=r=>q.sortField==='stage'?r.currentStage:q.sortField==='title'?r.titleI18n.fr:q.sortField==='titleEn'?r.titleI18n.en:r.reference;
  rows.sort((a,b)=>key(a).localeCompare(key(b))*(q.sortDirection==='desc'?-1:1));
  const start=q.after==null?0:Number(q.after);
  const result=rows.slice(start,start+q.limit);
  return {records:valid?result:result.reverse(),next:start+q.limit<rows.length?String(start+q.limit):null};
 }};
 return {api,stats:()=>({builds,maxLimit})};
}
test('backfills sort index and verifies real positive ICS+TC intersection',async()=>{
 const f=fixture();const result=await boot(f.api).run({limit:2});
 assert.equal(result.status,'passed');assert.equal(result.checks.combinedFiltersNonEmpty.knownIdFound,true);
 assert.equal(result.checks.combinedFiltersAndTextSearch.knownIdFound,true);
 assert.equal(f.stats().builds,1);assert.ok(f.stats().maxLimit<=100);
 assert.equal(result.checks.sort_title_asc.ordered,true);
});
test('does not rebuild already-ready index',async()=>{
 const f=fixture({sortReady:true});const result=await boot(f.api).run({limit:2});assert.equal(result.status,'passed');assert.equal(f.stats().builds,0);
});
test('reports index not ready when build disallowed',async()=>{
 const f=fixture();const result=await boot(f.api).run({limit:2,buildSortIndex:false});assert.equal(result.status,'partial');
});
test('rejects unreasonable page limits',async()=>{const f=fixture();await assert.rejects(boot(f.api).run({limit:501}),/limit/);});
test('graceful unavailable API',async()=>{const result=await boot({}).run();assert.equal(result.status,'error');});
