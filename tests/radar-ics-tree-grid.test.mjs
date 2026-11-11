import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const src = readFileSync(new URL('../js/radar-standards-panel.js',import.meta.url),'utf8');
function setup(){const window={};window.location ??= {href:'https://example.test/js/radar-standards-panel.js'};vm.runInNewContext(src,{window,URL});return window.__radarStandardsPanel;}
const sample=[
 {identifier:'35',titleEn:'Information technology',titleFr:'Technologies de l’information',parent:''},
 {identifier:'35.020',titleEn:'Information technology in general',titleFr:'Technologies de l’information en général',parent:'35'},
 {identifier:'03',titleEn:'Services',titleFr:'Services',parent:''}
];
test('W2UI ICS tree uses nested children and stable recids',()=>{
 const roots=setup().icsTree(sample);
 assert.equal(roots.length,2);
 assert.equal(roots[0].recid,'ics:35');
 assert.equal(roots[0].w2ui.children[0].recid,'ics:35.020');
 assert.equal(roots[0].w2ui.expanded,false);
});
test('Searching a child by French label retains the parent branch',()=>{
 const roots=setup().icsTree(sample,'en général');
 assert.equal(roots.length,1);
 assert.equal(roots[0].identifier,'35');
 assert.equal(roots[0].w2ui.expanded,true);
 assert.equal(roots[0].w2ui.children.length,1);
});
test('ICS search works by code and English label, accent-insensitively',()=>{
 const panel=setup();
 assert.equal(panel.icsTree(sample,'35.020').length,1);
 assert.equal(panel.icsTree(sample,'information technology').length,1);
 assert.equal(panel.icsTree(sample,'unknown').length,0);
});
test('Unordered ICS rows are still nested correctly',()=>{
 const roots=setup().icsTree([sample[1],sample[0]]);
 assert.equal(roots.length,1);
 assert.equal(roots[0].w2ui.children.length,1);
});
test('No duplicate rows for repeated identifiers',()=>{
 const roots=setup().icsTree([sample[0],sample[0]]);
 assert.equal(roots.length,1);
});
test('legacy sidebar removed from source and W2UI grid retained',()=>{
 const html=readFileSync(new URL('../radar.html',import.meta.url),'utf8');
 assert.equal(html.includes('initializeISCSidebar'),false);
 assert.equal(html.includes('id="sidebar"'),false);
 assert.equal(html.includes('standard-references-panel'),true);
});
