import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source = readFileSync(new URL('../js/radar-standards-panel.js', import.meta.url), 'utf8');
test('S17-R4: ISO document uses w2popup lifecycle and keeps w2form', () => {
  const start = source.indexOf(' function showDetail(record){');
  const end = source.indexOf(' const str=v=>',start);
  assert.ok(start > 0 && end > start);
  const detail=source.slice(start,end);
  assert.match(detail,/root\.w2popup\.open\(\{/);
  assert.match(detail,/onOpen\(event\)\{event\.onComplete=mountForm;/);
  assert.match(detail,/onClose\(event\)/);
  assert.match(detail,/new root\.w2form\(/);
  assert.match(detail,/form\.render\(container\)/);
  assert.match(detail,/root\.__radarFormAutoheight\?\.schedule\?\.\(\)/);
  assert.doesNotMatch(detail,/dialog\.showModal\(|iso-standard-detail-dialog/);
});
test('S17-R4: documentary fields, read-only policy and edition actions retained', () => {
  const detail=source.slice(source.indexOf(' function showDetail(record){'),source.indexOf(' const str=v=>'));
  for (const token of ['readonly style=',"field('titleFr'", "field('scopeEn'", "field('sourceData'", "data-iso-editions", 'importIsoReference', 'resolveRelations(item.replaces)', 'pendingNext']) assert.ok(detail.includes(token), token);
});
