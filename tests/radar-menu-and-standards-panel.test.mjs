import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from './fixtures/radar-profile-test-vm.mjs';
const html=fs.readFileSync(new URL('../radar.html',import.meta.url),'utf8');
const start=html.indexOf('function handleMenuAction(event) {');
const end=html.indexOf('            switch (event.target) {',start);
assert.ok(start!==-1&&end>start);
const code=html.slice(start,end)+'\nreturn "allowed";\n}';
function run(target){const alerts=[];const ctx={window:{__radarCatalogUI:{isReadOnly:()=>true}},w2ui:{toolbar:{onClick:()=>{}}},w2alert:msg=>alerts.push(msg),offerDraftForReadOnlyAction:()=>alerts.push('offered'),i18next:{t:s=>s}};vm.runInNewContext(code+'\nthis.f=handleMenuAction;',ctx);return {result:ctx.f({target}),alerts};}
test('top-level radar tools remains navigable on published',()=>assert.deepEqual(run('radartools').alerts,[]));
test('top-level files remains navigable on published',()=>assert.deepEqual(run('files').alerts,[]));
test('archive submenu not guarded by readonly',()=>assert.deepEqual(run('radartools:archivecatalogrevision').alerts,[]));
test('reference submenu not guarded by readonly',()=>assert.deepEqual(run('radartools:standardregistry').alerts,[]));
test('creation action still guarded on published',()=>assert.deepEqual(run('radartools:createcatalogblip').alerts,['offered']));
test('lower W2UI panel is mounted and connected to catalog register',()=>{assert.match(html,/__radarStandardsPanel\?\.initialize/);const js=fs.readFileSync(new URL('../js/radar-standards-panel.js',import.meta.url),'utf8');assert.match(js,/__radarStandardRegistry/);assert.match(js,/new root\.w2grid/);});
