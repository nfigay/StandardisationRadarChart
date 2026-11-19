import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync(new URL('../radar.html',import.meta.url),'utf8');
const code=fs.readFileSync(new URL('../js/radar.js',import.meta.url),'utf8');
const panel=fs.readFileSync(new URL('../js/radar-standards-panel.js',import.meta.url),'utf8');
const geo=fs.readFileSync(new URL('../js/radar-geometry.js',import.meta.url),'utf8');
function geometry(){const c={window:{}};vm.runInNewContext(geo,c);return c.window.__radarGeometry;}
test('5x4 sectors map to their own category identifiers and labels',()=>{
 const g=geometry(),config=g.uniform({quarters:5,zones:4});g.setActive(config);
 for(const z of config.zones)for(const q of config.quarters){
  const p=g.point(z.id,q.id,.5,.5);const actual=g.locate(p.x,p.y);
  assert.equal(actual.zoneId,z.id);assert.equal(actual.quarterId,q.id);
 }
 assert.match(code,/activeGeometry\?\.zones\?\.map\(z => \(\{ id:z.id, text:z.label \|\| z.id \}\)\)/);
 assert.match(code,/activeGeometry\?\.quarters\?\.map/);
});
test('dragging respects custom geometry rather than hard-coded ASD zone mappings',()=>{
 assert.match(html,/custom \? geometry\.locate\(pos\.x, pos\.y\) : null/g);
 assert.match(html,/newZone = custom \? zone : zoneRingMapping\[zone\]/);
 assert.match(html,/newQuadrant = custom \? quadrant : quadrantMapping\[quadrant\]/);
 assert.match(html,/node\.scratch\('_initialZone', custom \? node\.data\('ring'\)/);
 assert.equal((html.match(/getZone\(pos\.x, pos\.y, radii\)/g)||[]).length,2);
});
test('catalog menu offers ISO integration and W3C publication selection',()=>{
 assert.match(panel,/mode==='iso-list'\?\['integrate'\]/);
 assert.match(panel,/\['versions','integrate'\]/);
 assert.match(panel,/importIsoReference\(String\(row\.isoId\)\)/);
 assert.match(panel,/await documentaryAction\('versions'\)/);
 assert.match(panel,/if\(!canIntegrate\(\)\)throw Error\(tr\('resourceNoCatalog'\)\)/);
});
