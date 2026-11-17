import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const panel=readFileSync(new URL('../js/radar-standards-panel.js',import.meta.url),'utf8');
const start=panel.indexOf(' const isoEditionSeries=(function(){');
const end=panel.indexOf(' root.__radarIsoEditionSeries=isoEditionSeries;',start);
assert.ok(start>0&&end>start,'C3 resolver installed');
const sandbox={};
vm.runInNewContext(panel.slice(start,end)+'\n globalThis.isoEditionSeries=isoEditionSeries;',sandbox);
const iso=sandbox.isoEditionSeries;
const records=[
 {id:'57620',reference:'ISO 10303-242:2014',edition:1,publicationDate:'2014-12'},
 {id:'72059',reference:'ISO 10303-242:2014/Cor 1:2016',edition:1},
 {id:'66654',reference:'ISO 10303-242:2020',edition:2},
 {id:'84667',reference:'ISO 10303-242:2022',edition:3},
 {id:'84300',reference:'ISO 10303-242:2025',edition:4},
 {id:'93277',reference:'ISO/CD 10303-242',edition:5},
 {id:'other',reference:'ISO 10303-243:2020',edition:1}
];
test('C3 resolves ISO AP242 family across separate edition and corrigendum records',()=>{
 const result=iso.collect(records[2],records);
 assert.equal(result.family,'10303-242');
 assert.equal(result.rows.length,6);
 assert.equal(result.rows.find(r=>r.id==='72059').kind,'corrigendum');
 assert.equal(result.rows.find(r=>r.id==='93277').kind,'project');
 assert.equal(result.rows.filter(r=>r.kind==='edition').length,4);
});
test('C3 missing cache relation stays unresolved, without invented reference',()=>{
 const actual={id:'66654',reference:'ISO 10303-242:2020',replaces:['57620','72059'],replacedBy:['84667']};
 const missing=iso.relations(actual,[actual]);
 assert.equal(missing.length,3);
 assert.ok(missing.every(x=>x.record===null));
 const partial=iso.relations(actual,[actual,records[0]]);
 assert.equal(partial[0].record.reference,'ISO 10303-242:2014');
 assert.equal(partial[1].record,null);
});
test('C3 does not merge different ISO parts or infer a replacement from the year',()=>{
 const out=iso.collect(records[2],[records[6],{id:'unrelated',reference:'ISO 10303-2420:2020'}]);
 assert.equal(out.rows.length,1);
 assert.equal(iso.family('ISO 9001:2015'),null);
});
test('C3 page traversal bounded and presentation remains read-only',()=>{
 assert.match(panel,/for\(let i=0;i<5;i\+\+\)/);
 assert.match(panel,/source\.page\(\{type:'deliverables',search:isoEditionSeries\.family\(item\.reference\),limit:100,after\}\)/);
 assert.match(panel,/source\.get\(\{type:'deliverables',id\}\)/);
 assert.match(panel,/header\.appendChild\(editions\)/);
 assert.doesNotMatch(panel.slice(panel.indexOf('   // C3: explicit, bounded lookup'),panel.indexOf("   const close=d.createElement('button')",panel.indexOf('   // C3: explicit, bounded lookup'))),/importIsoReference|fetch\(/);
});
