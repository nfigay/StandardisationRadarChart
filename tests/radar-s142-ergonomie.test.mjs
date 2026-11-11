import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const context={};
context.globalThis=context;
vm.createContext(context);
vm.runInContext(
  readFileSync(
    new URL('../js/radar-iso-advanced-query.js',import.meta.url),
    'utf8'
  ),
  context,
  {filename:'radar-iso-advanced-query.js'}
);
const engine=context.__radarIsoAdvancedQuery;
assert.equal(typeof engine.edit,'function');
assert.equal(typeof engine.validate,'function');
const panel=readFileSync(
  new URL('../js/radar-standards-panel.js',import.meta.url),'utf8'
);
const toolbar=readFileSync(
  new URL('../js/radar-iso-toolbar.js',import.meta.url),'utf8'
);

const fixture=()=>({
  id:1,operator:'AND',negated:false,children:[
    {id:2,field:'reference',comparison:'contains',value:'ISO'},
    {id:3,field:'title',comparison:'contains',value:'risque'},
    {id:4,field:'stage',comparison:'equals',value:'60'}
  ]
});
const ids=tree=>Array.from(tree.children,x=>x.id);

test('déplacement descendant immuable',()=>{
  const before=fixture();
  const after=engine.edit(before,{type:'moveDown',id:2});
  assert.deepEqual(ids(before),[2,3,4]);
  assert.deepEqual(ids(after),[3,2,4]);
  assert.equal(engine.validate(after),after);
});

test('déplacement montant puis descendant',()=>{
  const a=engine.edit(fixture(),{type:'moveUp',id:4});
  const b=engine.edit(a,{type:'moveDown',id:4});
  assert.deepEqual(ids(a),[2,4,3]);
  assert.deepEqual(ids(b),[2,3,4]);
});

test('ajouts itératifs au même niveau',()=>{
  const a=engine.edit(fixture(),{
    type:'addSiblingCondition',id:2,nextId:5
  });
  const b=engine.edit(a,{
    type:'addSiblingCondition',id:5,nextId:6
  });
  assert.deepEqual(ids(b),[2,5,6,3,4]);
  assert.equal(b.children[1].field,'all');
  assert.equal(b.children[1].value,'');
  assert.throws(()=>engine.validate(b),/Invalid search term/);

  b.children[1].value='sécurité';
  b.children[2].value='qualité';
  assert.equal(engine.validate(b),b);
});

test('déplacements hors limites refusés',()=>{
  assert.throws(()=>engine.edit(fixture(),{
    type:'moveUp',id:2
  }),/boundary/);
  assert.throws(()=>engine.edit(fixture(),{
    type:'moveDown',id:4
  }),/boundary/);
});

test('groupes ET/OU/NON conservés',()=>{
  const tree=fixture();
  tree.children[1]={
    id:3,operator:'OR',negated:true,
    children:[{
      id:7,field:'ics',comparison:'prefix',value:'03'
    }]
  };
  const after=engine.edit(tree,{type:'moveDown',id:3});
  assert.equal(after.children[2].operator,'OR');
  assert.equal(after.children[2].negated,true);
  assert.equal(engine.validate(after),after);
});

test('boutons désactivés aux limites',()=>{
  assert.match(panel,/up\.disabled=position===0/g);
  assert.match(panel,/down\.disabled=position===parent\.children\.length-1/g);
  assert.match(panel,/removeGroup\.disabled=parent\.children\.length===1/);
  assert.match(panel,/removeCondition\.disabled=parent\.children\.length===1/);
});

test('filtres regroupés, navigation conservée',()=>{
  assert.match(panel,/dataset\.isoMoreFilters='true'/);
  assert.match(panel,/filterContent\.appendChild\(sortLabel\)/);
  assert.match(panel,/filterContent\.appendChild\(icsFacet\.parentElement\)/);
  assert.match(panel,/filterContent\.appendChild\(committeeFacet\.parentElement\)/);
  assert.match(panel,/bar\.appendChild\(navigator\)/);
});

test('état catalogue distinct de l’activité',()=>{
  assert.match(toolbar,/function sourceStatus\(\)/);
  assert.match(toolbar,/catalogueStatus:sourceStatus\(\)/);
  assert.match(toolbar,/__radarIsoStartup/);
  assert.match(toolbar,/__radarIsoWindowedCount/);
});
