import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const js=readFileSync(
  new URL('../js/radar-s14-z-sources.js',import.meta.url),
  'utf8'
);
const operations=[
  'distributedSync','sync','import',
  'changesLoad','rssSync','refresh'
];

test('six guides bilingues dans le catalogue principal',()=>{
  const start=js.indexOf('const VISUAL_GUIDES=');
  const end=js.indexOf('function visualDiagram(',start);
  const content=js.slice(start,end);
  for(const op of operations){
    assert.equal(content.split(op+':[').length-1,2,op);
  }
});

test('diagrammes SVG accessibles',()=>{
  assert.match(js,/createElementNS\(ns,'svg'\)/);
  assert.match(js,/setAttribute\('role','img'\)/);
  assert.match(js,/setAttribute\('aria-label',steps\.join/);
});

test('panneau illustré dans la véritable fenêtre',()=>{
  assert.match(js,/s142-catalogue-visual-guide/);
  assert.match(js,/renderVisualGuide\(visualPanel,'distributedSync'\)/);
});

test('survol et focus indépendants des commandes',()=>{
  assert.match(js,/addEventListener\('mouseenter'/);
  assert.match(js,/addEventListener\('focus'/);
  assert.match(js,/renderVisualGuide\(visualPanel,op\)/);
  assert.match(js,/activateCommand\(op\)/);
  assert.match(js,/activateCommand\('distributedSync'\)/);
});

test('explication de la distribution et du stockage',()=>{
  for(const word of [
    'Comprendre les données','Dataset','Distribution',
    'Datastore','IndexedDB','Données du radar'
  ])assert.ok(js.includes(word),word);
  assert.match(js,/renderDataExplanation\(dialog\)/);
});
