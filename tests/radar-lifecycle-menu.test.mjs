import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Exercise the actual main-menu authorization and delegation preamble, not
// a duplicated copy of the allowlist. The remaining switch uses browser UI.
const html = fs.readFileSync(new URL('../radar.html', import.meta.url), 'utf8');
const start = html.indexOf('function handleMenuAction(event) {');
assert.notEqual(start, -1, 'main menu handler must exist');
const end = html.indexOf('            switch (event.target) {', start);
assert.ok(end > start, 'menu dispatch must exist');
const preamble = html.slice(start, end) + '\n            return "allowed";\n        }';

function fixture(readonly) {
  const forwarded = [];
  const alerts = [];
  const context = {
    window: { __radarCatalogUI: { isReadOnly: () => readonly } },
    w2ui: { toolbar: { onClick: event => forwarded.push(event.target) } },
    w2alert: message => alerts.push(message),
    offerDraftForReadOnlyAction: () => alerts.push("Draft required"),
    i18next: { t: key => key }
  };
  vm.runInNewContext(preamble + '\nthis.execute = handleMenuAction;', context);
  return { run: target => context.execute({target}), forwarded, alerts };
}

test('published revision may export catalog JSON through Files menu', () => {
  const x = fixture(true);
  x.run('files:savecatalogjson');
  assert.deepEqual(x.forwarded, ['savecatalogjson']);
  assert.deepEqual(x.alerts, []);
});

test('archived revision may export catalog JSON through Files menu', () => {
  const x = fixture(true);
  x.run('files:savecatalogjson');
  assert.equal(x.forwarded.length, 1);
});

test('read-only revision cannot use Files menu for an import mutation', () => {
  const x = fixture(true);
  x.run('files:loadgraphssr');
  assert.deepEqual(x.forwarded, []);
  assert.equal(x.alerts.length, 1);
});

test('read-only revision still blocks blip creation', () => {
  const x = fixture(true);
  x.run('radartools:createcatalogblip');
  assert.deepEqual(x.forwarded, []);
  assert.equal(x.alerts.length, 1);
});

test('draft retains unchanged access to file actions', () => {
  const x = fixture(false);
  x.run('files:loadgraphssr');
  assert.deepEqual(x.forwarded, ['loadgraphssr']);
  assert.deepEqual(x.alerts, []);
});

test('browser already warns before leaving without changing lifecycle semantics', () => {
  assert.match(html, /addEventListener\('beforeunload'/);
  assert.match(html, /event\.preventDefault\(\)/);
});
