import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {patchRadar,patchDistribution} from '../tools/radar-s14k-patch.mjs';
const root=new URL('../',import.meta.url);
function load(name,window){runInNewContext(readFileSync(new URL('js/'+name,root),'utf8'),{window,TextDecoder,Date,Set,Map,Promise,Blob});}
function dbMock(fail=false){
 const state={deliverables:[{id:'old'}],committees:[{id:'old'}],sync:[{type:'deliverables',release:'old'},{type:'committees',release:'old'}]};
 const mock={open(){const req={};queueMicrotask(()=>{req.result={objectStoreNames:{contains:()=>true},transaction(names){const next=structuredClone(state);const tx={error:null,objectStore(type){return {clear(){next[type]=[];},put(rec){if(fail&&rec.id==='2')throw Error('Quota');const n=next[type].findIndex(x=>(x.id||x.type)===(rec.id||rec.type));if(n===-1)next[type].push(rec);else next[type][n]=rec;}};},abort(){tx.aborted=true;queueMicrotask(()=>tx.onabort?.());}};queueMicrotask(()=>{if(!tx.aborted){Object.assign(state,next);tx.oncomplete?.();}});return tx;},close(){}};req.onsuccess?.();});return req;}};
 return {mock,state};
}
const normalize=(type,x)=>x;
function scene(fail=false){const {mock,state}=dbMock(fail),window={indexedDB:mock,__radarIsoOpenData:{normalize}};load('radar-catalog-atomic.js',window);return {api:window.__radarCatalogAtomic,state};}
const blob=rows=>new Blob([rows.map(x=>JSON.stringify(x)).join('\n')+'\n']);
test('targeted patch and idempotence',()=>{
 const html='<script src="./js/radar-catalog-distribution.js"></script>';
 const patched=patchRadar(html);assert.match(patched,/radar-catalog-atomic/);assert.equal(patchRadar(patched),patched);
 const original=readFileSync(new URL('fixtures/radar-catalog-distribution-s14i.js',import.meta.url),'utf8');
 const changed=patchDistribution(original);assert.match(changed,/atomic.importPair/);assert.equal(patchDistribution(changed),changed);
});
test('rejects duplicate record before touching cache',async()=>{const {api,state}=scene();await assert.rejects(api.importPair({deliverables:blob([{id:'1'},{id:'1'}]),committees:blob([{id:'3'}])}),/dupliqué/);assert.equal(state.deliverables[0].id,'old');});
test('rejects malformed JSON before touching cache',async()=>{const {api,state}=scene();await assert.rejects(api.importPair({deliverables:new Blob(['{bad']),committees:blob([{id:'3'}])}),/JSONL/);assert.equal(state.committees[0].id,'old');});
test('checks counts and changes both stores together',async()=>{const {api,state}=scene();await assert.rejects(api.importPair({deliverables:blob([{id:'1'}]),committees:blob([{id:'3'}])},{expectedRecords:{deliverables:2,committees:1}}),/nombre/);assert.equal(state.deliverables[0].id,'old');const result=await api.importPair({deliverables:blob([{id:'1'}]),committees:blob([{id:'3'}])},{release:'r2',expectedRecords:{deliverables:1,committees:1}});assert.equal(result.release,'r2');assert.equal(state.deliverables[0].id,'1');assert.equal(state.committees[0].id,'3');assert.equal(state.sync[0].release,'r2');});
test('failed write aborts without changing old cache',async()=>{const {api,state}=scene(true);await assert.rejects(api.importPair({deliverables:blob([{id:'2'}]),committees:blob([{id:'3'}])}),/Quota/);assert.equal(state.deliverables[0].id,'old');assert.equal(state.committees[0].id,'old');});
test('correlation distinguishes proven id vs tentative designation and formats deltas',()=>{const window={};load('radar-catalog-followed.js',window);const api=window.__radarCatalogFollowed;const list=api.correlate([{id:'123',reference:'ISO 100',fields:['currentStage'],before:{currentStage:'10'},after:{currentStage:'20'}},{id:'999',reference:'ISO 200'}],[{standardId:'a',sourceRecordId:'123',reference:'ISO 100'},{standardId:'b',reference:'ISO 200'}]);assert.equal(list[0].followed[0].standardId,'a');assert.equal(list[0].candidates.length,0);assert.equal(list[1].candidates[0].confidence,'designation-only');assert.deepEqual(JSON.parse(JSON.stringify(api.fieldDetails(list[0]))),[{field:'currentStage',before:'10',after:'20'}]);});
