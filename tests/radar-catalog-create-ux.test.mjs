import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../js/radar-catalog-create-form.js',import.meta.url),'utf8');
const uiSource=fs.readFileSync(new URL('../js/radar-catalog-ui.js',import.meta.url),'utf8');
function setup(){
 const calls=[];
 const root={
  __radarRevisionSession:{status:()=>({activeGroup:'CATALOG_REVISION_0'})},
  __radarCatalogAdapter:{getRevision:()=>({status:'draft',revisionId:'rev1'})},
  __radarCatalogPersistence:{status:()=>({importedCatalogs:1}),ownsRevision:()=>true,listStandardsForDraft:()=>[{standardId:'std1',name:'ISO 9001'}]},
  __radarCatalogCreation:{addBlipToActiveDraft:(_,req)=>{calls.push(req);return {added:true};},addStandardBlipToActiveDraft:(_,req)=>{calls.push(req);return {added:true};}}
 };
 const graph={extent:()=>({x1:0,x2:300,y1:0,y2:300}),nodes:()=>[]};
 vm.runInNewContext(source,{window:root,Number,Math,Error,Object,String});
 return {form:root.__radarCatalogCreateForm,graph,calls};
}
test('zone and quadrant are controlled values matching the supported legacy renderer',()=>{
 const {form}=setup();
 assert.deepEqual(Array.from(form.geometryOptions().rings),['Adopted','Candidate','Track']);
 assert.deepEqual(Array.from(form.geometryOptions().quadrants),['Available','Monitored','Participated','Developed']);
});
test('unknown zone or quadrant are rejected before the command engine',()=>{
 const {form,graph,calls}=setup();
 for(const [ring,quadrant] of [['Unknown','Available'],['Track','Unknown'],['','Available']]){
   assert.throws(()=>form.submit(graph,'existing',{standardId:'std1',label:'B',ring,quadrant}),/valid radar/);
 }
 assert.equal(calls.length,0);
});
test('search filters by name and id and bounds results without changing source',()=>{
 const {form}=setup();
 const records=[{standardId:'iso_9001',name:'Quality Management'},{standardId:'iso_27001',name:'Information Security'},{standardId:'other',name:'Quality Assurance'}];
 assert.deepEqual(Array.from(form.filterStandards(records,'iso_',10),s=>s.standardId),['iso_9001','iso_27001']);
 assert.deepEqual(Array.from(form.filterStandards(records,'QUALITY',1),s=>s.standardId),['iso_9001']);
 assert.equal(records.length,3);
});
test('new standard and existing standard remain separate engine paths',()=>{
 const {form,graph,calls}=setup();
 form.submit(graph,'new',{standardName:'ISO 123',label:'B',ring:'Track',quadrant:'Available'});
 form.submit(graph,'existing',{standardId:'std1',label:'B',ring:'Track',quadrant:'Available'});
 assert.equal(calls[0].standard.name,'ISO 123');
 assert.equal(calls[1].standardId,'std1');
});
test('revision picker is exposed without changing catalog loading or historical routing',()=>{
 const root={};vm.runInNewContext(uiSource,{window:root,Set,Map,Object,JSON,Array,Error});
 assert.equal(typeof root.__radarCatalogUI.openRevisionPicker,'function');
 assert.equal(typeof root.__radarCatalogUI.load,'function');
});
