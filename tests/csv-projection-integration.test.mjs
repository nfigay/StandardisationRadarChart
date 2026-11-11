import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const js=readFileSync('js/radar.js','utf8');
const boot=readFileSync('src/bootstrap/radar-zone-entry.mjs','utf8');
const html=readFileSync('radar.html','utf8');
test('one CSV compatibility adapter, no legacy projection or UI rewrite',()=>{
  assert.equal((js.match(/function processCSVData\(/g)??[]).length,1);
  assert.match(js,/return window\.__radarProcessCSVData\(csvData\)/);
  assert.equal((js.match(/myBlips = processCSVData\(results\.data\)/g)??[]).length,1);
  assert.match(js,/Papa\.parse\(file,/);
});
test('CSV bridge shares existing ES module entry, without changing startup ordering',()=>{
  assert.match(boot,/import \{ processCSVData \} from '\.\.\/domain\/csv-projection\.mjs'/);
  assert.match(boot,/window\.__radarProcessCSVData = processCSVData/);
  assert.match(boot,/window\.__radarGetZone = getZone/);
  assert.equal((html.match(/src="\.\/src\/bootstrap\/radar-zone-entry\.mjs"/g)??[]).length,1);
  assert.ok(html.indexOf('working-groups-classic.js')<html.indexOf('src="./js/radar.js"'));
});
