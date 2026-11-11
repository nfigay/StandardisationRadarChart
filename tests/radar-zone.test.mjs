import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import { getZone as modularGetZone } from '../src/domain/radar-zone.mjs';

// Independently execute the existing source function, rather than copy the
// expected algorithm into the test. Abort safely if the source has changed.
const legacySource = readFileSync(resolve('tests/fixtures/legacy-radar-zone.js'), 'utf8');
const legacyGetZone = runInNewContext(`const chartCenter = { x: 400, y: 400 };\n${legacySource}\ngetZone;`);

function compare(x, y, radii) {
  const oldValue = legacyGetZone(x, y, radii);
  const newValue = modularGetZone(x, y, radii);
  assert.deepEqual(JSON.parse(JSON.stringify(newValue)), JSON.parse(JSON.stringify(oldValue)),
    `Mismatch at x=${x}, y=${y}, radii=${JSON.stringify(radii)}`);
}

test('legacy parity: all quadrants and ring boundaries', () => {
  const radii = [150, 250, 350];
  for (const r of [0, 1, 149, 150, 151, 249, 250, 251, 349, 350, 351, 500]) {
    for (let degree = -180; degree <= 180; degree += 15) {
      const angle = degree * Math.PI / 180;
      compare(400 + r * Math.cos(angle), 400 + r * Math.sin(angle), radii);
    }
  }
});

test('legacy parity: Cartesian grid / nonstandard radii', () => {
  for (const radii of [[150, 250, 350], [10, 20, 40], [1], []]) {
    for (let x = 0; x <= 800; x += 40) {
      for (let y = 0; y <= 800; y += 40) compare(x, y, radii);
    }
  }
});

test('no mutation of supplied radii or center', () => {
  const radii = Object.freeze([150, 250, 350]);
  const center = Object.freeze({ x: 400, y: 400 });
  modularGetZone(550, 400, radii, center);
  assert.deepEqual(radii, [150, 250, 350]);
});
