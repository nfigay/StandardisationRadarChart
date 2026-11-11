import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
function fixture() {
  const window={crypto:{randomUUID:()=> 'fixed'}};
  window.window=window;
  const ctx=vm.createContext({window,console,Set,Map,Number,JSON,Error});
  for(const file of ['js/radar-revision-session.js','js/radar-catalog-adapter.js','js/radar-catalog-persistence.js','js/radar-catalog-ui.js'])
    vm.runInContext(fs.readFileSync(new URL(file,root),'utf8'),ctx,{filename:file});
  const revision={schemaVersion:'1.0.0',revisionId:'r1',radarId:'rad',ownerOrganizationId:'org',
    portfolioId:'p',status:'draft',version:'1.0.0',title:'Radar',blips:[{blipId:'b1',standardId:'s1',
    label:'First',ring:'Adopted',quadrant:'Available',position:{x:10,y:20},context:{},extensions:{}}]};
  const catalog={schemaVersion:'1.0.0',organizations:[{organizationId:'org'}],
    portfolios:[{portfolioId:'p'}],standards:[{standardId:'s1',name:'Standard'}],
    assessments:[],radarRevisions:[revision]};
  const adapter=window.__radarCatalogAdapter, persistence=window.__radarCatalogPersistence;
  const session=window.__radarRevisionSession;
  const group='CATALOG_REVISION_0';
  const menuItems=[];
  const toolbar={get(id){return id==='item2'?{items:menuItems}:null;},set(id,patch){if(patch.items)menuItems.splice(0,menuItems.length,...patch.items);},refresh(){}};
  const summary=window.__radarCatalogUI.load(catalog,toolbar);
  persistence.remember(catalog,summary);
  const nodes=[];
  const graph={
    nodes(){return {jsons:()=>structuredClone(nodes)};},
    elements(){return {jsons:()=>structuredClone(nodes),remove:()=>{nodes.length=0;}};},
    add(items){for(const node of items)nodes.push(structuredClone(node));}
  };
  session.select(graph,group,()=>graph.add(adapter.project(group).nodes));
  const data=()=>persistence.build(graph);
  return {window,adapter,persistence,session,group,graph,nodes,data,toolbar};
}
test('publishing captures positions, freezes revision, and exports published state',()=>{
  const x=fixture();x.nodes[0].position={x:125,y:250};
  const result=x.persistence.transitionRevision(x.graph,x.group,'r1','publish');
  assert.equal(result.status,'published');
  assert.equal(x.adapter.getRevision(x.group).status,'published');
  assert.equal(x.data().radarRevisions[0].status,'published');
  assert.deepEqual(x.data().radarRevisions[0].blips[0].position,{x:125,y:250});
  assert.throws(()=>x.persistence.transitionRevision(x.graph,x.group,'r1','publish'),/requires draft/);
});
test('archive only a published unchanged revision; preserve its snapshot',()=>{
  const x=fixture();x.persistence.transitionRevision(x.graph,x.group,'r1','publish');
  const before=structuredClone(x.data().radarRevisions[0].blips);
  const result=x.persistence.transitionRevision(x.graph,x.group,'r1','archive');
  assert.equal(result.status,'archived');
  assert.deepEqual(x.data().radarRevisions[0].blips,before);
  assert.equal(x.adapter.getRevision(x.group).status,'archived');
  assert.throws(()=>x.persistence.transitionRevision(x.graph,x.group,'r1','archive'),/requires published/);
});
test('published revision cannot be archived if graph data was changed unexpectedly',()=>{
  const x=fixture();x.persistence.transitionRevision(x.graph,x.group,'r1','publish');
  x.nodes[0].position.x=999;
  assert.throws(()=>x.persistence.transitionRevision(x.graph,x.group,'r1','archive'),/immutable revision/);
  assert.equal(x.adapter.getRevision(x.group).status,'published');
  assert.equal(x.data().radarRevisions[0].blips[0].position.x,10);
});
test('cannot transition a nonactive revision',()=>{
  const x=fixture();assert.throws(()=>x.persistence.transitionRevision(x.graph,'bad','r1','publish'),/not in catalog/);
  assert.equal(x.adapter.getRevision(x.group).status,'draft');
});
test('after publication, existing draft workflow creates linked editable revision',()=>{
  const x=fixture();x.persistence.transitionRevision(x.graph,x.group,'r1','publish');
  const r=x.window.__radarCatalogUI.createOrOpenDraft(x.toolbar,x.graph,(group)=>{
    x.session.select(x.graph,group,()=>{x.graph.elements().remove();x.graph.add(x.adapter.project(group).nodes);});
  });
  assert.equal(r.action,'created');
  assert.equal(x.adapter.getRevision(r.group).status,'draft');
  assert.equal(x.adapter.getRevision(r.group).extensions.lineage.basedOnRevisionId,'r1');
  assert.equal(x.data().radarRevisions.length,2);
  assert.equal(x.data().radarRevisions[0].status,'published');
  assert.equal(x.data().radarRevisions[1].status,'draft');
});
