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
    'workspace-explorer'
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
    return {
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

test(
  'untouched published revision without optional metadata stays identical',
  ()=>{
    const x=setup();

    assert.deepEqual(
      x.build(),
      x.c
    );
  }
);

test(
  'explicit draft edits save repeatedly with stable identity and unchanged parent',
  ()=>{
    const x=setup();
    const d=x.draft();

    x.edit(540,310);

    const first=x.build();
    const second=x.build();

    assert.equal(
      first.radarRevisions.length,
      2
    );

    assert.deepEqual(
      first,
      second
    );

    assert.deepEqual(
      first.radarRevisions[0],
      x.c.radarRevisions[0]
    );

    assert.equal(
      first.radarRevisions[1].revisionId,
      d.revisionId
    );

    assert.deepEqual(
      first.radarRevisions[1].blips[0].position,
      {x:540,y:310}
    );

    x.select(x.parent);

    assert.deepEqual(
      x.node().position,
      {x:500,y:300}
    );

    x.select(d.group);

    assert.deepEqual(
      x.node().position,
      {x:540,y:310}
    );

    assert.deepEqual(
      x.build(),
      first
    );
  }
);

test(
  'removed draft does not reappear and can be explicitly recreated',
  ()=>{
    const x=setup();
    const d=x.draft();

    x.edit(560,320);

    x.e.remove(
      x.sourceId,
      d.group
    );

    assert.equal(
      x.a.has(d.group),
      false
    );

    assert.equal(
      x.p.ownsRevision(
        d.group,
        d.revisionId
      ),
      false
    );

    assert.ok(
      !x.s.status().groups.includes(
        d.group
      )
    );

    assert.deepEqual(
      x.build(),
      x.c
    );

    x.select(x.parent);

    const next=x.draft();

    assert.notEqual(
      next.group,
      d.group
    );

    assert.equal(
      next.revisionId,
      d.revisionId
    );

    assert.equal(
      x.build().radarRevisions.length,
      2
    );
  }
);

test(
  'imported draft round-trips and preserves absent optional metadata',
  ()=>{
    const x=setup('draft');

    x.edit(510,320);

    const saved=x.build();

    assert.equal(
      saved.radarRevisions.length,
      1
    );

    assert.equal(
      saved.radarRevisions[0].revisionId,
      'rev-2'
    );

    assert.equal(
      Object.hasOwn(
        saved.radarRevisions[0].blips[0],
        'context'
      ),
      false
    );

    const reopened=setup(
      'draft',
      saved
    );

    assert.deepEqual(
      reopened.build(),
      saved
    );
  }
);

test(
  'metadata key order and null optional metadata do not create a draft',
  ()=>{
    const c=setup().c;

    c.radarRevisions[0].blips[0].context={
      a:1,
      b:{x:2,y:3}
    };

    c.radarRevisions[0].blips[0].extensions=null;

    const x=setup(
      'published',
      c
    );

    x.node().data.radarchart.context={
      b:{y:3,x:2},
      a:1
    };

    assert.deepEqual(
      x.build(),
      c
    );
  }
);

test(
  'genuine protected changes still derive a draft; collisions remain rejected',
  ()=>{
    const x=setup();

    x.edit(520,330);

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
      'rev-2:draft:local'
    );

    const y=setup();

    y.draft();

    y.select(y.parent);

    y.edit(520,330);

    assert.throws(
      ()=>y.build(),
      /draft revisionId collision/
    );
  }
);

test(
  'untouched published revision can be archived without false mismatch',
  ()=>{
    const x=setup();

    x.u.transitionActiveRevision(
      'archive',
      x.toolbar,
      x.graph
    );

    const saved=x.build();

    assert.equal(
      saved.radarRevisions.length,
      1
    );

    assert.equal(
      saved.radarRevisions[0].status,
      'archived'
    );

    assert.deepEqual(
      saved.radarRevisions[0].blips,
      x.c.radarRevisions[0].blips
    );
  }
);
