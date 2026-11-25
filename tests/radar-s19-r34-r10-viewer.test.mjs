
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const panel=readFileSync(
 new URL('../js/radar-rationale-panel.js',import.meta.url),
 'utf8'
);

const html=readFileSync(
 new URL('../radar.html',import.meta.url),
 'utf8'
);

function toolbar(readOnly,editable,hasDossier){
 function element(){
  return {
   children:[],
   classList:{toggle(){}},
   appendChild(n){this.children.push(n);},
   append(...nodes){this.children.push(...nodes);},
   replaceChildren(){this.children=[];}
  };
 }

 const host=element();

 const start=panel.indexOf('function updateToolbar(){');
 const end=panel.indexOf('function refresh(){',start);

 assert.ok(start>=0&&end>start);

 let denied=false;

 const context={
  byId:()=>host,
  document:{createElement:element},
  viewer:()=>readOnly||denied,
  target:()=>({editable:editable&&!denied}),
  current:()=>hasDossier?{}:null,
  t:key=>key,
  mode:'view',
  killEditor(){},
  s19SetSelectionLock(){},
  refresh(){},
  console
 };

 vm.runInNewContext(
  panel.slice(start,end)+'\nupdateToolbar();',
  context
 );

 const flatten=n=>[
  n,...n.children.flatMap(flatten)
 ];

 return {
  buttons:flatten(host).filter(n=>n.type==='button'),
  context,
  deny(){denied=true;}
 };
}

test('Viewer exposes consultation without edit or create buttons',()=>{
 const {buttons}=toolbar(true,false,true);

 assert.deepEqual(
  buttons.map(b=>b.textContent),['view']
 );
});

test('Creator draft retains working edit command',()=>{
 const {buttons,context}=toolbar(false,true,true);

 const edit=buttons.find(b=>b.textContent==='edit');

 assert.ok(edit);
 assert.equal(edit.disabled,false);

 edit.onclick();

 assert.equal(context.mode,'edit');
});

test('Creator published dossier cannot be edited',()=>{
 const {buttons}=toolbar(false,false,true);

 assert.equal(
  buttons.find(b=>b.textContent==='edit').disabled,
  true
 );
});

test('Creator can create a dossier in an eligible draft',()=>{
 const {buttons}=toolbar(false,true,false);

 assert.equal(
  buttons.find(b=>b.textContent==='create').disabled,
  false
 );
});

test('Edit handler rechecks authorization at execution',()=>{
 const result=toolbar(false,true,true);

 result.deny();

 result.buttons.find(b=>b.textContent==='edit').onclick();

 assert.equal(result.context.mode,'view');
});

test('Fullscreen stylesheet is a static HTML dependency',()=>{
 assert.match(
  html,
  /<link[^>]+href="\.\/css\/radar-rationale-fullscreen\.css"[^>]*>/
 );

 assert.doesNotMatch(
  panel,
  /s19EnsureFullscreenCss|css\/radar-rationale-fullscreen\.css/
 );
});
