import test from 'node:test';
import assert from 'node:assert/strict';

import {
  mkdtempSync,mkdirSync,writeFileSync,
  readFileSync,rmSync,existsSync
} from 'node:fs';

import {tmpdir} from 'node:os';
import {join} from 'node:path';

import {
  verifyClientBuild
} from '../scripts/verify-client-build.mjs';

import {
  assembleProducts,verifyProducts,RELEASE_FORMAT
} from '../scripts/assemble-products.mjs';

function fixture(){
  const root=mkdtempSync(
    join(tmpdir(),'radar-products-')
  );

  const author=join(root,'source-author');
  const client=join(root,'source-client');
  const output=join(root,'release');

  mkdirSync(
    join(author,'catalog-distribution'),
    {recursive:true}
  );
  mkdirSync(join(client,'assets'),{recursive:true});

  writeFileSync(
    join(author,'radar.html'),
    '<html>Creator</html>'
  );

  writeFileSync(
    join(author,'radar-catalog-config.json'),'{}'
  );

  writeFileSync(
    join(author,'catalog-distribution/manifest.json'),'{}'
  );

  writeFileSync(
    join(client,'client.html'),
    '<input id="package-file">' +
    '<script type="module" src="./assets/client.js"></script>'
  );

  writeFileSync(
    join(client,'assets/client.js'),
    'console.log("isolated client");'
  );

  verifyClientBuild(client,{writeManifest:true});

  return {
    root,author,client,output,
    commit:'fe7b091'
  };
}

function create(f){
  return assembleProducts({
    authorDir:f.author,
    clientDir:f.client,
    outputDir:f.output,
    commit:f.commit
  });
}

test('assemble les deux produits séparément',()=>{
  const f=fixture();

  try{
    const release=create(f);

    assert.equal(release.format,RELEASE_FORMAT);
    assert.equal(release.products.author.product,'author');
    assert.equal(release.products.client.product,'client');

    assert.ok(existsSync(
      join(f.output,'author/radar.html')
    ));
    assert.ok(existsSync(
      join(f.output,'client/client.html')
    ));
  }finally{
    rmSync(f.root,{recursive:true,force:true});
  }
});

test('catalogue ISO seulement côté Créateur',()=>{
  const f=fixture();

  try{
    create(f);

    assert.ok(existsSync(
      join(f.output,'author/catalog-distribution/manifest.json')
    ));

    assert.equal(existsSync(
      join(f.output,'client/catalog-distribution')
    ),false);
  }finally{
    rmSync(f.root,{recursive:true,force:true});
  }
});

test('refuse tout écrasement d’une livraison',()=>{
  const f=fixture();

  try{
    create(f);

    assert.throws(
      ()=>create(f),
      /already exists/
    );
  }finally{
    rmSync(f.root,{recursive:true,force:true});
  }
});

test('détecte toute altération du paquet Client',()=>{
  const f=fixture();

  try{
    create(f);

    writeFileSync(
      join(f.output,'client/assets/client.js'),
      'console.log("modified");'
    );

    assert.throws(
      ()=>verifyProducts(f.output),
      /mismatch/
    );
  }finally{
    rmSync(f.root,{recursive:true,force:true});
  }
});

test('détecte toute altération du Créateur',()=>{
  const f=fixture();

  try{
    create(f);

    writeFileSync(
      join(f.output,'author/radar.html'),
      '<html>Modified Creator</html>'
    );

    assert.throws(
      ()=>verifyProducts(f.output),
      /mismatch/
    );
  }finally{
    rmSync(f.root,{recursive:true,force:true});
  }
});

test('la publication garde sa provenance Git',()=>{
  const f=fixture();

  try{
    create(f);

    const saved=JSON.parse(readFileSync(
      join(f.output,'release-manifest.json'),
      'utf8'
    ));

    assert.equal(saved.sourceCommit,'fe7b091');
    assert.equal(verifyProducts(f.output).version,1);
  }finally{
    rmSync(f.root,{recursive:true,force:true});
  }
});
