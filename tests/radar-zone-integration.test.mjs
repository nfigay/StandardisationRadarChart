import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { getZone } from '../src/domain/radar-zone.mjs';

const radarJs = readFileSync('js/radar.js', 'utf8');
const html = readFileSync('radar.html', 'utf8');
const entry = readFileSync('src/bootstrap/radar-zone-entry.mjs', 'utf8');

test('one global compatibility bridge, no legacy computation', () => {
  const matches = [...radarJs.matchAll(/function getZone\(x, y, radii\)\s*\{/g)];
  assert.equal(matches.length, 1);
  assert.match(radarJs, /return window\.__radarGetZone\(x, y, radii\)/);
  assert.doesNotMatch(radarJs, /let relX = x - chartCenter\.x/);
  const context = { window: { __radarGetZone: getZone } };
  runInNewContext(radarJs.match(/function getZone\(x, y, radii\)\s*\{[\s\S]*?\n\}/)[0] + '\nthis.bridge = getZone;', context);
  assert.deepEqual(JSON.parse(JSON.stringify(context.bridge(550, 400, [150, 250, 350]))), getZone(550, 400, [150, 250, 350]));
});

test('Vite-managed module bootstrap referenced once', () => {
  assert.equal(html.split('src="./src/bootstrap/radar-zone-entry.mjs"').length - 1, 1);
  assert.match(html, /<script type="module" src="\.\/src\/bootstrap\/radar-zone-entry\.mjs"><\/script>/);
  assert.match(entry, /window\.__radarGetZone = getZone/);
  assert.equal([...html.matchAll(/getZone\(pos\.x, pos\.y, radii\)/g)].length, 2);
});
