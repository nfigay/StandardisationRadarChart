import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const src=readFileSync(new URL('../js/radar-iso-open-data.js',import.meta.url),'utf8');
const panelSrc=readFileSync(new URL('../js/radar-standards-panel.js',import.meta.url),'utf8');
function setup(){const window={};window.location ??= {href:'https://example.test/js/radar-standards-panel.js'};vm.runInNewContext(src+'\n'+panelSrc,{window,URL});return window;}
const std={id:62085,reference:'ISO 9001:2015',title:{en:'Quality management',fr:'Management de la qualité'},scope:{en:'Quality management systems'},icsCode:['03.100.70','03.120.10'],ownerCommittee:'ISO/TC 176/SC 2',currentStage:6060,edition:5};
const committee={id:200,reference:'ISO/TC 176',title:{en:'Quality management'},scope:{en:'Standardization of quality'},parentId:null};
const sc={id:201,reference:'ISO/TC 176/SC 2',title:{en:'Quality systems'},parentId:200};
const ics=[{identifier:'03',titleEn:'Services'},{identifier:'03.100',titleEn:'Company organization',parent:'03'},{identifier:'03.100.70',titleEn:'Management systems',parent:'03.100'},{identifier:'03.120.10',titleEn:'Quality management',parent:'03'}];
test('ISO deliverable normalization preserves multiple ICS, scope and committee',()=>{
 const d=setup().__radarIsoOpenData.normalize('deliverables',std);
 assert.deepEqual(Array.from(d.icsCodes),['03.100.70','03.120.10']);assert.equal(d.ownerCommittee,'ISO/TC 176/SC 2');assert.equal(d.scope,'Quality management systems');
});
test('ISO technical committee normalization preserves hierarchy',()=>{
 const a=setup().__radarIsoOpenData;assert.equal(a.normalize('committees',sc).parentId,'200');
});
test('ICS tree shows same ISO standard twice, preserving single source id',()=>{
 const w=setup();const s=w.__radarIsoOpenData.normalize('deliverables',std);
 const tree=w.__radarStandardsPanel.enrichedIcsTree(ics,[s]);
 assert.equal(tree.occurrences,2);
 const leaves=[];const scan=nodes=>nodes.forEach(x=>{if(x.kind==='standard')leaves.push(x);scan(x.w2ui?.children||[]);});scan(tree.records);
 assert.equal(leaves.length,2);assert.equal(leaves[0].isoId,leaves[1].isoId);assert.notEqual(leaves[0].recid,leaves[1].recid);
});
test('ICS term search finds title within hierarchical path',()=>{
 const w=setup();const s=w.__radarIsoOpenData.normalize('deliverables',std);
 const tree=w.__radarStandardsPanel.enrichedIcsTree(ics,[s],'Management de la qualité');
 assert.equal(tree.records.length,1);assert.equal(tree.records[0].identifier,'03');
});
test('Committee tree places standard under correct SC',()=>{
 const a=setup().__radarIsoOpenData;const c=[committee,sc].map(x=>a.normalize('committees',x));
 const tree=a.committeeTree(c,[a.normalize('deliverables',std)]);
 assert.equal(tree.length,1);assert.equal(tree[0].w2ui.children[0].w2ui.children[0].isoId,'62085');
});
test('Invalid source rows are rejected rather than invented',()=>{
 const a=setup().__radarIsoOpenData;assert.equal(a.normalize('deliverables',{}),null);assert.throws(()=>a.normalize('unknown',std));
});
test('HTML loads ISO module ahead of standards panel',()=>{
 const h=readFileSync(new URL('../radar.html',import.meta.url),'utf8');
 assert.ok(h.indexOf('radar-iso-open-data.js')<h.indexOf('radar-standards-panel.js'));
});
