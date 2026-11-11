import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../js/radar-catalog-create-form.js',import.meta.url),'utf8');
function fixture(status='draft'){
  const calls=[]; const positions=[{x:50,y:50}];
  const graph={extent:()=>({x1:0,x2:300,y1:0,y2:300}),nodes:()=>positions.map(p=>({position:()=>({...p})}))};
  const root={
    __radarRevisionSession:{status:()=>({activeGroup:'CATALOG_REVISION_0'})},
    __radarCatalogAdapter:{getRevision:()=>({status,revisionId:'rev1'})},
    __radarCatalogPersistence:{status:()=>({importedCatalogs:1}),ownsRevision:()=>true,listStandardsForDraft:()=>[{standardId:'std1',name:'Standard 1'}]},
    __radarCatalogCreation:{addBlipToActiveDraft:(g,r)=>{calls.push(['existing',g,r]);return {added:true};},addStandardBlipToActiveDraft:(g,r)=>{calls.push(['new',g,r]);return {added:true};}}
  };
  root.window=root;vm.runInNewContext(source,{window:root,Number,Math,Error,Object,String});
  return {form:root.__radarCatalogCreateForm,graph,calls,root};
}
test('read-only draft rejects published and archived before mutation',()=>{
  for(const status of ['published','archived']){
    const {form,graph,calls}=fixture(status);
    assert.throws(()=>form.submit(graph,'existing',{standardId:'std1',label:'Blip',ring:'Track',quadrant:'Available'}),/draft/);
    assert.equal(calls.length,0);
  }
});
test('existing standard uses known catalog id and stable viewport placement',()=>{
  const {form,graph,calls}=fixture();
  assert.equal(form.submit(graph,'existing',{standardId:'std1',label:'Blip',ring:'Track',quadrant:'Available'}).added,true);
  assert.equal(calls.length,1);assert.equal(calls[0][0],'existing');
  assert.equal(calls[0][2].standardId,'std1');
  assert.deepEqual({...calls[0][2].position}, {x:150+25,y:150});
});
test('new standard wraps name for transaction command',()=>{
  const {form,graph,calls}=fixture();
  form.submit(graph,'new',{standardName:'  ISO 123  ',label:' Blip ',ring:'Candidate',quadrant:'Developed'});
  assert.equal(calls[0][0],'new');assert.equal(calls[0][2].standard.name,'ISO 123');
  assert.equal(calls[0][2].label,'Blip');
});
test('invalid fields and unknown standard do not call engine',()=>{
  const {form,graph,calls}=fixture();
  assert.throws(()=>form.submit(graph,'existing',{standardId:'missing',label:'Blip',ring:'Track',quadrant:'Available'}),/Select a standard/);
  assert.throws(()=>form.submit(graph,'new',{standardName:'',label:'Blip',ring:'Track',quadrant:'Available'}),/name/);
  assert.throws(()=>form.submit(graph,'new',{standardName:'Valid',label:'',ring:'Track',quadrant:'Available'}),/required/);
  assert.equal(calls.length,0);
});
test('position search keeps existing nodes unchanged',()=>{
  const {form,graph}=fixture();const before=graph.nodes().map(n=>n.position());
  const p=form.initialPosition(graph);
  assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));
  assert.deepEqual(graph.nodes().map(n=>n.position()),before);
});
