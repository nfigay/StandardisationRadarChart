import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const panel=readFileSync(new URL('../js/radar-standards-panel.js',import.meta.url),'utf8');
const guard="typeof isoEditionSeries!=='undefined'&&isoEditionSeries?.family?.(item.reference)";
test('C3-R1: ISO detail is compatible with the A8.2 isolated loader without the optional edition resolver',()=>{
  const start=panel.indexOf(' function showDetail(record){');
  const end=panel.indexOf('\n function ',start+10);
  assert.ok(start>=0 && end>start,'showDetail is isolated in the panel source');
  const showDetail=panel.slice(start,end);
  assert.ok(showDetail.includes(guard),'the optional resolver is explicitly guarded');
  const sample={kind:'standard',isoItem:{id:'66654',reference:'ISO 10303-242:2020'}};
  // Exercise the exact condition in a VM where the helper is absent,
  // as in the pre-existing A8.2 detail test. The old code threw ReferenceError.
  const condition=showDetail.match(/if\(!local&&record\.kind==='standard'&&editionFamily\)\{/);
  assert.ok(condition,'the command is guarded by editionFamily in showDetail');
  const expr=showDetail.match(/const editionFamily=(.*);/)[1];
  const missing=vm.runInNewContext(expr,{item:sample.isoItem});
  assert.equal(missing,false);
  const withResolver=vm.runInNewContext(expr,{item:sample.isoItem,isoEditionSeries:{family:ref=>ref.includes('10303-242')?'10303-242':null}});
  assert.equal(withResolver,'10303-242');
  // Stored ISO snapshots now expose the read-only navigation command too.
  assert.equal(vm.runInNewContext("!local&&record.kind==='standard'&&editionFamily",{local:null,record:{...sample,nativeReference:true},editionFamily:withResolver}),'10303-242');
});
test('C3-R1: ISO resolver remains intact and no catalogue mutation or fetch is added',()=>{
  assert.match(panel,/root\.__radarIsoEditionSeries=isoEditionSeries/);
  assert.match(panel,/header\.appendChild\(editions\)/);
  const segment=panel.slice(panel.indexOf('   // C3: explicit, bounded lookup'),panel.indexOf("   const close=d.createElement('button')",panel.indexOf('   // C3: explicit, bounded lookup')));
  assert.doesNotMatch(segment,/fetch\(|importIsoReference\(/);
});
