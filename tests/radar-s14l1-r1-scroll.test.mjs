import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

test('windowed and legacy ISO views reset grid state',()=>{
  const src=readFileSync(resolve('js/radar-standards-panel.js'),'utf8');
  const section=src.split("} else if(mode==='iso-list'){")[1]
    ?.split("} else if(mode==='changes'){")[0];
  assert.ok(section,'ISO list branch present');
  assert.match(section,/grid\.clear\(true\)/);
  assert.match(section,/if\(windowedActive\)Promise\.resolve/);
  assert.match(section,/fullGrid\.project\(isoDeliverables,term\)/);
  assert.match(section,/grid\.total=projected\.length/);
  assert.match(section,/grid\.buffered=projected\.length/);
  assert.match(src,/grid\.refresh\(\);updateModeButtons\(\)/);
});

test('no fixed first-N slice for flat ISO view',()=>{
 const src=readFileSync(resolve('js/radar-standards-panel.js'),'utf8');
 const section=src.split("} else if(mode==='iso-list'){")[1]?.split('} else {')[0];
 assert.ok(section);
 assert.doesNotMatch(section,/slice\(0,MAX_ROWS\)/);
});
