import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtempSync,mkdirSync,writeFileSync,
  readFileSync,rmSync
} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
import {runInNewContext} from 'node:vm';
import {build as viteBuild} from 'vite';

import {
  buildClientVariants,
  verifyClientVariants,
  MODULE_FILES,
  ENTRIES
} from '../scripts/build-client-variants.mjs';

import {
  verifyClientBuild
} from '../scripts/verify-client-build.mjs';

import {
  createClientView
} from '../js/roadmap-client.mjs';

import {
  createPublishedRoadmapProjection
} from '../src/domain/roadmap-published-projection.mjs';

import {
  catalog
} from './fixtures/roadmap-client-catalog.mjs';

function temporary(t){
  const root=mkdtempSync(
    join(tmpdir(),'radar-client-modes-')
  );

  t.after(()=>rmSync(root,{
    recursive:true,force:true
  }));

  return root;
}

function synthetic(t){
  const root=temporary(t);

  mkdirSync(join(root,'assets'));

  writeFileSync(
    join(root,'client.html'),
    '<input id="package-file">'+
    '<script type="module" src="./assets/client-test.js"></script>'
  );

  writeFileSync(
    join(root,'assets/client-test.js'),
    'console.log("client");'
  );

  buildClientVariants({output:root});

  return root;
}

function roadmap(){
  const data=catalog();

  data.radarRevisions[0]
    .blips[0].position={x:310,y:275};

  return createPublishedRoadmapProjection(
    data,'rev'
  );
}

class Element {
  constructor(tag='div'){
    this.tagName=tag;
    this.children=[];
    this.attributes={};
    this.listeners={};
    this.textContent='';
    this.files=[];
  }

  appendChild(child){
    this.children.push(child);
    return child;
  }

  replaceChildren(...children){
    this.children=children;
  }

  setAttribute(name,value){
    this.attributes[name]=String(value);
  }

  addEventListener(name,handler){
    this.listeners[name]=handler;
  }
}

async function execute(code){
  const nodes=Object.fromEntries(
    [
      'package-file','message','roadmap-title',
      'roadmap-meta','radar','items','details'
    ].map(id=>[id,new Element(id)])
  );

  const document={
    getElementById:id=>nodes[id]||null,
    createElement:tag=>new Element(tag),
    createElementNS:(_,tag)=>new Element(tag)
  };

  runInNewContext(
    code,{document,console},{timeout:3000}
  );

  const input=nodes['package-file'];

  assert.equal(
    typeof input.listeners.change,
    'function'
  );

  input.files=[{
    text:async()=>JSON.stringify(roadmap())
  }];

  await input.listeners.change();

  assert.equal(
    nodes['roadmap-title'].textContent,
    'Roadmap exemple'
  );

  assert.match(
    nodes.message.textContent,
    /Roadmap publiée chargée/
  );

  const point=nodes.radar.children.find(
    e=>e.tagName==='circle' &&
      e.attributes.r==='8'
  );

  assert.ok(point);
  assert.equal(point.attributes.cx,'310');
  assert.equal(point.attributes.cy,'275');

  const rings=nodes.radar.children
    .filter(e=>e.tagName==='circle' &&
      e.attributes.fill==='none')
    .map(e=>e.attributes.r);

  assert.deepEqual(rings,['350','250','150']);

  assert.equal(
    nodes.items.children[0].children[0]
      .attributes['aria-pressed'],
    'true'
  );

  assert.ok(
    nodes.details.children.some(
      e=>e.textContent==='Norme : ISO A'
    )
  );

  const invalid=roadmap();
  invalid.lifecycle='draft';

  input.files=[{
    text:async()=>JSON.stringify(invalid)
  }];

  await input.listeners.change();

  assert.match(
    nodes.message.textContent,
    /Paquet refusé/
  );

  assert.equal(
    nodes.radar.children.length,0
  );
}

test('Client: build reel, trois variantes et execution des bundles',async t=>{
  const root=temporary(t);

  await viteBuild({
    configFile:resolve(
      'vite.client.config.js'
    ),
    logLevel:'error',
    build:{
      outDir:root,
      emptyOutDir:false
    }
  });

  const result=buildClientVariants({
    output:root
  });

  assert.equal(result.modes,3);
  assert.equal(result.nativeModules,2);
  assert.equal(result.bundledJavaScriptFiles,1);

  const html=readFileSync(
    join(root,ENTRIES.standalone),'utf8'
  );

  const scripts=[...html.matchAll(
    /<script>([\s\S]*?)<\/script>/g
  )];

  assert.equal(scripts.length,1);

  assert.doesNotMatch(
    html,/<script[^>]*src=/
  );

  await execute(scripts[0][1]);

  await execute(readFileSync(
    join(root,'bundled/radar-client.js'),
    'utf8'
  ));

  const manifest=verifyClientBuild(
    root,{writeManifest:true}
  );

  assert.equal(manifest.files.length,8);
  assert.equal(manifest.catalogueBundled,false);

  assert.deepEqual(
    verifyClientBuild(root),manifest
  );
});

test('Client ES6: sources natives et projection identiques',async t=>{
  const root=synthetic(t);

  for(const name of MODULE_FILES){
    assert.deepEqual(
      readFileSync(join(root,'modules',name)),
      readFileSync(name)
    );
  }

  const native=await import(
    pathToFileURL(join(
      root,'modules/js/roadmap-client.mjs'
    )).href
  );

  const view=native.createClientView(roadmap());

  assert.deepEqual(
    view,createClientView(roadmap())
  );

  assert.equal(view.items[0].x,310);
  assert.equal(view.items[0].y,275);
  assert.equal(view.items[0].ring,'adopt');
  assert.equal(view.items[0].quadrant,'standards');

  const invalid=roadmap();
  invalid.lifecycle='draft';

  assert.throws(
    ()=>native.createClientView(invalid),
    /unsupported/
  );
});

test('Client: alteration du standalone detectee',t=>{
  const root=synthetic(t);

  writeFileSync(
    join(root,ENTRIES.standalone),
    '<html>modified</html>'
  );

  assert.throws(
    ()=>verifyClientVariants(root),
    /Standalone HTML mismatch/
  );
});

test('Client: module manquant detecte',t=>{
  const root=synthetic(t);

  rmSync(join(
    root,'modules/js/roadmap-client.mjs'
  ));

  assert.throws(
    ()=>verifyClientVariants(root),
    /inventory mismatch/
  );
});

test('Client: protection et inventaire strict',t=>{
  const root=synthetic(t);

  assert.throws(
    ()=>buildClientVariants({output:root}),
    /already exists/
  );

  writeFileSync(
    join(root,'bundled/extra.js'),''
  );

  assert.throws(
    ()=>verifyClientVariants(root),
    /inventory mismatch/
  );
});
