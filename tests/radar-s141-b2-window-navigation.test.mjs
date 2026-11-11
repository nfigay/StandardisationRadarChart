import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const panel=readFileSync(
  new URL('../js/radar-standards-panel.js',import.meta.url),
  'utf8'
);

// Execute the actual navigation functions from the application.
// Do not replace their algorithm with a duplicate implementation.
const start=panel.indexOf('async function autoShift(direction){');
const end=panel.indexOf('function refresh(){',start);

assert.ok(start>=0,'autoShift missing');
assert.ok(end>start,'navigation boundary missing');

const source=panel.slice(start,end);

assert.match(source,/function onWindowGridScroll\(event\)/);

function harness({count=8,size=2}={}){
  const pages=Array.from({length:count},(_,i)=>
    Array.from({length:size},(_,j)=>({
      id:`${i}:${j}`,
      reference:`ISO-${i}-${j}`
    }))
  );

  const calls=[];
  const scroller={
    scrollTop:0,
    scrollHeight:1000,
    clientHeight:200,
    matches:()=>true
  };

  const grid={
    records:pages[0].slice(),
    total:size,
    buffered:size,
    clear(){this.records=[];},
    refresh(){}
  };

  const ctx={
    windowedActive:true,
    autoLoading:false,
    windowToken:0,
    mode:'iso-list',
    windowNext:count>1?'p1':null,
    windowPosition:0,
    windowBasePosition:0,
    windowHistory:[null],
    windowSize:size,
    grid,
    mount:{querySelector:()=>scroller},
    status:{textContent:''},
    windowIndicator:{textContent:''},
    nextWindowButton:{disabled:false},
    previousWindowButton:{disabled:true},
    currentWindowOptions:after=>({after}),
    tr:(key,values)=>key+JSON.stringify(values??{}),
    root:{
      __radarIsoFullGrid:{project:rows=>rows.slice()},
      __radarIsoWindowed:{
        async page({after}){
          calls.push(after);
          const index=after===null?0:
            Number(String(after).slice(1));

          if(!Number.isInteger(index) ||
             index<0 || index>=pages.length){
            throw Error('invalid cursor '+after);
          }

          return {
            records:pages[index].slice(),
            next:index+1<pages.length?
              'p'+(index+1):null
          };
        }
      }
    }
  };

  vm.createContext(ctx);
  vm.runInContext(
    source+
    '\nglobalThis.navigation={autoShift,onWindowGridScroll};',
    ctx
  );

  return {ctx,grid,scroller,calls,pages,api:ctx.navigation};
}

function ids(rows){
  return rows.map(x=>x.id);
}

test('avance, revient puis réavance sans perdre les pages',async()=>{
  const h=harness();
  const {ctx,grid,api,pages}=h;

  await api.autoShift('next');
  assert.deepEqual(ids(grid.records),
    ids([...pages[0],...pages[1]]));
  assert.equal(ctx.windowBasePosition,0);
  assert.equal(ctx.windowPosition,1);

  await api.autoShift('next');
  assert.deepEqual(ids(grid.records),
    ids([...pages[1],...pages[2]]));
  assert.equal(ctx.windowBasePosition,1);
  assert.equal(ctx.windowPosition,2);

  await api.autoShift('previous');
  assert.deepEqual(ids(grid.records),
    ids([...pages[0],...pages[1]]));
  assert.equal(ctx.windowBasePosition,0);

  await api.autoShift('next');
  assert.deepEqual(ids(grid.records),
    ids([...pages[1],...pages[2]]));
});

test('la grille reste limitée à deux fenêtres',async()=>{
  const h=harness({count:12,size:3});
  const {ctx,grid,api}=h;

  for(let i=1;i<12;i++){
    await api.autoShift('next');
    assert.ok(grid.records.length<=6);
    assert.equal(new Set(ids(grid.records)).size,
      grid.records.length);
  }

  assert.equal(ctx.windowNext,null);
  assert.equal(ctx.nextWindowButton.disabled,true);

  const before=h.calls.length;
  await api.autoShift('next');
  assert.equal(h.calls.length,before);
});

test('le premier écran interdit de remonter',async()=>{
  const h=harness();
  await h.api.autoShift('previous');
  assert.equal(h.calls.length,0);
  assert.equal(h.ctx.windowBasePosition,0);
});

test('une erreur libère le verrou de chargement',async()=>{
  const h=harness();
  const provider=h.ctx.root.__radarIsoWindowed;
  const original=provider.page;

  provider.page=async()=>{
    throw Error('simulated IndexedDB error');
  };

  await h.api.autoShift('next');
  assert.equal(h.ctx.autoLoading,false);
  assert.match(h.ctx.status.textContent,
    /simulated IndexedDB error/);

  provider.page=original;
  await h.api.autoShift('next');
  assert.equal(h.ctx.windowPosition,1);
});

test('un changement de requête ignore la réponse périmée',async()=>{
  const h=harness();
  const provider=h.ctx.root.__radarIsoWindowed;

  let resolvePage;
  provider.page=()=>new Promise(resolve=>{
    resolvePage=resolve;
  });

  const request=h.api.autoShift('next');
  assert.equal(h.ctx.autoLoading,true);

  h.ctx.windowToken++;
  resolvePage({
    records:[{id:'stale'}],
    next:'p2'
  });

  await request;

  assert.deepEqual(ids(h.grid.records),
    ids(h.pages[0]));
  assert.equal(h.ctx.autoLoading,false);
});

test('le défilement déclenche le chargement suivant',async()=>{
  const h=harness();

  h.scroller.scrollTop=790;
  h.api.onWindowGridScroll({
    target:h.scroller
  });

  // The event handler intentionally starts an asynchronous operation.
  await new Promise(resolve=>setImmediate(resolve));

  assert.equal(h.calls.length,1);
  assert.equal(h.ctx.windowPosition,1);
});
