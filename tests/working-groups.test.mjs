import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { getWorkingGroups, getWorkingGroupsWithCount } from '../src/domain/working-groups.mjs';

const fixture = readFileSync('tests/fixtures/legacy-working-groups.js', 'utf8');
const js = readFileSync('js/radar.js', 'utf8');
const bootstrap = readFileSync('src/bootstrap/radar-zone-entry.mjs', 'utf8');
const html = readFileSync('radar.html', 'utf8');
const normalize = x => JSON.parse(JSON.stringify(x));

function legacy(blips) {
  const context = { ASD_SSG_Blips: blips };
  runInNewContext(fixture + '\nthis.groups = getWorkingGroups; this.counts = getWorkingGroupsWithCount;', context);
  return context;
}

test('legacy parity: normal, duplicate, missing and empty working groups', () => {
  const cases = [[], [{ working_group: 'A' }], [{ working_group: 'A' }, { working_group: 'B' }, { working_group: 'A' }], [{working_group: ''}, {}, {working_group: null}, {working_group: 1}, {working_group: '01'}]];
  for (const blips of cases) {
    const l = legacy(blips);
    assert.deepEqual(normalize(getWorkingGroups(blips)), normalize(l.groups()));
    assert.deepEqual(normalize(getWorkingGroupsWithCount(blips)), normalize(l.counts()));
  }
});

test('legacy parity: numeric object-key ordering and non-mutation', () => {
  const blips = [{working_group:'10'},{working_group:'2'},{working_group:'10'},{working_group:'X'}];
  const before = JSON.stringify(blips);
  const l = legacy(blips);
  assert.deepEqual(normalize(getWorkingGroups(blips)), normalize(l.groups()));
  assert.deepEqual(normalize(getWorkingGroupsWithCount(blips)), normalize(l.counts()));
  assert.equal(JSON.stringify(blips), before);
});

test('legacy parity: exceptional keys', () => {
  const blips = [{working_group:'__proto__'},{working_group:'constructor'},{working_group:'toString'}];
  const l = legacy(blips);
  assert.deepEqual(normalize(getWorkingGroups(blips)), normalize(l.groups()));
  assert.deepEqual(normalize(getWorkingGroupsWithCount(blips)), normalize(l.counts()));
});

test('Phase 3: synchronous generated classic entry before toolbar initialization', () => {
  assert.match(js, /window\.__radarWorkingGroups\.getWorkingGroupsWithCount/);
  assert.doesNotMatch(bootstrap, /__radarWorkingGroups/);
  assert.ok(html.indexOf('working-groups-classic.js') < html.indexOf('src="./js/radar.js"'));
  assert.match(html, /getWorkingGroupsWithCount\(\)\.map/);
});
