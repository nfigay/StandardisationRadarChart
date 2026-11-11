import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const panel=readFileSync(new URL('../js/radar-standards-panel.js',import.meta.url),'utf8');
test('detail uses a genuine w2form with two pages and no save action',()=>{
 for(const snippet of ['new root.w2form(',"{id:'details'","{id:'raw'","field('sourceData'",'actions:{}',"form.destroy()"]) assert.ok(panel.includes(snippet),snippet);
 assert.equal(panel.includes("JSON.stringify(value,null,2);section.appendChild(pre)"),false);
});
test('grid is compact, descriptions are ellipsized to one line',()=>{
 assert.match(panel,/recordHeight:28/);
 assert.doesNotMatch(panel,/recordHeight:56/);
 assert.match(panel,/text-overflow:clip!important/);assert.match(panel,/white-space:normal!important/);
 assert.doesNotMatch(panel,/max-height:44px/);
});
test('source is still valid and exports ICS tree functions',()=>{
 const win={};win.location={href:'https://example.test/js/radar-standards-panel.js'};vm.runInNewContext(panel,{window:win,URL});
 assert.equal(typeof win.__radarStandardsPanel.icsTree,'function');
 assert.equal(typeof win.__radarStandardsPanel.enrichedIcsTree,'function');
});
test('form remains read-only and supports bilingual text and replacements',()=>{
 for(const snippet of ["scopeFr", "scopeEn", "titleFr", "titleEn", "replaces:resolveRelations", "replacedBy:resolveRelations", "'readonly style=", "'textarea'"])assert.ok(panel.includes(snippet),snippet);
});
