import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const panel=readFileSync(new URL('../js/radar-standards-panel.js',import.meta.url),'utf8');
const begin=panel.indexOf(' function showDetail(record){');
const end=panel.indexOf('\n function ',begin+10);
const detail=panel.slice(begin,end);
const start=detail.indexOf('   const relationIds=');
const stop=detail.indexOf('   let recordData=',start);
const definitions=detail.slice(start,stop);
const later=detail.indexOf('   const relationSource=root.__radarIsoWindowed;');
const laterEnd=detail.lastIndexOf('\n }');
const update=detail.slice(later,laterEnd);

function prepare({item,cache={},initial={},nativeReference=false}){
  const ctx={item,record:{nativeReference},findDeliverable:id=>initial[String(id)],tr:(_key,{id})=>`ISO record ${id} — missing from cache`};
  vm.runInNewContext(definitions+'\n globalThis.relations={relationIds,relationRecords,resolveRelations};',ctx);
  ctx.root={__radarIsoWindowed:{get:async ({id})=>cache[String(id)]||null}};
  ctx.windowedActive=true;
  ctx.local=null;
  ctx.disposed=false;
  ctx.activeDetailRecord={id:'active'};
  ctx.detail=ctx.activeDetailRecord;
  ctx.form={record:{},refresh(){this.refreshes=(this.refreshes||0)+1;}};
  return ctx;
}
async function reconcile(ctx){
  vm.runInNewContext(update,ctx);
  for(let n=0;n<8;n++)await new Promise(resolve=>setImmediate(resolve));
}

test('C3-R3 detail resolves AP242 ISO IDs from windowed IndexedDB by the same ID contract as the editions view',async()=>{
  const item={id:'66654',reference:'ISO 10303-242:2020',replaces:[57620,72059],replacedBy:[84667],scope:'Original AP242 scope'};
  const cache={57620:{id:'57620',reference:'ISO 10303-242:2014'},72059:{id:'72059',reference:'ISO 10303-242:2014/Cor 1:2016'},84667:{id:'84667',reference:'ISO 10303-242:2022'}};
  const before=JSON.stringify(item);
  const ctx=prepare({item,cache});
  assert.deepEqual(Array.from(ctx.relations.relationIds),['57620','72059','84667']);
  await reconcile(ctx);
  assert.equal(ctx.form.record.replaces,'ISO 10303-242:2014\nISO 10303-242:2014/Cor 1:2016');
  assert.equal(ctx.form.record.replacedBy,'ISO 10303-242:2022');
  assert.equal(ctx.form.refreshes,1);
  assert.equal(JSON.stringify(item),before,'source metadata remains unchanged');
  assert.doesNotMatch(update,/\bfetch\s*\(|importIsoReference\s*\(|\.put\s*\(|\.save\s*\(/);
});

test('C3-R3 missing, failed, and mismatched ISO ID lookups remain unresolved rather than invented',async()=>{
  const item={reference:'ISO 10303-242:2020',replaces:['57620','72059'],replacedBy:['84667']};
  const ctx=prepare({item,cache:{57620:{id:'other',reference:'ISO 10303-242:2014'},72059:{id:'72059',reference:''}}});
  ctx.root.__radarIsoWindowed.get=async({id})=>{if(id==='84667')throw Error('No cache');return {57620:{id:'other',reference:'bad'},72059:{id:'72059',reference:''}}[id];};
  await reconcile(ctx);
  assert.match(ctx.form.record.replaces,/ISO record 57620/);
  assert.match(ctx.form.record.replacedBy,/ISO record 84667/);
});

test('C3-R3 stale dialog cannot be updated after closing or replacement',async()=>{
  const item={reference:'ISO 10303-242:2020',replaces:['57620'],replacedBy:[]};
  const ctx=prepare({item,cache:{57620:{id:'57620',reference:'ISO 10303-242:2014'}}});
  ctx.disposed=true;
  await reconcile(ctx);
  assert.equal(ctx.form.refreshes,undefined);
  const other=prepare({item,cache:{57620:{id:'57620',reference:'ISO 10303-242:2014'}}});
  other.activeDetailRecord={id:'new'};
  await reconcile(other);
  assert.equal(other.form.refreshes,undefined);
});

test('C3-R3 keeps legacy A8.2 isolated ISO form with optional resolver, and source metadata untouched',()=>{
  assert.match(detail,/typeof isoEditionSeries!=='undefined'/);
  assert.match(detail,/scopeFr:line\(scopes\.fr\)/);
  assert.match(detail,/scopeEn:line\(scopes\.en\|\|item\.scope\)/);
  assert.match(update,/if\(disposed\|\|activeDetailRecord!==detail\)return/);
  assert.match(update,/form\.refresh\?\.\(\)/);
});
