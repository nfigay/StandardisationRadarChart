import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtempSync,writeFileSync,readFileSync,
  existsSync,rmSync
} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';

import {
  createPublishedRoadmapProjection
} from '../src/domain/roadmap-published-projection.mjs';

import {
  createClientView
} from '../js/roadmap-client.mjs';

import {
  catalog
} from './fixtures/roadmap-client-catalog.mjs';

test('client accepts published projection',()=>{
  const pkg=createPublishedRoadmapProjection(catalog(),'rev');
  const view=createClientView(pkg);
  assert.equal(view.title,'Roadmap exemple');
  assert.equal(view.items.length,1);
  assert.equal(view.items[0].standard.name,'ISO A');
});

test('the client requires no ISO global catalogue',()=>{
  const pkg=createPublishedRoadmapProjection(catalog(),'rev');
  assert.equal(createClientView(JSON.stringify(pkg)).items.length,1);
  assert.equal(JSON.stringify(pkg).includes('ISO B'),false);
});

test('plot coordinates remain finite for one blip',()=>{
  const pkg=createPublishedRoadmapProjection(catalog(),'rev');
  const item=createClientView(pkg).items[0];
  assert.ok(Number.isFinite(item.x));
  assert.ok(Number.isFinite(item.y));
  assert.equal(item.x,3);
  assert.equal(item.y,5);
});

test('drafts cannot be exported',()=>{
  assert.throws(
    ()=>createPublishedRoadmapProjection(catalog('draft'),'rev'),
    /only published/
  );
});

test('client HTML has no editor or catalogue imports',()=>{
  const html=readFileSync(
    new URL('../client.html',import.meta.url),'utf8'
  );
  assert.match(html,/id="package-file"/);
  assert.match(html,/js\/roadmap-client\.mjs/);
  assert.doesNotMatch(html,
    /radar-s14-z-sources|radar-iso-toolbar|radar-catalog-persistence/);
});

test('client script does not access network or IndexedDB',()=>{
  const code=readFileSync(
    new URL('../js/roadmap-client.mjs',import.meta.url),'utf8'
  );
  assert.doesNotMatch(code,
    /\bfetch\s*\(|\bindexedDB\b|localStorage|XMLHttpRequest/);
  assert.doesNotMatch(code,/innerHTML\s*=/);
});

test('CLI exports only the requested published revision',()=>{
  const dir=mkdtempSync(join(tmpdir(),'radar-client-test-'));
  try{
    const source=join(dir,'catalog.json');
    const output=join(dir,'roadmap.json');
    writeFileSync(source,JSON.stringify(catalog()));

    const run=spawnSync(process.execPath,[
      new URL('../scripts/export-roadmap-client.mjs',import.meta.url).pathname,
      source,'rev',output
    ],{encoding:'utf8'});

    assert.equal(run.status,0,run.stderr);
    const result=JSON.parse(readFileSync(output,'utf8'));
    assert.equal(result.blips.length,1);
    assert.equal(result.standards.length,1);
    assert.equal(result.standards[0].standardId,'iso-a');
  }finally{
    rmSync(dir,{recursive:true,force:true});
  }
});

test('CLI refuses overwrite and rejects nonpublished revision',()=>{
  const dir=mkdtempSync(join(tmpdir(),'radar-client-test-'));
  try{
    const source=join(dir,'catalog.json');
    const output=join(dir,'roadmap.json');
    const cli=new URL(
      '../scripts/export-roadmap-client.mjs',import.meta.url
    ).pathname;

    writeFileSync(source,JSON.stringify(catalog('draft')));
    let run=spawnSync(process.execPath,
      [cli,source,'rev',output],{encoding:'utf8'});
    assert.notEqual(run.status,0);
    assert.equal(existsSync(output),false);

    writeFileSync(source,JSON.stringify(catalog()));
    writeFileSync(output,'preserve');
    run=spawnSync(process.execPath,
      [cli,source,'rev',output],{encoding:'utf8'});
    assert.notEqual(run.status,0);
    assert.equal(readFileSync(output,'utf8'),'preserve');
  }finally{
    rmSync(dir,{recursive:true,force:true});
  }
});
