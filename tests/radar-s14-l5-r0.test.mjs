import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const panel=readFileSync(
  new URL('../js/radar-standards-panel.js',import.meta.url),
  'utf8'
);

function branch(start,end){
  const a=panel.indexOf(start);
  const b=panel.indexOf(end,a+start.length);
  assert.ok(a>=0 && b>a,'Expected panel branch boundaries');
  return panel.slice(a,b);
}

test('RSS and changes preserve all matching records',()=>{
  assert.doesNotMatch(panel,/\bMAX_ROWS\b/);
  const changes=branch("} else if(mode==='changes')","} else if(mode==='rss')");
  const rss=branch("} else if(mode==='rss')","} else {");
  assert.ok(changes.includes("grid.records=found.map("));
  assert.ok(rss.includes("grid.records=found.map("));
  assert.doesNotMatch(changes,/found\.slice\(/);
  assert.doesNotMatch(rss,/found\.slice\(/);
});

test('RSS and changes reset grid and synchronize counts',()=>{
  const changes=branch("} else if(mode==='changes')","} else if(mode==='rss')");
  const rss=branch("} else if(mode==='rss')","} else {");
  for(const section of [changes,rss]){
    assert.ok(section.includes('grid.clear(true)'));
    assert.ok(section.includes('grid.total=grid.records.length'));
    assert.ok(section.includes('grid.buffered=grid.records.length'));
  }
});
