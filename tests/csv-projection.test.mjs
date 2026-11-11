import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { processCSVData } from '../src/domain/csv-projection.mjs';
const legacySource = readFileSync('tests/fixtures/legacy-csv-projection.js', 'utf8');
const historic = runInNewContext(`${legacySource}\nprocessCSVData;`);
const plain = v => JSON.parse(JSON.stringify(v));
const cases = [
  [],
  [{}],
  [{ id:'a', label:'Standard A', working_group:'PLM', ring:'Track', quadrant:'Developed', in_pda_radar:'Y', description:'a,b\nc' }],
  [{ id:'007', label:'', hasBlip:'false', unknown:'preserve?' }, { id:0, ring:null, standard_type1:undefined }],
  [{ id:'x', in_se_radar:'N', name:'électricité', standard_type1:'ISO' }],
];
test('CSV projection matches exact pre-patch implementation', () => {
  for(const rows of cases) assert.deepEqual(plain(processCSVData(rows)), plain(historic(rows)));
});
test('CSV projection preserves input and does not alias input records', () => {
  const rows=[{id:'x',label:'original',unknown:'not projected'}];
  const before=structuredClone(rows);
  const out=processCSVData(rows);
  assert.deepEqual(rows,before);
  assert.notStrictEqual(out[0],rows[0]);
  assert.equal(out[0].label,'original');
  assert.equal(Object.hasOwn(out[0],'unknown'),false);
});
test('CSV projection retains legacy exceptions on invalid input', () => {
  for(const input of [null, undefined, {}, 42]) {
    assert.equal(Boolean(throws(()=>processCSVData(input))),Boolean(throws(()=>historic(input))));
  }
});
function throws(fn){try{fn();return null}catch(e){return e}}
