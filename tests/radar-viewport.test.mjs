import test from 'node:test';
import assert from 'node:assert/strict';
import { computeRadarViewport } from '../src/domain/radar-viewport.mjs';

const px = (p, vp) => ({ x: p.x * vp.zoom + vp.pan.x, y: p.y * vp.zoom + vp.pan.y });
const near = (actual, expected, detail) => assert.ok(Math.abs(actual - expected) < 1e-9, `${detail}: ${actual} != ${expected}`);

for (const [width, height] of [[800, 800], [765, 800], [510, 583], [1400, 600], [400, 400], [1200, 1200], [320, 750]]) {
  test(`uniform meet transform for ${width} x ${height}`, () => {
    const vp = computeRadarViewport({ width, height });
    near(vp.zoom, Math.min(width, height) / 800, 'zoom');
    near(px({x: 400, y: 400}, vp).x, width / 2, 'center x');
    near(px({x: 400, y: 400}, vp).y, height / 2, 'center y');
    near(px({x: 750, y: 400}, vp).x - width / 2, 350 * vp.zoom, 'outer ring radius');
    near(px({x: 550, y: 400}, vp).x - width / 2, 150 * vp.zoom, 'inner ring radius');
    near(px({x: 0, y: 0}, vp).x, vp.pan.x, 'origin x');
    near(px({x: 0, y: 0}, vp).y, vp.pan.y, 'origin y');
    assert.ok(vp.pan.x >= 0 && vp.pan.y >= 0);
  });
}

test('known narrow viewport contract', () => {
  assert.deepEqual(computeRadarViewport({ width: 510, height: 583 }), {
    zoom: 0.6375, pan: { x: 0, y: 36.5 }
  });
});

test('800 square is identity', () => {
  assert.deepEqual(computeRadarViewport({ width: 800, height: 800 }), {
    zoom: 1, pan: { x: 0, y: 0 }
  });
});

test('input object is not mutated, output uses fresh pan', () => {
  const config = Object.freeze({ width: 765, height: 800 });
  const a = computeRadarViewport(config);
  const b = computeRadarViewport(config);
  assert.notStrictEqual(a, b);
  assert.notStrictEqual(a.pan, b.pan);
  assert.deepEqual(config, { width: 765, height: 800 });
});

test('idempotent result for same dimensions', () => {
  const config = {width: 510, height: 583};
  assert.deepEqual(computeRadarViewport(config), computeRadarViewport(config));
});

for (const input of [undefined, {}, {width:0,height:800}, {width:-1,height:800}, {width:800,height:NaN}, {width:800,height:Infinity}, {width:800,height:'800'}, {width:800,height:800,logicalSize:0}]) {
  test(`invalid input rejected: ${JSON.stringify(input)}`, () => {
    assert.throws(() => computeRadarViewport(input), RangeError);
  });
}
