import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtempSync,mkdirSync,writeFileSync,
  readFileSync,rmSync,existsSync
} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';

import {verifyClientBuild}
  from '../scripts/verify-client-build.mjs';

import {assembleProducts}
  from '../scripts/assemble-products.mjs';

import {
  preparePagesMultiProducts,
  verifyPagesMultiProducts
} from '../scripts/prepare-pages-products.mjs';

function fixture(){
  const root=mkdtempSync(
    join(tmpdir(),'radar-pages-products-')
  );
  const pages=join(root,'pages');
  const client=join(root,'client-source');
  const products=join(root,'products');
  const final=join(root,'final');

  mkdirSync(join(pages,'catalog-distribution'),{
    recursive:true
  });
  mkdirSync(join(client,'assets'),{
    recursive:true
  });

  writeFileSync(join(pages,'radar.html'),
    '<html>Historical Creator</html>');
  writeFileSync(join(pages,'index.html'),
    '<meta http-equiv="refresh" content="0; url=./radar.html">');
  writeFileSync(
    join(pages,'radar-catalog-config.json'),'{}'
  );
  writeFileSync(
    join(pages,'catalog-distribution/manifest.json'),'{}'
  );

  writeFileSync(join(client,'client.html'),
    '<input id="package-file">'+
    '<script type="module" src="./assets/client.js"></script>'
  );
  writeFileSync(join(client,'assets/client.js'),
    'console.log("client")'
  );

  verifyClientBuild(client,{writeManifest:true});

  assembleProducts({
    authorDir:pages,
    clientDir:client,
    outputDir:products,
    commit:'9dfd56b'
  });

  return {root,pages,products,final};
}

function stage(f){
  return preparePagesMultiProducts({
    pagesDir:f.pages,
    productsDir:f.products,
    outputDir:f.final
  });
}

test('préserve les URLs historiques du Créateur',()=>{
  const f=fixture();
  try{
    stage(f);
    assert.equal(
      readFileSync(join(f.final,'radar.html'),'utf8'),
      readFileSync(join(f.pages,'radar.html'),'utf8')
    );
    assert.ok(existsSync(
      join(f.final,'author/radar.html')
    ));
  }finally{
    rmSync(f.root,{recursive:true,force:true});
  }
});

test('expose le Client sans catalogue global',()=>{
  const f=fixture();
  try{
    const result=stage(f);
    assert.equal(result.products.client.fileCount,3);
    assert.ok(existsSync(
      join(f.final,'client/client.html')
    ));
    assert.equal(existsSync(
      join(f.final,'client/catalog-distribution')
    ),false);
  }finally{
    rmSync(f.root,{recursive:true,force:true});
  }
});

test('vérifie les empreintes du site publié',()=>{
  const f=fixture();
  try{
    stage(f);
    writeFileSync(
      join(f.final,'client/assets/client.js'),
      'console.log("altered")'
    );
    assert.throws(
      ()=>verifyPagesMultiProducts(f.final),
      /mismatch/
    );
  }finally{
    rmSync(f.root,{recursive:true,force:true});
  }
});

test('refuse l’écrasement du site final',()=>{
  const f=fixture();
  try{
    stage(f);
    assert.throws(()=>stage(f),/already exists/);
  }finally{
    rmSync(f.root,{recursive:true,force:true});
  }
});

test('génère la redirection si le build local ne la contient pas',()=>{
  const f=fixture();
  try{
    rmSync(join(f.pages,'index.html'));
    stage(f);

    const redirect=readFileSync(
      join(f.final,'index.html'),'utf8'
    );

    assert.match(redirect,/url=\.\/radar\.html/);
    assert.ok(existsSync(join(f.final,'radar.html')));
    assert.doesNotThrow(
      ()=>verifyPagesMultiProducts(f.final)
    );
  }finally{
    rmSync(f.root,{recursive:true,force:true});
  }
});
