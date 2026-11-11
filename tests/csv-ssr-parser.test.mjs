import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { prepareCSVSSRImport } from '../src/domain/csv-ssr-import.mjs';

// Load the unmodified browser/UMD vendor script in an isolated CommonJS context.
// Node 22 otherwise treats .js as ESM when the project has "type": "module".
const vendorPath = fileURLToPath(new URL('../lib/papaparse.js', import.meta.url));
const moduleContext = { exports: {} };
vm.runInNewContext(fs.readFileSync(vendorPath, 'utf8'), {
  module: moduleContext,
  exports: moduleContext.exports,
}, { filename: vendorPath, timeout: 5000 });
const Papa = moduleContext.exports;
assert.equal(typeof Papa.parse, 'function');

test('UTF-8 BOM before quoted first header is removed before PapaParse reads CSV', () => {
  const csv = '\uFEFF"id","working_group","label","ring","quadrant","x","y"\n"1","PLM","A","Track","Available","12","13"';
  const old = Papa.parse(csv, { header: true, skipEmptyLines: 'greedy' });
  assert.notEqual(old.meta.fields[0], 'id');
  const parsed = Papa.parse(csv, {
    header: true,
    skipEmptyLines: 'greedy',
    beforeFirstChunk: chunk => chunk.replace(/^\uFEFF/, ''),
  });
  const plan = prepareCSVSSRImport(parsed, []);
  assert.equal(plan.total, 1);
  assert.equal(plan.additions[0].data.id, '1');
  assert.equal(plan.additions[0].data.x, 12);
});
