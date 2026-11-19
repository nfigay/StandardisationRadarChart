import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const context={window:{}};
runInNewContext(readFileSync(new URL('../js/radar-geometry.js', import.meta.url),'utf8'),context);
const geo=context.window.__radarGeometry;
// Evaluate both classic browser scripts in the same isolated window context.
runInNewContext(readFileSync(new URL('../js/radar-geometry-editor.js', import.meta.url),'utf8'),context);
const editor=context.window.__radarGeometryEditor;
assert.equal(typeof editor?.compose,'function');

test('compose 5x4 with labels, descriptions and exact geometry',()=>{
 const c=editor.compose(geo.legacy(),{quarters:5,zones:4,radius:340,startAngle:-90,quarterData:[{label:'Data',description:'Domaine'}],zoneData:[{label:'Emerging',description:'Emergence'}]});
 assert.equal(c.quarters.length,5);assert.equal(c.zones.length,4);assert.equal(c.quarters[0].label,'Data');assert.equal(c.zones[0].description,'Emergence');assert.equal(geo.verify(c),true);
});
test('retains ASD category identity when counts unchanged',()=>{
 const c=editor.compose(geo.legacy(),{quarters:4,zones:3,radius:350,startAngle:-90});
 assert.deepEqual(Array.from(c.zones,z=>z.id),['Adopted','Candidate','Track']);
 assert.deepEqual(Array.from(c.zones,z=>z.maxRadius),[150,250,350]);
 assert.deepEqual(Array.from(c.quarters,q=>q.id),['Available','Monitored','Participated','Developed']);
 assert.equal(editor.impact(c,[{ring:'Adopted',quadrant:'Available'}]).canApply,true);
});
test('rejects orphaned blips without remapping',()=>{
 const c=editor.compose(geo.legacy(),{quarters:5,zones:4,radius:350,startAngle:-90});
 const result=editor.impact(c,[{blipId:'x',ring:'Adopted',quadrant:'Available'}]);
 assert.equal(result.canApply,false);assert.equal(result.invalid.length,1);
});
test('rejects invalid configuration',()=>{
 for(const input of [{quarters:1,zones:3,radius:350,startAngle:0},{quarters:4,zones:0,radius:350,startAngle:0},{quarters:4,zones:3,radius:400,startAngle:0}]) assert.throws(()=>editor.compose(geo.legacy(),input));
});
