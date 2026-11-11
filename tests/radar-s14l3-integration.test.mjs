import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const panel=fs.readFileSync(new URL('../js/radar-standards-panel.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../radar.html',import.meta.url),'utf8');
test('w2layout hosts sidebar and w2grid',()=>{assert.match(panel,/new root\.w2layout/);assert.match(panel,/new root\.w2sidebar/);assert.match(panel,/isoLayout\.html\('main',grid\)/);assert.match(panel,/isoLayout\.html\('left',isoSidebar\)/);});
test('group detail uses read-only w2form in w2popup',()=>{assert.match(panel,/root\.w2popup\.open/);assert.match(panel,/name:'isoGroupReadOnlyForm',focus:-1/);assert.match(panel,/readonly style/);});
test('old incremental tree no longer projects in ICS/committee views',()=>{assert.match(panel,/getSidebarIndex\(\)\.list\(mode,id,term,true\)/);assert.doesNotMatch(panel,/getTreeIndex\(\)\.tree\('ics',term\)/);});
test('script is loaded before standard panel',()=>{assert.ok(html.indexOf('radar-iso-sidebar-index.js')<html.indexOf('radar-standards-panel.js'));});
