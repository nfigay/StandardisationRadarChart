import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
function app() {
  const window = {crypto:{randomUUID:(() => {let n=0;return () => `uuid-${++n}`;})()}};
  window.window = window;
  const ctx = vm.createContext({window,console,Set,Map,Number,JSON,Error,AggregateError});
  for (const file of ['js/radar-revision-session.js','js/radar-catalog-adapter.js',
                      'js/radar-catalog-persistence.js','js/radar-catalog-creation.js']) {
    vm.runInContext(fs.readFileSync(new URL(file,root),'utf8'),ctx,{filename:file});
  }
  return window;
}
class Graph {
  constructor(){this.items=new Map();this.failAdd=false;this.partialAdd=false;this.addCalls=0;}
  $id(id){return {length:this.items.has(id)?1:0,id};}
  add(node){
    if(Array.isArray(node)) { for(const n of node)this.add(n);return; }
    this.addCalls++;
    if(this.failAdd)throw Error('add failed');
    if(this.items.has(node.data.id))throw Error('collision');
    this.items.set(node.data.id,structuredClone(node));
    if(this.partialAdd)throw Error('partial failure');
  }
  remove(ele){
    if(ele.length) this.items.delete(ele.id);
  }
  elements(){return {jsons:()=>[...this.items.values()],remove:()=>this.items.clear()};}
}
const standard={standardId:'std-existing',name:'Existing standard'};
const revision=(status='draft')=>({schemaVersion:'1.0.0',revisionId:'rev-1',radarId:'rad-1',
  ownerOrganizationId:'org-1',portfolioId:'port-1',status,version:'0.1.0',blips:[{
    blipId:'original',standardId:'std-existing',label:'Original',ring:'Adopted',quadrant:'Available',
    position:{x:10,y:20},context:{},extensions:{}
  }]});
function setup(status='draft') {
  const w=app(), graph=new Graph(), rev=revision(status);
  const catalog={schemaVersion:'1.0.0',organizations:[{organizationId:'org-1'}],
    portfolios:[{portfolioId:'port-1'}],standards:[structuredClone(standard)],assessments:[],radarRevisions:[rev]};
  const a=w.__radarCatalogAdapter,p=w.__radarCatalogPersistence,s=w.__radarRevisionSession;
  a.register('CATALOG_REVISION_0',rev);
  p.remember(catalog,{revisions:[{group:'CATALOG_REVISION_0',revisionId:'rev-1'}]});
  s.select(graph,'CATALOG_REVISION_0',()=>graph.add({group:'nodes',data:{id:'original',label:'Original',
    ring:'Adopted',quadrant:'Available',working_group:'CATALOG_REVISION_0',type:'business-object',
    radarchart:{blipId:'original',standardId:'std-existing',radarId:'rad-1',revisionId:'rev-1',
      ownerOrganizationId:'org-1',portfolioId:'port-1',context:{},extensions:{}}},position:{x:10,y:20}}));
  const request={label:'New blip',ring:'Candidate',quadrant:'Monitored',position:{x:50,y:60}};
  return {w,graph,p,a,s,request};
}
test('existing standard: incremental add, original untouched, exportable revision',()=>{
 const {w,graph,p,request}=setup();const old=structuredClone(graph.items.get('original'));
 const r=w.__radarCatalogCreation.addBlipToActiveDraft(graph,{...request,standardId:'std-existing'});
 assert.equal(r.added,true);assert.equal(r.standardId,'std-existing');assert.equal(graph.items.size,2);
 assert.deepEqual(graph.items.get('original'),old);
 assert.equal(p.build(graph).radarRevisions[0].blips.length,2);
 assert.equal(p.build(graph).standards.length,1);
});
test('new standard and blip commit once in single catalog',()=>{
 const {w,graph,p,request}=setup();
 const r=w.__radarCatalogCreation.addStandardBlipToActiveDraft(graph,{...request,standard:{name:'New standard'}});
 assert.equal(r.added,true);assert.equal(graph.items.size,2);
 assert.equal(graph.items.has(r.standardId),false,'standards are catalog records, not graph nodes');
 const built=p.build(graph);assert.equal(built.standards.length,2);
 assert.equal(built.standards[1].standardId,r.standardId);
 assert.equal(built.radarRevisions[0].blips[1].standardId,r.standardId);
});
for(const status of ['published','archived'])test(`${status} revision rejects both commands`,()=>{
 const {w,graph,request}=setup(status);const api=w.__radarCatalogCreation;
 assert.throws(()=>api.addBlipToActiveDraft(graph,{...request,standardId:'std-existing'}),/draft/);
 assert.throws(()=>api.addStandardBlipToActiveDraft(graph,{...request,standard:{name:'New'}}),/draft/);
 assert.equal(graph.items.size,1);
});
test('existing standard must be in private catalog',()=>{
 const {w,graph,request}=setup();
 assert.throws(()=>w.__radarCatalogCreation.addBlipToActiveDraft(graph,{...request,standardId:'missing'}),/standardId not found/);
 assert.equal(graph.items.size,1);
});
test('collision rejected prior to graph mutation',()=>{
 const {w,graph,request}=setup();
 assert.throws(()=>w.__radarCatalogCreation.addBlipToActiveDraft(graph,{...request,standardId:'std-existing',blipId:'original'}),/already present/);
 assert.equal(graph.addCalls,1);
});
test('non-finite position rejected',()=>{
 const {w,graph,request}=setup();
 assert.throws(()=>w.__radarCatalogCreation.addBlipToActiveDraft(graph,{...request,standardId:'std-existing',position:{x:Infinity,y:1}}),/position/);
 assert.equal(graph.items.size,1);
});
test('graph add failure leaves persistence unchanged',()=>{
 const {w,graph,p,request}=setup();graph.failAdd=true;
 assert.throws(()=>w.__radarCatalogCreation.addBlipToActiveDraft(graph,{...request,standardId:'std-existing'}),/add failed/);
 assert.equal(graph.items.size,1);assert.equal(p.build(graph).radarRevisions[0].blips.length,1);
});
test('partially applied graph add is rolled back',()=>{
 const {w,graph,p,request}=setup();graph.partialAdd=true;
 assert.throws(()=>w.__radarCatalogCreation.addStandardBlipToActiveDraft(graph,{...request,standard:{name:'New'}}),/partial failure/);
 assert.equal(graph.items.size,1);assert.equal(p.build(graph).standards.length,1);
});
test('persistence commit failure rolls graph back without touching originals',()=>{
 const {w,graph,p,request}=setup();
 const original=graph.items.get('original');
 const valid=p.validateCreation.bind(p);
 // Emulate a concurrent catalog conflict emerging between preflight and commit.
 let calls=0;
 w.__radarCatalogPersistence={...p,validateCreation(arg){if(++calls===2)throw Error('commit failure');return valid(arg);},
  commitCreation(arg){this.validateCreation(arg);}};
 assert.throws(()=>w.__radarCatalogCreation.addBlipToActiveDraft(graph,{...request,standardId:'std-existing'}),/commit failure/);
 assert.equal(graph.items.size,1);assert.deepEqual(graph.items.get('original'),original);
 assert.equal(p.build(graph).radarRevisions[0].blips.length,1);
});
test('session selection away and back preserves inserted blip/position',()=>{
 const {w,graph,request,s}=setup();
 const r=w.__radarCatalogCreation.addBlipToActiveDraft(graph,{...request,standardId:'std-existing'});
 s.select(graph,'legacy',()=>{});s.select(graph,'CATALOG_REVISION_0',()=>{});
 assert.deepEqual(graph.items.get(r.blipId).position,{x:50,y:60});
});
test('missing assessment reference rejected before cy.add',()=>{
 const {w,graph,request}=setup();
 assert.throws(()=>w.__radarCatalogCreation.addBlipToActiveDraft(graph,{...request,standardId:'std-existing',assessmentId:'missing'}),/assessmentId not found/);
 assert.equal(graph.addCalls,1);
});

test('bundled Cytoscape real headless: creation, export and position retention',()=>{
  const cyModule={exports:{}};
  const cyContext=vm.createContext({module:cyModule,exports:{},console});
  vm.runInContext(fs.readFileSync(new URL('lib/cytoscape.min.js',root),'utf8'),
    cyContext, {filename:'cytoscape.min.js'});
  assert.equal(typeof cyModule.exports,'function');
  const graph=vm.runInContext('module.exports({headless:true,styleEnabled:false,elements:[]})',cyContext);
  const w=app(),rev=revision(),a=w.__radarCatalogAdapter,p=w.__radarCatalogPersistence,s=w.__radarRevisionSession;
  const catalog={schemaVersion:'1.0.0',organizations:[{organizationId:'org-1'}],
    portfolios:[{portfolioId:'port-1'}],standards:[structuredClone(standard)],assessments:[],radarRevisions:[rev]};
  a.register('CATALOG_REVISION_0',rev);
  p.remember(catalog,{revisions:[{group:'CATALOG_REVISION_0',revisionId:'rev-1'}]});
  s.select(graph,'CATALOG_REVISION_0',()=>a.project('CATALOG_REVISION_0').nodes.forEach(node=>graph.add(node)));
  const original=graph.$id('original').position();
  const result=w.__radarCatalogCreation.addStandardBlipToActiveDraft(graph,{
    label:'Real cy',ring:'Track',quadrant:'Developed',position:{x:77,y:88},
    standard:{name:'New standard for real graph'}
  });
  assert.equal(graph.nodes().length,2);
  assert.equal(graph.$id(result.blipId).data('radarchart').standardId,result.standardId);
  assert.deepEqual({x:graph.$id('original').position().x,y:graph.$id('original').position().y},
    {x:original.x,y:original.y});
  const exported=p.build(graph);
  assert.equal(exported.standards.length,2);
  assert.equal(exported.radarRevisions[0].blips.length,2);
  assert.equal(exported.radarRevisions[0].blips[1].position.x,77);
  graph.destroy();
});
test('legacy/non-catalog group cannot use catalog creation commands',()=>{
 const w=app(), graph=new Graph();
 w.__radarRevisionSession.select(graph,'legacy',()=>{});
 assert.throws(()=>w.__radarCatalogCreation.addBlipToActiveDraft(graph,
   {standardId:'std-existing',label:'x',ring:'Adopted',quadrant:'Available',position:{x:1,y:2}}),
  /not an imported catalog revision/);
 assert.equal(graph.addCalls,0);
});
test('duplicate standardId is rejected without changing graph or catalog',()=>{
 const {w,graph,p,request}=setup();
 assert.throws(()=>w.__radarCatalogCreation.addStandardBlipToActiveDraft(graph,
   {...request,standard:{standardId:'std-existing',name:'Duplicated'}}),/duplicate standardId/);
 assert.equal(graph.items.size,1);assert.equal(p.build(graph).standards.length,1);
});
