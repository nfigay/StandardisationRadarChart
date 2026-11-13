import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

import {
  installProfile,
  runInNewContext
} from './fixtures/radar-profile-test-vm.mjs';

function environment(search=''){
  const sandbox={
    window:{
      location:{search}
    },
    console
  };

  const profile=installProfile(
    sandbox,
    search
  );

  return {sandbox,profile};
}

test('profile bootstrap: actual creator profile',()=>{
  const {sandbox,profile}=environment();

  assert.equal(
    sandbox.window.__radarApplicationProfile,
    profile
  );

  assert.equal(profile.name,'creator');
  assert.equal(profile.viewer,false);

  assert.ok(
    profile.allows('radar.edit')
  );

  assert.ok(
    profile.allows('revision.create')
  );
});

test('profile bootstrap: viewer remains viewer',()=>{
  const {sandbox,profile}=environment(
    '?profile=viewer'
  );

  assert.equal(profile.viewer,true);

  assert.equal(
    installProfile(sandbox,''),
    profile
  );

  assert.equal(
    profile.allows('revision.create'),
    false
  );

  assert.equal(
    profile.allows('publication.create'),
    false
  );

  assert.equal(
    profile.allows('catalog.admin'),
    false
  );
});

test('viewer: actual HTML menu guard refuses mutations',()=>{
  const {sandbox}=environment(
    '?profile=viewer'
  );

  const html=readFileSync(
    'radar.html',
    'utf8'
  );

  const signature=
    'function handleMenuAction(event) {';

  const index=html.indexOf(signature);

  assert.ok(index>=0);

  const prefix=html.slice(
    index+signature.length,
    index+signature.length+1500
  );

  const guard=prefix.match(
    /^\s*if\s*\(window\.__radarApplicationProfile\.viewer\s*&&\s*!window\.__radarApplicationProfile\.allowsMenu\(event\.target\)\)\s*return;/
  );

  assert.ok(
    guard,
    'Profile guard must precede legacy menu handling'
  );

  const source=
    signature+
    guard[0]+
    '\nthrow Error("LEGACY_HANDLER_REACHED");\n}'+
    '\nhandleMenuAction;';

  const handle=runInNewContext(
    source,
    sandbox
  );

  for(const target of [
    'files:newcatalog',
    'files:savecatalogjson',
    'radartools:createdraft',
    'radartools:publishcatalogrevision',
    'radartools:archivecatalogrevision',
    'layouts:random'
  ]){
    assert.doesNotThrow(
      ()=>handle({target})
    );
  }

  for(const target of [
    'files:loadcatalogjson',
    'radartools:selectcatalogrevision'
  ]){
    assert.throws(
      ()=>handle({target}),
      /LEGACY_HANDLER_REACHED/
    );
  }
});

test('creator: historical menu actions remain available',()=>{
  const {profile}=environment();

  for(const target of [
    'files:newcatalog',
    'files:savecatalogjson',
    'radartools:createdraft',
    'radartools:publishcatalogrevision'
  ]){
    assert.equal(
      profile.allowsMenu(target),
      true
    );
  }
});

test('invalid profile: consultation and mutation denied',()=>{
  const {profile}=environment(
    '?profile=unknown'
  );

  assert.equal(profile.valid,false);
  assert.equal(profile.viewer,true);

  assert.equal(
    profile.allowsMenu(
      'files:loadcatalogjson'
    ),
    false
  );

  assert.equal(
    profile.allowsToolbar(
      'item2:catrev_0'
    ),
    false
  );

  assert.throws(
    ()=>profile.require('catalog.open'),
    error=>error.code==='CAPABILITY_DENIED'
  );
});
