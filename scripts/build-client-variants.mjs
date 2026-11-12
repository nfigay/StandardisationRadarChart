import assert from 'node:assert/strict';

import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  readdirSync,
  cpSync,
  rmSync
} from 'node:fs';

import {
  resolve,join,relative,sep
} from 'node:path';

import {Script} from 'node:vm';
import {fileURLToPath} from 'node:url';

export const MODULE_FILES=[
  'js/roadmap-client.mjs',
  'src/domain/roadmap-published-projection.mjs'
];

export const ENTRIES={
  standalone:'standalone/radar-client.html',
  bundled:'bundled/index.html',
  modules:'modules/index.html'
};

const SOURCE_TAG=
  '<script type="module" src="./js/roadmap-client.mjs"></script>';

const BUNDLE_TAG=
  '<script type="module" src="./radar-client.js"></script>';

const MANIFEST='distribution-manifest.json';

function text(root,name){
  return readFileSync(join(root,name),'utf8');
}

function files(root){
  const result=[];

  function visit(directory){
    for(const entry of readdirSync(
      directory,{withFileTypes:true}
    )){
      const full=join(directory,entry.name);

      assert(
        !entry.isSymbolicLink(),
        'Unexpected symlink: '+full
      );

      if(entry.isDirectory()){
        visit(full);
      }else{
        assert(entry.isFile(),
          'Unexpected entry: '+full);

        result.push(
          relative(root,full).split(sep).join('/')
        );
      }
    }
  }

  visit(root);

  return result.sort();
}

function replaceEntry(html,replacement){
  assert.equal(
    html.split(SOURCE_TAG).length,
    2,
    'Unexpected Client HTML entry'
  );

  return html.replace(
    SOURCE_TAG,
    ()=>replacement
  );
}

export function readBundle(root){
  const html=text(root,'client.html');

  const scripts=[...html.matchAll(
    /<script\b[^>]*\bsrc="([^"]+)"[^>]*>\s*<\/script>/gi
  )];

  assert.equal(
    scripts.length,
    1,
    'Expected exactly one compatibility bundle'
  );

  const src=scripts[0][1];

  assert.match(
    src,
    /^\.\/assets\/[A-Za-z0-9_-]+\.js$/,
    'Unexpected compatibility bundle URL'
  );

  const filename=src.slice(2);

  const code=text(root,filename);

  // Fail if Vite starts emitting ESM exports or
  // imports that cannot run as an isolated script.
  new Script(code,{filename});

  assert.doesNotMatch(
    code,
    /\bimport\s*\(/,
    'Dynamic import in Client bundle'
  );

  return {filename,code};
}

function assertOfflineTemplate(html){
  const body=replaceEntry(html,'');

  assert.doesNotMatch(
    body,
    /<(?:script|link|iframe|img|object|embed)\b/i,
    'External resource in standalone template'
  );

  assert.doesNotMatch(
    body,
    /@import\b|\burl\s*\(/i,
    'External CSS resource'
  );

  assert.match(html,/id="package-file"/);
  assert.match(html,/id="radar"/);
}

export function standaloneHTML(html,code){
  assertOfflineTemplate(html);

  // The current bundle has no module imports,
  // no exports and no server-side dependency.
  new Script(code);

  assert.doesNotMatch(
    code,
    /<\/script/i,
    'Unsafe script closing sequence'
  );

  assert.doesNotMatch(
    code,
    /\bimport\s*\(|\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b/,
    'Network or external module dependency'
  );

  const embedded=
    '<script>\n'+
    '(function(){\n"use strict";\n'+
    code+
    '\n})();\n'+
    '</script>';

  return replaceEntry(html,embedded);
}

function bundledHTML(html){
  return replaceEntry(html,BUNDLE_TAG);
}

function checkModuleClosure(root){
  const entry=text(root,MODULE_FILES[0]);

  const projection=text(root,MODULE_FILES[1]);

  // Explicit dependency closure of the current
  // Client, intentionally not the full src tree.
  const imports=[...entry.matchAll(
    /\bfrom\s*(['"])([^'"]+)\1/g
  )].map(match=>match[2]);

  assert.deepEqual(
    imports,
    ['../src/domain/roadmap-published-projection.mjs'],
    'Client import closure changed'
  );

  assert.doesNotMatch(
    entry,
    /\bimport\s*\(|\bimport\s*['"]/,
    'Unexpected additional Client import'
  );

  assert.doesNotMatch(
    projection,
    /^\s*import\b|\bimport\s*\(|\bfrom\s*['"]/m,
    'Projection is no longer autonomous'
  );
}

export function buildClientVariants({
  source=process.cwd(),
  output='.radarchart-build/client'
}={}){
  const sourceRoot=resolve(source);
  const root=resolve(output);

  const html=text(sourceRoot,'client.html');

  const {code}=readBundle(root);

  assertOfflineTemplate(html);
  checkModuleClosure(sourceRoot);

  const modes=Object.keys(ENTRIES);

  for(const mode of modes){
    assert(
      !existsSync(join(root,mode)),
      'Variant already exists: '+mode
    );
  }

  const standalone=standaloneHTML(html,code);
  const bundled=bundledHTML(html);

  const created=[];

  try{
    for(const mode of modes){
      const directory=join(root,mode);

      mkdirSync(directory);
      created.push(directory);
    }

    writeFileSync(
      join(root,ENTRIES.standalone),
      standalone,
      {flag:'wx'}
    );

    writeFileSync(
      join(root,ENTRIES.bundled),
      bundled,
      {flag:'wx'}
    );

    writeFileSync(
      join(root,'bundled/radar-client.js'),
      code,
      {flag:'wx'}
    );

    writeFileSync(
      join(root,ENTRIES.modules),
      html,
      {flag:'wx'}
    );

    for(const name of MODULE_FILES){
      const destination=join(root,'modules',name);

      mkdirSync(
        resolve(destination,'..'),
        {recursive:true}
      );

      cpSync(
        join(sourceRoot,name),
        destination,
        {force:false,errorOnExist:true}
      );
    }

    return verifyClientVariants(root);

  }catch(error){
    for(const directory of created){
      rmSync(directory,{
        recursive:true,
        force:true
      });
    }

    throw error;
  }
}

export function verifyClientVariants(directory){
  const root=resolve(directory);

  const {filename,code}=readBundle(root);

  const expected=[
    'client.html',
    filename,
    ENTRIES.standalone,
    ENTRIES.bundled,
    'bundled/radar-client.js',
    ENTRIES.modules,
    ...MODULE_FILES.map(
      name=>'modules/'+name
    )
  ].sort();

  const actual=files(root).filter(
    name=>name!==MANIFEST
  );

  assert.deepEqual(
    actual,
    expected,
    'Client variant inventory mismatch'
  );

  const html=text(root,ENTRIES.modules);

  assertOfflineTemplate(html);

  checkModuleClosure(
    join(root,'modules')
  );

  assert.equal(
    text(root,'bundled/radar-client.js'),
    code,
    'Bundled engine mismatch'
  );

  assert.equal(
    text(root,ENTRIES.bundled),
    bundledHTML(html),
    'Bundled HTML mismatch'
  );

  assert.equal(
    text(root,ENTRIES.standalone),
    standaloneHTML(html,code),
    'Standalone HTML mismatch'
  );

  const forbidden=[
    /catalog-distribution\//i,
    /radar-catalog-config\.json/i,
    /radar-catalog-persistence/i,
    /radar-iso-toolbar/i,
    /radar-s14-z-sources/i
  ];

  for(const name of actual){
    const content=text(root,name);

    for(const pattern of forbidden){
      assert.doesNotMatch(
        content,pattern,
        'Creator dependency: '+name
      );
    }
  }

  return {
    modes:3,
    files:actual.length,
    entries:ENTRIES,
    standaloneBytes:Buffer.byteLength(
      text(root,ENTRIES.standalone)
    ),
    bundledJavaScriptFiles:1,
    nativeModules:MODULE_FILES.length,
    catalogueBundled:false
  };
}

const invoked=process.argv[1] &&
  resolve(process.argv[1])===
    fileURLToPath(import.meta.url);

if(invoked){
  const mode=process.argv[2];

  assert(
    ['build','verify'].includes(mode),
    'Expected build or verify'
  );

  const output=process.argv[3] ||
    '.radarchart-build/client';

  const result=mode==='build'
    ?buildClientVariants({output})
    :verifyClientVariants(output);

  console.log('CLIENT THREE MODES OK');

  console.log(
    JSON.stringify(result,null,2)
  );
}
