import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const clone=x=>JSON.parse(JSON.stringify(x));

function setup(status='published', source) {
  const w={
    crypto:{
      randomUUID:()=> 'test-uuid'
    }
  };

  const ctx=vm.createContext({
    window:w,
    console
  });

  for(const name of [
    'revision-session',
    'catalog-adapter',
    'catalog-persistence',
    'catalog-ui',
    'workspace-explorer',
    'revision-dialogs',
    'radar-admin'
  ]){
    vm.runInContext(
      readFileSync(
        new URL(
          '../js/radar-'+name+'.js',
          import.meta.url
        ),
        'utf8'
      ),
      ctx
    );
  }

  const c=source?clone(source):{
    schemaVersion:'1.0.0',
    title:'Recette',

    organizations:[
      {
        organizationId:'o',
        name:'Org'
      }
    ],

    portfolios:[
      {
        portfolioId:'p',
        ownerOrganizationId:'o',
        name:'Port'
      }
    ],

    standards:[
      {
        standardId:'s',
        name:'Norme'
      }
    ],

    assessments:[],

    radarRevisions:[
      {
        schemaVersion:'1.0.0',
        revisionId:'rev-2',
        radarId:'rad',
        ownerOrganizationId:'o',
        portfolioId:'p',
        status,
        version:'2.0.0',
        title:'Radar',

        blips:[
          {
            blipId:'b2',
            standardId:'s',
            label:'B',
            ring:'Adopted',
            quadrant:'Available',
            position:{
              x:500,
              y:300
            }
          }
        ]
      }
    ]
  };

  const toolbar={
    items:[],
    selected:null,
    mode:'grabon',

    get(id){
      return id==='item2'
        ?{
          items:this.items,
          selected:this.selected
        }
        :{
          selected:this.mode
        };
    },

    set(id,p){
      if(id==='item2'){
        if(p.items){
          this.items=p.items;
        }

        if('selected' in p){
          this.selected=p.selected;
        }

      }else if('selected' in p){
        this.mode=p.selected;
      }
    },

    refresh(){}
  };

  w.w2ui={toolbar};

  w.w2sidebar=function(){
    return w.testTree={
      nodes:[],
      selected:null,

      add(n){
        this.nodes=n;
      },

      refresh(){},
      get(){return null;},
      select(){},

      unselect(){
        this.selected=null;
      }
    };
  };

  let elements=[];

  const graph={
    elements(){
      return {
        jsons:()=>clone(elements),

        remove(){
          elements=[];
        }
      };
    },

    add(n){
      elements.push(...clone(n));
    },

    nodes(){
      return {
        jsons:()=>clone(elements),
        ungrabify(){},
        grabify(){}
      };
    }
  };

  const a=w.__radarCatalogAdapter;
  const p=w.__radarCatalogPersistence;
  const u=w.__radarCatalogUI;
  const s=w.__radarRevisionSession;
  const e=w.__radarWorkspaceExplorer;

  function select(group){

    s.select(
      graph,
      group,
      g=>{
        graph.elements().remove();
        graph.add(a.project(g).nodes);
      }
    );

    u.afterSelect(group,graph);
  }

  e.initialize({
    mount:{
      addEventListener(){}
    },

    select,

    graph:()=>graph
  });

  const summary=u.load(
    c,
    toolbar
  );

  p.remember(c,summary);

  const sourceId=e.addCatalog(
    c,
    summary
  );

  const parent=
    summary.revisions[0].group;

  e.activate(parent);

  return {
    c,w,a,p,u,s,e,
    graph,toolbar,parent,sourceId,

    select:g=>e.activate(g),

    draft:()=>u.createOrOpenDraft(
      toolbar,
      graph,
      select
    ),

    edit:(x,y)=>{
      elements[0].position={x,y};
    },

    node:()=>elements[0],

    build:()=>clone(
      p.build(graph)
    )
  };
}


function revisionNode(nodes,group){
  for(const node of nodes||[]){
    if(node.workspaceGroup===group)return node;
    const child=revisionNode(node.nodes,group);
    if(child)return child;
  }
  return null;
}

test(
  'common labels replace automatic ordinal without concatenation',
  ()=>{
    const x=setup();
    const d=x.w.__radarRevisionDialogs;
    const r=x.a.getRevision(x.parent);

    assert.equal(
      d.revisionName(r,0),
      'r1'
    );

    assert.equal(
      d.label(r,0),
      'r1 — 2.0.0 — Publiée'
    );

    x.p.renameRevisionLabel(
      r.revisionId,
      'r3'
    );

    assert.equal(
      d.label(r,0),
      'r3 — 2.0.0 — Publiée'
    );

    x.p.renameRevisionLabel(
      r.revisionId,
      'Reference initiale'
    );

    assert.equal(
      d.label(r,0),
      'Reference initiale — 2.0.0 — Publiée'
    );
  }
);

test(
  'rename dialog starts with current revision label instead of radar title',
  ()=>{
    const x=setup();

    let popup;
    let form;

    x.w.document={
      getElementById(){return {};}
    };

    x.w.w2popup={
      open(options){popup=options;},
      close(){}
    };

    x.w.w2form=function(options){
      form=options;
      this.record=options.record;
      this.render=()=>{};
      this.destroy=()=>{};
    };

    x.w.w2alert=()=>{};

    const admin=x.w.__radarRadarAdmin;

    admin.open('revision');

    const event={};

    popup.onOpen(event);
    event.onComplete();

    assert.equal(
      form.record.radarName,
      'r1'
    );

    x.p.renameRevisionLabel(
      'rev-2',
      'Reference initiale'
    );

    admin.open('revision');

    const event2={};

    popup.onOpen(event2);
    event2.onComplete();

    assert.equal(
      form.record.radarName,
      'Reference initiale'
    );

    admin.open('radar');

    const event3={};

    popup.onOpen(event3);
    event3.onComplete();

    assert.equal(
      form.record.radarName,
      'Radar'
    );
  }
);

test(
  'rename preserves revisions and survives catalog roundtrip',
  ()=>{
    const x=setup();

    const before=x.build();

    const renamed=x.p.renameRevisionLabel(
      'rev-2',
      'Reference initiale'
    );

    assert.equal(
      renamed.changed,
      true
    );

    const saved=x.build();

    assert.deepEqual(
      saved.radarRevisions,
      before.radarRevisions
    );

    assert.equal(
      saved.extensions.administration
        .revisionLabels['rev-2'],
      'Reference initiale'
    );

    assert.equal(
      saved.extensions.administration
        .nameHistory[0].previous,
      'r1'
    );

    const reopened=setup(
      'published',
      saved
    );

    assert.equal(
      reopened.p.getRevisionLabel('rev-2'),
      'Reference initiale'
    );

    assert.deepEqual(
      reopened.build(),
      saved
    );
  }
);

test(
  'rename rejects existing label in same radar without changing catalog',
  ()=>{
    const x=setup();

    const draft=x.draft();

    const before=x.build();

    assert.throws(
      ()=>x.p.renameRevisionLabel(
        'rev-2',
        'r2'
      ),
      /revision label already used/
    );

    assert.deepEqual(
      x.build(),
      before
    );

    const result=x.p.renameRevisionLabel(
      'rev-2',
      'r1'
    );

    assert.equal(
      result.changed,
      false
    );

    assert.deepEqual(
      x.build(),
      before
    );

    x.p.renameRevisionLabel(
      draft.revisionId,
      'Travail courant'
    );

    assert.throws(
      ()=>x.p.renameRevisionLabel(
        'rev-2',
        'travail courant'
      ),
      /revision label already used/
    );

    assert.equal(
      x.build().radarRevisions.length,
      2
    );
  }
);

test(
  'explorer picker toolbar share renamed label and preserve draft identity',
  ()=>{
    const x=setup();

    const draft=x.draft();

    x.p.renameRevisionLabel(
      draft.revisionId,
      'Travail courant'
    );

    x.e.refresh();
    x.u.refreshRadarLabels();

    const revision=x.a.getRevision(
      draft.group
    );

    const index=x.a.status().indexOf(
      draft.group
    );

    const expected=
      x.w.__radarRevisionDialogs.label(
        revision,
        index
      );

    assert.equal(
      expected,
      'Travail courant — 2.0.0 — Brouillon'
    );

    const node=revisionNode(
      x.w.testTree.nodes,
      draft.group
    );

    assert.ok(node);

    assert.equal(
      node.text,
      expected
    );

    const toolbar=x.toolbar.items.find(
      item=>x.u.resolve(item.id)===draft.group
    );

    assert.ok(toolbar);

    assert.ok(
      toolbar.text.endsWith(
        ' — '+expected
      )
    );

    x.edit(540,310);

    const saved=x.build();

    assert.equal(
      saved.radarRevisions.length,
      2
    );

    assert.deepEqual(
      saved.radarRevisions[0],
      x.c.radarRevisions[0]
    );

    assert.equal(
      saved.radarRevisions[1].revisionId,
      draft.revisionId
    );

    assert.equal(
      saved.radarRevisions[1].status,
      'draft'
    );

    assert.deepEqual(
      saved.radarRevisions[1].blips[0].position,
      {x:540,y:310}
    );
  }
);
