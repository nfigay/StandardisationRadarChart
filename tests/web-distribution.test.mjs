import test from 'node:test';
import assert from 'node:assert/strict';

import {
  mkdtempSync,
  writeFileSync,
  rmSync
} from 'node:fs';

import {join} from 'node:path';
import {tmpdir} from 'node:os';

import {
  contract,
  inventory,
  verifyInventory,
  checkEntry
} from '../scripts/build-web-distribution.mjs';

test('six variantes, deux produits, trois modes',()=>{
  const c=contract('5ce3475');

  assert.equal(c.variants.length,6);

  assert.equal(
    c.variants.filter(
      x=>x.status==='available'
    ).length,
    1
  );

  for(const product of ['author','client']){
    const variants=c.variants.filter(
      v=>v.product===product
    );

    assert.deepEqual(
      variants.map(v=>v.mode).sort(),
      ['bundled','modules','standalone']
    );
  }

  for(const v of c.variants){
    assert.equal(
      v.isoCatalogue,
      v.product==='author'
    );

    assert.equal(
      v.requiresServer,
      v.mode!=='standalone'
    );

    if(v.status==='planned'){
      assert.equal(v.entry,null);
    }
  }
});

test('inventaire : detection des modifications',()=>{
  const root=mkdtempSync(
    join(tmpdir(),'radar-dist-')
  );

  try{
    const filename=join(root,'index.html');

    writeFileSync(filename,'PLM');

    const files=inventory(root);

    verifyInventory(root,files);

    writeFileSync(filename,'changed');

    assert.throws(
      ()=>verifyInventory(root,files),
      /mismatch/
    );

  }finally{
    rmSync(root,{
      recursive:true,
      force:true
    });
  }
});

test('ressources : resolution sous le prefixe Pages',()=>{
  const root=mkdtempSync(
    join(tmpdir(),'radar-dist-')
  );

  try{
    writeFileSync(
      join(root,'app.js'),''
    );

    writeFileSync(
      join(root,'index.html'),
      '<script src="/StandardisationRadarChart/app.js"></script>'
    );

    checkEntry(root,'index.html');

    writeFileSync(
      join(root,'index.html'),
      '<script src="/app.js"></script>'
    );

    assert.throws(
      ()=>checkEntry(root,'index.html'),
      /outside project/
    );

  }finally{
    rmSync(root,{
      recursive:true,
      force:true
    });
  }
});

test('ressources : fichier local manquant detecte',()=>{
  const root=mkdtempSync(
    join(tmpdir(),'radar-dist-')
  );

  try{
    writeFileSync(
      join(root,'index.html'),
      '<script src="./missing.js"></script>'
    );

    assert.throws(
      ()=>checkEntry(root,'index.html'),
      /Missing resource/
    );

  }finally{
    rmSync(root,{
      recursive:true,
      force:true
    });
  }
});
