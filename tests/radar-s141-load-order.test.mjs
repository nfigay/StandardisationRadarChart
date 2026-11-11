import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(
  new URL('../radar.html',import.meta.url),'utf8'
);

const dependencies=[
  'js/radar-iso-stream-core.js',
  'js/radar-iso-windowed-db.js',
  'js/radar-iso-stream-distribution.js'
];

test('ISO streaming dependencies load before the panel',()=>{
  const panel=html.indexOf('js/radar-standards-panel.js');
  assert.ok(panel>=0);
  for(const dependency of dependencies){
    const position=html.indexOf(dependency);
    assert.ok(position>=0,dependency+' missing');
    assert.ok(position<panel,dependency+' loads too late');
  }
});

test('ISO streaming dependencies are loaded once',()=>{
  for(const dependency of dependencies){
    assert.equal(html.split(dependency).length-1,1,dependency);
  }
});

test('ISO panel is initialized after dependencies',()=>{
  const initialize=html.indexOf(
    'window.__radarStandardsPanel?.initialize'
  );
  assert.ok(initialize>=0);
  for(const dependency of dependencies){
    assert.ok(html.indexOf(dependency)<initialize);
  }
});
