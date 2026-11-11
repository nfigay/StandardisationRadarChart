import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source=readFileSync(new URL('../js/radar-standards-panel.js',import.meta.url),'utf8');
test('la sidebar donne une icone par defaut valide pour les noeuds a icone objet',()=>{
 assert.match(source,/name:'isoCatalogSidebar',icon:\{text:'',style:''\},nodes,/);
});
test('les evenements de selection et consultation sont conserves',()=>{
 assert.match(source,/onClick:selectNode/);
 assert.match(source,/onDblClick:openNodeDetails/);
});
