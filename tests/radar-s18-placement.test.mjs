import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {runInNewContext} from 'node:vm';

const s={
  setTimeout,clearTimeout,
  setInterval,clearInterval,
  performance
};

s.window=s;
s.self=s;

for(const f of [
  'js/radar-geometry.js',
  'js/radar-placement.js',
  'lib/d3.min.js'
]) {
  runInNewContext(fs.readFileSync(f,'utf8'),s,{timeout:5000});
}

const g=s.__radarGeometry;
const p=s.__radarPlacement;
const c=g.uniform({quarters:5,zones:4});

test('placement reproductible et catégories inchangées',()=>{
  const a=Array.from({length:12},(_,i)=>({
    id:'b'+i,
    ring:c.zones[1].id,
    quadrant:c.quarters[2].id
  }));

  const x=p.layout(a,g,s.d3,{
    config:c,
    markerRadius:7,
    iterations:150
  });

  const y=p.layout(a,g,s.d3,{
    config:c,
    markerRadius:7,
    iterations:150
  });

  assert.deepEqual(x.positions,y.positions);

  for(const b of x.positions) {
    const z=g.locate(b.x,b.y,c);
    assert.equal(z.zoneId,b.ring);
    assert.equal(z.quarterId,b.quadrant);
  }

  assert.equal(a[0].x,undefined);
});

test('rejet secteur trop petit',()=>{
  const x=g.uniform({quarters:4,zones:8,radius:40});

  assert.equal(
    p.project({
      ring:x.zones[0].id,
      quadrant:x.quarters[0].id,
      x:3,y:3
    },g,x,9).valid,
    false
  );
});
