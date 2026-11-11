import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const js=readFileSync(
 new URL('../js/radar-iso-toolbar.js',import.meta.url),'utf8'
);
const operations=[
 'refresh','sync','distributedSync',
 'changesLoad','rssSync','import'
];

test('six guides bilingues',()=>{
 for(const op of operations){
  assert.equal(js.split(op+':[').length-1,2,op);
 }
});
test('diagrammes SVG accessibles',()=>{
 assert.match(js,/createElementNS\(ns,'svg'\)/);
 assert.match(js,/setAttribute\('role','img'\)/);
 assert.match(js,/setAttribute\('aria-label',nodes\.join/);
});
test('aide sans exécution de commande',()=>{
 assert.match(js,/addEventListener\('mouseenter',\(\)=>renderSourceGuide\(op\)\)/);
 assert.match(js,/addEventListener\('focus',\(\)=>renderSourceGuide\(op\)\)/);
 assert.match(js,/info\.addEventListener\('click',\(\)=>renderSourceGuide\(op\)\)/);
});
test('actions métier directement accessibles, aide séparée',()=>{
 assert.match(js,/actions\.appendChild\(button\)/);
 assert.doesNotMatch(js,/actions\.appendChild\(entry\)/);
 assert.match(js,/info\.addEventListener\('click',\(\)=>renderSourceGuide\(op\)\)/);
});

test('commandes existantes conservées',()=>{
 assert.match(js,/const OPERATIONS=/);
 assert.match(js,/original\.click\(\)/);
 assert.match(js,/button\.addEventListener\('click',\(\)=>runOperation\(op\)\)/);
 assert.match(js,/watchStatus\(statusText\(\)\)/);
});
test('données techniques expliquées',()=>{
 for(const term of ['Dataset','Distribution','Datastore',
   'IndexedDB','Données des radars']){
  assert.ok(js.includes(term),term);
 }
 assert.match(js,/renderDataGuide\(\)/);
});
test('journal et état conservés',()=>{
 assert.match(js,/iso-source-manager-activity/);
 assert.match(js,/data-iso-operation-status/);
 assert.match(js,/catalogueStatus:sourceStatus\(\)/);
});
