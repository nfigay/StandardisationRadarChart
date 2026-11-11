import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const base = new URL('../', import.meta.url);
function load(window, names) {
  const context=vm.createContext({window, console, Map, Set, JSON, Error, Object, Number});
  for (const name of names) vm.runInContext(fs.readFileSync(new URL(name,base),'utf8'),context,{filename:name});
  return window;
}
function model() {
  const w={crypto:{randomUUID:()=> 'test-uuid'}}; w.window=w;
  load(w,['js/radar-revision-session.js','js/radar-catalog-adapter.js',
    'js/radar-catalog-persistence.js','js/radar-catalog-ui.js']);
  const c={schemaVersion:'1.0.0',organizations:[{organizationId:'o'}],portfolios:[{portfolioId:'p'}],
    standards:[],assessments:[],radarRevisions:[{schemaVersion:'1.0.0',revisionId:'r1',radarId:'rad',
      ownerOrganizationId:'o',portfolioId:'p',status:'draft',title:'Radar',version:'0.1.0',blips:[]}]};
  const toolbar={entries:[],mode:'grabon',get(id){
    if(id==='item2')return {items:this.entries}; if(id==='item4')return {selected:this.mode};
  },set(id,props){if(id==='item2' && props.items)this.entries=props.items;
    if(id==='item4' && props.selected)this.mode=props.selected;},refresh(){}};
  w.w2ui={toolbar};
  const summary=w.__radarCatalogUI.load(c,toolbar);
  w.__radarCatalogPersistence.remember(c,summary);
  const elements=[];
  let grabbable=true;
  const graph={nodes(){return {ungrabify(){grabbable=false;},grabify(){grabbable=true;},jsons(){return [];}};},
    elements(){return {jsons(){return [];},remove(){elements.length=0;}};},add(){}};
  w.__radarRevisionSession.select(graph,'CATALOG_REVISION_0',()=>{});
  return {w,c,toolbar,graph,grabbable:()=>grabbable};
}

test('transition refreshes workspace projection and toolbar from published adapter status',()=>{
  const x=model();let calls=0;
  x.w.__radarWorkspaceExplorer={refresh(){calls++;}};
  const result=x.w.__radarCatalogUI.transitionActiveRevision('publish',x.toolbar,x.graph);
  assert.equal(result.status,'published');
  assert.equal(calls,1);
  assert.equal(x.toolbar.mode,'locked');
  assert.equal(x.grabbable(),false);
  assert.match(x.toolbar.entries[0].text,/published/);
  assert.equal(x.w.__radarCatalogUI.isReadOnly(),true);
});

test('switching from published to draft restores editing mode, without changing published status',()=>{
  const x=model();
  x.w.__radarCatalogUI.transitionActiveRevision('publish',x.toolbar,x.graph);
  const draft=x.w.__radarCatalogUI.createOrOpenDraft(x.toolbar,x.graph,(g)=>x.w.__radarRevisionSession.select(x.graph,g,()=>{}));
  x.w.__radarCatalogUI.afterSelect(draft.group,x.graph);
  assert.equal(x.toolbar.mode,'grabon');
  assert.equal(x.grabbable(),true);
  assert.equal(x.w.__radarCatalogUI.isReadOnly(),false);
  assert.equal(x.w.__radarCatalogAdapter.getRevision('CATALOG_REVISION_0').status,'published');
});

test('archived revision remains locked and archive does not change positions',()=>{
  const x=model();
  x.w.__radarCatalogUI.transitionActiveRevision('publish',x.toolbar,x.graph);
  const result=x.w.__radarCatalogUI.transitionActiveRevision('archive',x.toolbar,x.graph);
  assert.equal(result.status,'archived');
  assert.equal(x.grabbable(),false);
  assert.equal(x.toolbar.mode,'locked');
});

test('historical workgroup selection does not reset node interaction policy',()=>{
  const x=model(); x.w.__radarCatalogUI.afterSelect('ASD_LEGACY',x.graph);
  assert.equal(x.toolbar.mode,'grabon');
  assert.equal(x.grabbable(),true);
});

function explorer() {
  const w={};w.window=w;
  const groups=new Map();let rendered=[];
  w.__radarCatalogAdapter={getRevision:g=>groups.get(g)||null};
  w.w2sidebar=function(args){
    const tree={nodes:[],selected:null,add(list){this.nodes=list;rendered=list;},refresh(){},
      get(id){const visit=(ns)=>{for(const n of ns){if(n.id===id)return n;const hit=visit(n.nodes||[]);if(hit)return hit;}return null;};return visit(this.nodes);},
      select(id){this.selected=id;},unselect(){this.selected=null;}};
    return tree;
  };
  load(w,['js/radar-workspace-explorer.js']);
  const e=w.__radarWorkspaceExplorer;
  e.initialize({mount:{addEventListener(){}},select(){},graph(){return {};}});
  const rev={revisionId:'r1',radarId:'rad',title:'Radar',status:'draft',version:'0.1.0',ownerOrganizationId:'o'};
  groups.set('CATALOG_REVISION_0',rev);
  e.addCatalog({organizations:[{organizationId:'o',name:'Org'}],radarRevisions:[rev]},
    {revisions:[{group:'CATALOG_REVISION_0'}]});
  return {w,e,groups,tree:()=>rendered};
}
test('workspace refresh reads status and label from adapter, never stale import projection',()=>{
  const {e,groups,tree}=explorer();
  const radar=()=>{
    function find(nodes){
      for(const node of nodes){
        if(node.workspaceGroup==='CATALOG_REVISION_0')
          return node;
        const child=find(node.nodes||[]);
        if(child)return child;
      }
      return null;
    }
    const revision=find(tree());
    assert.ok(revision,'Revision node must exist');
    return revision;
  };
  assert.match(radar().text,/Brouillon/);
  groups.set('CATALOG_REVISION_0',{...groups.get('CATALOG_REVISION_0'),status:'published'});
  e.refresh();
  assert.match(radar().text,/Publiée/);
  assert.equal(radar().icon,'fa fa-lock');
  groups.set('CATALOG_REVISION_0',{...groups.get('CATALOG_REVISION_0'),status:'archived'});
  e.refresh();
  assert.match(radar().text,/Archivée/);
});
