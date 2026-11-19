import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const context = {window:{}};
runInNewContext(readFileSync(new URL('../js/radar-geometry.js',import.meta.url),'utf8'),context);
const g=context.window.__radarGeometry;
test('ASD SSG profile identifiers and distances',()=>{
 const p=g.legacy(); assert.deepEqual(Array.from(p.zones,z=>z.id),['Adopted','Candidate','Track']);
 assert.deepEqual(Array.from(p.quarters,q=>q.id),['Available','Monitored','Participated','Developed']);
 assert.deepEqual(Array.from(p.zones,z=>z.maxRadius),[150,250,350]); assert.equal(g.verify(p),true);
});
for(const [q,z] of [[4,3],[5,4],[6,5]])test(q+' x '+z+' sectors round-trip',()=>{
 const p=q===4&&z===3?g.legacy():g.uniform({quarters:q,zones:z});
 assert.equal(p.zones.length*p.quarters.length,q*z);
 for(const ring of p.zones)for(const quarter of p.quarters){
  const position=g.point(ring.id,quarter.id,.4,.5,p); const found=g.locate(position.x,position.y,p);
  assert.equal(found.zoneId,ring.id);assert.equal(found.quarterId,quarter.id);
  const pos2=g.position({ring:ring.id,quadrant:quarter.id,id:'STD-X'},p);
  assert.deepEqual(pos2,g.position({ring:ring.id,quadrant:quarter.id,id:'STD-X'},p));
  assert.equal(g.locate(pos2.x,pos2.y,p).quarterId,quarter.id);
 }
});
test('active selection is isolated and reset to legacy',()=>{
 const p=g.uniform({quarters:5,zones:4});g.setActive(p);p.zones[0].label='Changed';
 assert.equal(g.activeConfig().zones[0].label,'Zone 1');assert.equal(g.isCustomActive(),true);
 g.reset();assert.equal(g.isCustomActive(),false);assert.equal(g.activeConfig().id,'ASD_SSG_4X3');
});
test('invalid angular overlaps, gaps, dimensions and IDs rejected',()=>{
 const p=g.uniform({quarters:5,zones:4});
 p.quarters[1].startAngle+=.01; assert.throws(()=>g.verify(p),/Non-contiguous/);
 const p2=g.uniform({quarters:5,zones:4});p2.zones[1].minRadius+=1;assert.throws(()=>g.verify(p2),/Non-contiguous/);
 const p3=g.uniform({quarters:5,zones:4});p3.zones[1].id=p3.zones[0].id;assert.throws(()=>g.verify(p3),/duplicate/);
 assert.throws(()=>g.uniform({quarters:1,zones:2}));
 assert.throws(()=>g.point('no','quarter-1'));
});
test('radius boundary belongs to next zone, outer boundary included',()=>{
 const p=g.uniform({quarters:5,zones:4});
 const a=g.point('zone-1','quarter-1',1,.5,p);
 assert.equal(g.locate(a.x,a.y,p).zoneId,'zone-2');
 const b=g.point('zone-4','quarter-1',1,.5,p);
 assert.equal(g.locate(b.x,b.y,p).zoneId,'zone-4');
});
