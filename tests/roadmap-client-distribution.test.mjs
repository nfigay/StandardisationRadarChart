import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtempSync,mkdirSync,writeFileSync,rmSync
} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

import {
  verifyClientBuild
} from '../scripts/verify-client-build.mjs';

function fixture(){
  const dir=mkdtempSync(join(tmpdir(),'radar-distribution-'));
  mkdirSync(join(dir,'assets'));

  writeFileSync(
    join(dir,'client.html'),
    '<input id="package-file">' +
    '<script type="module" src="./assets/client.js"></script>'
  );

  writeFileSync(
    join(dir,'assets/client.js'),
    'console.log("client")'
  );

  return dir;
}

test('accepts a minimal client-only distribution',()=>{
  const dir=fixture();

  try{
    const result=verifyClientBuild(dir,{
      writeManifest:true
    });

    assert.equal(result.product,'client');
    assert.equal(result.catalogueBundled,false);
    assert.equal(result.files.length,2);

    assert.doesNotThrow(()=>verifyClientBuild(dir));
  }finally{
    rmSync(dir,{recursive:true,force:true});
  }
});

test('rejects a bundled ISO distribution',()=>{
  const dir=fixture();

  try{
    mkdirSync(join(dir,'catalog-distribution'));
    writeFileSync(
      join(dir,'catalog-distribution/manifest.json'),'{}'
    );

    assert.throws(
      ()=>verifyClientBuild(dir,{writeManifest:true}),
      /Forbidden creator asset/
    );
  }finally{
    rmSync(dir,{recursive:true,force:true});
  }
});

test('rejects creator-only application assets',()=>{
  const dir=fixture();

  try{
    writeFileSync(join(dir,'radar.html'),'creator');

    assert.throws(
      ()=>verifyClientBuild(dir,{writeManifest:true}),
      /Forbidden creator asset/
    );
  }finally{
    rmSync(dir,{recursive:true,force:true});
  }
});

test('rejects references to creator ISO services',()=>{
  const dir=fixture();

  try{
    writeFileSync(
      join(dir,'assets/client.js'),
      'import "./radar-catalog-persistence.js";'
    );

    assert.throws(
      ()=>verifyClientBuild(dir,{writeManifest:true}),
      /Forbidden client dependency/
    );
  }finally{
    rmSync(dir,{recursive:true,force:true});
  }
});

test('detects an altered distribution file',()=>{
  const dir=fixture();

  try{
    verifyClientBuild(dir,{writeManifest:true});
    writeFileSync(
      join(dir,'assets/client.js'),
      'console.log("modified")'
    );

    assert.throws(
      ()=>verifyClientBuild(dir),
      /manifest mismatch/
    );
  }finally{
    rmSync(dir,{recursive:true,force:true});
  }
});
