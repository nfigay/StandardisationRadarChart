import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
const html=readFileSync('radar.html','utf8');
const js=readFileSync('js/radar.js','utf8');
const generated=readFileSync('js/working-groups-classic.js','utf8');
const legacy=readFileSync('tests/fixtures/legacy-working-groups.js','utf8');
const normalized = x=>JSON.parse(JSON.stringify(x));

test('synchronous classic script is loaded before radar.js and inline toolbar',()=>{
  const a=html.indexOf('<script src="./js/blips.js"></script>');
  const b=html.indexOf('<script src="./js/working-groups-classic.js"></script>');
  const c=html.indexOf('<script src="./js/radar.js"></script>');
  const d=html.indexOf('initializeToolbar().render(');
  assert.ok(a>=0 && a<b && b<c && c<d);
  assert.equal(html.split('src="./js/working-groups-classic.js"').length-1,1);
  assert.match(js,/return window\.__radarWorkingGroups\.getWorkingGroupsWithCount\(ASD_SSG_Blips\)/);
});

test('classic bundle initializes synchronously and retains parity for real startup projection',()=>{
  const cases=[[],[{working_group:'WG A'},{working_group:'WG A'},{working_group:'WG B'}],
    [{working_group:'10'},{working_group:'2'},{working_group:null},{}],
    [{working_group:'__proto__'},{working_group:'constructor'}]];
  for (const data of cases) {
    const scope={window:{},ASD_SSG_Blips:data};
    runInNewContext(generated,scope);
    assert.equal(typeof scope.window.__radarWorkingGroups.getWorkingGroupsWithCount,'function');
    const historic={ASD_SSG_Blips:data};
    runInNewContext(legacy+'\nthis.getOriginalGroups = getWorkingGroups; this.getOriginalCount = getWorkingGroupsWithCount;',historic);
    assert.deepEqual(normalized(scope.window.__radarWorkingGroups.getWorkingGroups(data)),normalized(historic.getOriginalGroups()));
    assert.deepEqual(normalized(scope.window.__radarWorkingGroups.getWorkingGroupsWithCount(data)),normalized(historic.getOriginalCount()));
  }
});
