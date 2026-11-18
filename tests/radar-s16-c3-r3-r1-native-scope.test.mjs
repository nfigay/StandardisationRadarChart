import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const panel=readFileSync(new URL('../js/radar-standards-panel.js',import.meta.url),'utf8');
const start=panel.indexOf(' function showDetail(record){');
const end=panel.indexOf('\n function ',start+10);
assert.ok(start>=0&&end>start,'detail function located');
const detail=panel.slice(start,end);
const definitions=detail.slice(detail.indexOf('   const relationIds='),detail.indexOf('   let recordData='));
const update=detail.slice(detail.indexOf('   const relationSource=root.__radarIsoWindowed;'),detail.lastIndexOf('\n }'));

function context(nativeReference){
  let globalLookups=0,cacheLookups=0;
  const item={reference:'ISO 10303-242:2020',replaces:['57620','72059'],replacedBy:['84667']};
  const ctx={record:{nativeReference},item,findDeliverable(id){globalLookups++;if(nativeReference)throw Error('Unexpected global lookup');return {id,reference:'ISO '+id};},tr:(_, {id})=>'missing '+id};
  vm.runInNewContext(definitions+'\nthis.resolved={resolveRelations,relationIds};',ctx);
  ctx.local=null;ctx.windowedActive=true;ctx.root={__radarIsoWindowed:{get:async({id})=>{cacheLookups++;if(nativeReference)throw Error('Unexpected cache lookup');return {id,reference:'ISO '+id};}}};
  ctx.disposed=false;ctx.detail={};ctx.activeDetailRecord=ctx.detail;
  ctx.form={record:{},refresh(){this.count=(this.count||0)+1;}};
  return {ctx,get globalLookups(){return globalLookups;},get cacheLookups(){return cacheLookups;}};
}
async function flush(){for(let n=0;n<8;n++)await new Promise(resolve=>setImmediate(resolve));}

test('C3-R3-R1 Viewer snapshot keeps original ISO relation IDs without global or IndexedDB lookup',async()=>{
  const x=context(true);
  assert.equal(x.ctx.resolved.resolveRelations(x.ctx.item.replaces),'57620\n72059');
  assert.equal(x.ctx.resolved.resolveRelations(x.ctx.item.replacedBy),'84667');
  vm.runInNewContext(update,x.ctx);
  await flush();
  assert.equal(x.globalLookups,0);
  assert.equal(x.cacheLookups,0);
  assert.equal(x.ctx.form.refresh?.count,undefined);
  assert.equal(x.ctx.form.count,undefined);
});

test('C3-R3-R1 global ISO detail still resolves relations and performs cache reconciliation',async()=>{
  const x=context(false);
  assert.equal(x.ctx.resolved.resolveRelations(x.ctx.item.replaces),'ISO 57620\nISO 72059');
  assert.equal(x.globalLookups,3);
  vm.runInNewContext(update,x.ctx);
  await flush();
  assert.equal(x.cacheLookups,3);
  assert.equal(x.ctx.form.count,1);
  assert.equal(x.ctx.form.record.replacedBy,'ISO 84667');
});

test('C3-R3-R1 scope and native metadata are not rewritten, nor is the documentary snapshot mutated',()=>{
  assert.match(detail,/scopeFr:line\(scopes\.fr\)/);
  assert.match(detail,/scopeEn:line\(scopes\.en\|\|item\.scope\)/);
  assert.match(definitions,/if\(!record\.nativeReference\)/);
  assert.match(update,/!record\.nativeReference/);
  assert.doesNotMatch(definitions+update,/\bfetch\s*\(|\bimportIsoReference\s*\(/);
});
