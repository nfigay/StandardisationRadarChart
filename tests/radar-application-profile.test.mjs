import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createContext,runInContext} from 'node:vm';
import {webcrypto} from 'node:crypto';

import {catalog} from './fixtures/roadmap-client-catalog.mjs';

const copy=x=>JSON.parse(JSON.stringify(x));

function nativeCatalog(status='published'){
  const result=catalog(status);

  result.schemaVersion='1.0.0';

  for(const revision of result.radarRevisions){
    revision.schemaVersion='1.0.0';

    for(const blip of revision.blips){
      blip.ring='Adopted';
      blip.quadrant='Available';
      blip.position={x:310,y:325};
    }
  }

  return result;
}

function environment(search=''){
  const toolbar={
    item:{items:[]},
    get(id){
      return id==='item2'?this.item:null;
    },
    set(id,patch){
      Object.assign(this.item,patch);
    },
    refresh(){}
  };

  const root={
    URLSearchParams,
    location:{search},
    crypto:webcrypto,
    w2ui:{toolbar}
  };

  const context=createContext({
    window:root,
    console,
    w2form:function(config){
      Object.assign(this,config);
    }
  });

  const files=[
    'radar-application-profile.js',
    'radar-revision-session.js',
    'radar-catalog-adapter.js',
    'radar-catalog-persistence.js',
    'radar-catalog-creation.js',
    'radar-catalog-ui.js',
    'radar-workspace-explorer.js',
    'radar-radar-admin.js',
    'radar.js'
  ];

  for(const name of files){
    runInContext(
      readFileSync('js/'+name,'utf8'),
      context,
      {filename:name}
    );
  }

  return {
    root,context,toolbar,
    profile:root.__radarApplicationProfile
  };
}

test('profiles: creator default, viewer and unknown fail closed',()=>{
  const creator=environment().profile;

  assert.equal(creator.name,'creator');
  assert.equal(creator.viewer,false);
  assert.ok(creator.allows('catalog.create'));
  assert.ok(creator.allows('publication.create'));

  const viewer=environment(
    '?profile=viewer'
  ).profile;

  assert.ok(viewer.allows('catalog.open'));
  assert.ok(viewer.allows('radar.consult'));

  for(const capability of [
    'catalog.create',
    'catalog.admin',
    'radar.edit',
    'revision.create',
    'revision.publish',
    'publication.create'
  ]){
    assert.equal(
      viewer.allows(capability),
      false
    );
  }

  const invalid=environment(
    '?profile=unknown'
  ).profile;

  assert.equal(invalid.valid,false);
  assert.equal(invalid.capabilities.length,0);

  const duplicate=environment(
    '?profile=viewer&profile=creator'
  ).profile;

  assert.equal(duplicate.valid,false);
  assert.equal(duplicate.capabilities.length,0);
});

test('profiles: filter existing W2UI commands',()=>{
  const {profile}=environment('?profile=viewer');

  const items=[
    {
      id:'files',
      items:[
        {id:'newcatalog'},
        {id:'loadcatalogjson'},
        {id:'savecatalogjson'}
      ]
    },
    {
      id:'radartools',
      items:[
        {id:'createdraft'},
        {id:'selectcatalogrevision'},
        {id:'publishcatalogrevision'}
      ]
    },
    {id:'layouts',items:[{id:'random'}]}
  ];

  assert.deepEqual(
    copy(profile.filterMainMenu(items)),
    [
      {
        id:'files',
        items:[{id:'loadcatalogjson'}]
      },
      {
        id:'radartools',
        items:[{id:'selectcatalogrevision'}]
      }
    ]
  );

  assert.equal(items[0].items.length,3);

  assert.ok(
    profile.allowsToolbar('item2:catrev_0')
  );

  assert.equal(
    profile.allowsToolbar('item4:grabon'),
    false
  );

  assert.equal(
    profile.allowsMenu('radartools:createdraft'),
    false
  );
});

test('viewer: native catalog loads, drafts rejected before registration',()=>{
  const {root,toolbar}=environment(
    '?profile=viewer'
  );

  const ui=root.__radarCatalogUI;
  const adapter=root.__radarCatalogAdapter;

  assert.throws(
    ()=>ui.load(nativeCatalog('draft'),toolbar),
    /published revisions only/
  );

  assert.equal(adapter.status().length,0);
  assert.equal(toolbar.item.items.length,0);

  const data=nativeCatalog();

  const summary=ui.load(data,toolbar);

  assert.equal(summary.registered,1);

  root.__radarCatalogPersistence.remember(
    data,summary
  );

  root.__radarWorkspaceExplorer.addCatalog(
    data,summary
  );

  const group=summary.revisions[0].group;

  assert.equal(
    adapter.getRevision(group).status,
    'published'
  );

  const projected=adapter.project(group);

  assert.deepEqual(
    copy(projected.nodes[0].position),
    {x:310,y:325}
  );

  assert.equal(ui.isReadOnly(),true);
});

test('viewer: real mutation services reject direct calls',()=>{
  const {root}=environment('?profile=viewer');

  const ui=root.__radarCatalogUI;
  const persistence=root.__radarCatalogPersistence;
  const explorer=root.__radarWorkspaceExplorer;
  const adapter=root.__radarCatalogAdapter;
  const session=root.__radarRevisionSession;

  const operations=[
    ()=>ui.createNewCatalog(),
    ()=>ui.createOrOpenDraft(),
    ()=>ui.transitionActiveRevision('publish'),
    ()=>ui.unregister('x'),
    ()=>persistence.registerDraft(),
    ()=>persistence.declareLocalReference(),
    ()=>persistence.validateCreation(),
    ()=>persistence.commitCreation(),
    ()=>persistence.transitionRevision(),
    ()=>persistence.removeGroup(),
    ()=>persistence.renameRadar(),
    ()=>persistence.renameRevisionLabel(),
    ()=>persistence.build(),
    ()=>explorer.loadASD([]),
    ()=>explorer.remove('x'),
    ()=>explorer.draftAdded('x'),
    ()=>adapter.unregister('x'),
    ()=>adapter.replaceRevision(),
    ()=>session.adoptLoaded(),
    ()=>session.removeGroup(),
    ()=>root.__radarRadarAdmin.open('radar')
  ];

  for(const operation of operations){
    assert.throws(
      operation,
      error=>error.code==='CAPABILITY_DENIED'
    );
  }

  assert.equal(
    persistence.status().importedCatalogs,
    0
  );

  assert.equal(adapter.status().length,0);
});

test('viewer: shared radar session and positions',()=>{
  const {root,context,toolbar}=environment(
    '?profile=viewer'
  );

  const data=nativeCatalog();

  const second=copy(data.radarRevisions[0]);

  second.revisionId='rev-2';
  second.version='2.0.0';
  second.blips[0].blipId='b2';
  second.blips[0].position={x:500,y:300};

  data.radarRevisions.push(second);

  const summary=root.__radarCatalogUI.load(
    data,toolbar
  );

  let elements=[];
  let locked=false;

  const graph={
    elements(){
      return {
        remove(){elements=[];},
        jsons(){return copy(elements);}
      };
    },
    add(items){
      elements.push(...copy(items));
    },
    nodes(){
      return {
        ungrabify(){locked=true;},
        grabify(){locked=false;}
      };
    }
  };

  context.cy=graph;

  root.__radarViewportSync=()=>true;

  const draw=runInContext(
    'drawSelectedWorkgroup',
    context
  );

  const first=summary.revisions[0].group;
  const next=summary.revisions[1].group;

  draw(first);

  assert.ok(locked);
  assert.deepEqual(
    elements[0].position,
    {x:310,y:325}
  );

  // An incidental live graph modification must not
  // become a persistent Viewer session snapshot.
  elements[0].position={x:1,y:2};

  draw(next);

  assert.deepEqual(
    elements[0].position,
    {x:500,y:300}
  );

  draw(first);

  assert.deepEqual(
    elements[0].position,
    {x:310,y:325}
  );

  assert.throws(
    ()=>draw('PLM'),
    /published revision/
  );
});

test('viewer: same W2UI form, read-only fields and detached record',()=>{
  const {context}=environment(
    '?profile=viewer'
  );

  const data={
    id:'b1',
    label:'Standard A',
    ring:'Adopted',
    quadrant:'Available',
    description:'Reference description'
  };

  const element={
    isNode:()=>true,
    data:()=>data,
    position:()=>({x:310,y:325})
  };

  const createForm=runInContext(
    'generateFormFromCytoscapeElement',
    context
  );

  const form=createForm(element);

  assert.equal(
    form.name,
    'blipForm'
  );

  assert.equal(
    Object.keys(form.actions).length,
    0
  );

  function inspect(fields){
    for(const field of Object.values(fields)){
      if(field.fields)inspect(field.fields);
      else assert.equal(field.disabled,true);
    }
  }

  inspect(form.fields);

  form.record.label='Changed locally';

  assert.equal(
    data.label,
    'Standard A'
  );
});

test('creator: draft import and historical revision policy preserved',()=>{
  const {root,toolbar,profile}=environment();

  assert.equal(profile.viewer,false);

  const ui=root.__radarCatalogUI;

  const summary=ui.load(
    nativeCatalog('draft'),
    toolbar
  );

  assert.equal(summary.registered,1);

  const group=summary.revisions[0].group;

  assert.equal(
    root.__radarCatalogAdapter.getRevision(
      group
    ).status,
    'draft'
  );

  let editable=false;

  ui.afterSelect(group,{
    nodes:()=>({
      grabify(){editable=true;},
      ungrabify(){editable=false;}
    })
  });

  assert.equal(editable,true);
});
