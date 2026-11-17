import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const panel=readFileSync(new URL('../js/radar-standards-panel.js',import.meta.url),'utf8');
const detail=panel.slice(panel.indexOf(' function showDetail(record){'),panel.indexOf('\n function ',panel.indexOf(' function showDetail(record){')+10));
const resolverStart=panel.indexOf(' const isoEditionSeries=(function(){');
const resolverEnd=panel.indexOf(' root.__radarIsoEditionSeries=isoEditionSeries;',resolverStart);
const ctx={};vm.runInNewContext(panel.slice(resolverStart,resolverEnd)+'\n globalThis.isoEditionSeries=isoEditionSeries;',ctx);

test('C3-R2: ISO edition command is offered for a documentary record and a stored ISO snapshot',()=>{
  assert.match(detail,/const editionFamily=typeof isoEditionSeries!=='undefined'&&isoEditionSeries\?\.family\?\.\(item\.reference\)/);
  assert.match(detail,/if\(!local&&record\.kind==='standard'&&editionFamily\)\{/);
  assert.doesNotMatch(detail,/if\(!local&&!record\.nativeReference&&record\.kind==='standard'&&editionFamily\)/);
  assert.match(detail,/editions\.setAttribute\('data-iso-editions',''\)/);
  assert.match(detail,/header\.appendChild\(editions\)/);
  const family=ctx.isoEditionSeries.family('ISO 10303-242:2020');assert.equal(family,'10303-242');
  const canOpen=({local,record,editionFamily})=>!local&&record.kind==='standard'&&editionFamily;
  assert.equal(canOpen({local:null,record:{kind:'standard',nativeReference:false},editionFamily:family}),family);
  assert.equal(canOpen({local:null,record:{kind:'standard',nativeReference:true},editionFamily:family}),family);
  assert.equal(canOpen({local:{},record:{kind:'local'},editionFamily:family}),false);
});

test('C3-R2: ISO lookup separates publication types and does not mislabel a rectificatif',()=>{
  const rows=[
    {id:'57620',reference:'ISO 10303-242:2014',edition:1},
    {id:'72059',reference:'ISO 10303-242:2014/Cor 1:2016',edition:1},
    {id:'66654',reference:'ISO 10303-242:2020',edition:2},
    {id:'84667',reference:'ISO 10303-242:2022',edition:3},
    {id:'84300',reference:'ISO 10303-242:2025',edition:4},
    {id:'93277',reference:'ISO/CD 10303-242'}
  ];
  const result=ctx.isoEditionSeries.collect(rows[2],rows);
  assert.equal(result.rows.filter(x=>x.kind==='edition').length,4);
  assert.equal(result.rows.filter(x=>x.kind==='corrigendum').length,1);
  assert.equal(result.rows.filter(x=>x.kind==='project').length,1);
  assert.match(detail,/\['corrigendum',editionLanguage==='fr'\?'Rectificatifs'/);
  assert.match(detail,/\['project',editionLanguage==='fr'\?'Projets'/);
});

test('C3-R2: unresolved source IDs are not portrayed as verified ISO standard references',()=>{
  const subject={reference:'ISO 10303-242:2020',replaces:['57620','72059'],replacedBy:['84667']};
  const edges=ctx.isoEditionSeries.relations(subject,[subject]);
  assert.equal(edges.length,3);
  assert.ok(edges.every(x=>x.record===null));
  assert.match(detail,/référence non résolue dans le cache/);
  assert.match(detail,/lien non vérifié/);
  assert.match(detail,/edge\.record\?\.reference/);
  assert.match(detail,/https:\/\/www\.iso\.org\/standard\//);
});

test('C3-R2: dialog is read-only, bounded to local ISO cache, without automatic online calls',()=>{
  const start=detail.indexOf('   // C3: explicit, bounded lookup');
  const end=detail.indexOf("   const close=d.createElement('button')",start);
  assert.ok(start>=0&&end>start);
  const segment=detail.slice(start,end);
  assert.match(segment,/for\(let i=0;i<5;i\+\+\)/);
  assert.match(segment,/source\.get\(\{type:'deliverables',id\}\)/);
  assert.match(segment,/source\.page\(\{type:'deliverables'/);
  assert.doesNotMatch(segment,/\bfetch\s*\(|importIsoReference\(|save\(|put\(/);
  assert.match(segment,/natives?/i); // descriptive native snapshot handling
});
