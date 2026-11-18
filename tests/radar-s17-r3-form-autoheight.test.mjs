import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const src = readFileSync(new URL('../js/radar-form-autoheight.js', import.meta.url), 'utf8');
function fixture({ value = '', scrollHeight = 20, visible = true, optOut = false } = {}) {
  const attrs = new Map(optOut ? [['data-radar-autoheight','off']] : []);
  const style = { values: new Map(), setProperty(key, v) { this.values.set(key, v); } };
  const el = { tagName: 'TEXTAREA', value, scrollHeight, style,
    isConnected: true, clientWidth: visible ? 200 : 0, getClientRects: () => visible ? [{}] : [],
    getAttribute: key => attrs.get(key) || null };
  const events = new Map();
  const doc = { readyState: 'complete', documentElement: {},
    querySelectorAll: () => [el], addEventListener: (k, fn) => events.set(k, fn) };
  const win = { document: doc, addEventListener() {}, requestAnimationFrame: fn => fn(),
    getComputedStyle: () => ({ lineHeight: '20px', fontSize: '16px', paddingTop: '4px', paddingBottom:'4px',
      borderTopWidth:'1px', borderBottomWidth:'1px', boxSizing:'border-box' }) };
  win.window = win;
  vm.runInNewContext(src, { window: win });
  return { win, el, events, style };
}
test('textarea short and empty shrink to one line', () => {
  const {win,style} = fixture();
  win.__radarFormAutoheight.fitAll(true);
  assert.equal(style.values.get('height'), '30px');
});
test('long textarea is bounded to 8 lines with internal scrolling', () => {
  const {win,style} = fixture({value: 'long', scrollHeight: 500});
  win.__radarFormAutoheight.fitAll(true);
  assert.equal(style.values.get('height'), '170px');
  assert.equal(style.values.get('overflow-y'), 'auto');
});
test('hidden and explicitly excluded textareas are untouched', () => {
  for (const options of [{visible:false},{optOut:true}]) {
    const {win,style} = fixture(options);
    win.__radarFormAutoheight.fitAll(true);
    assert.equal(style.values.size, 0);
  }
});
test('input event recalculates changed content', () => {
  const {el,events,style} = fixture();
  el.scrollHeight=80;el.value='updated';events.get('input')({target:el});
  assert.equal(style.values.get('height'), '82px');
});
