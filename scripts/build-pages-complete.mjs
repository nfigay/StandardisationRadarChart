import {
  existsSync, readFileSync, copyFileSync,
  cpSync, statSync
} from 'node:fs';
import {resolve, join, dirname, isAbsolute, sep} from 'node:path';
import {spawnSync} from 'node:child_process';

const root=process.cwd();
const output=resolve(root,'.radarchart-build/pages');
const catalog=resolve(root,'catalog-distribution');

function fail(message){
  console.error('PAGES BUILD ERROR:',message);
  process.exit(1);
}

function ensureFile(path){
  if(!existsSync(path)||!statSync(path).isFile()){
    fail('Missing file: '+path);
  }
}

function run(args){
  const result=spawnSync(process.execPath,args,{
    cwd:root,
    stdio:'inherit'
  });
  if(result.error)throw result.error;
  if(result.status!==0){
    fail('Command failed: node '+args.join(' '));
  }
}

function safeRelative(base,relative){
  if(typeof relative!=='string'||!relative.trim()||
     isAbsolute(relative)||relative.includes('\\')){
    fail('Invalid catalog path: '+relative);
  }
  const absolute=resolve(base,relative);
  if(absolute===base||!absolute.startsWith(base+sep)){
    fail('Catalog path escapes distribution: '+relative);
  }
  return absolute;
}

// Preflight all input resources before starting the build.
if(existsSync(output)){
  fail('Build output already exists: '+output);
}

const config=join(root,'radar-catalog-config.json');
const entry=join(catalog,'manifest.json');

ensureFile(config);
ensureFile(entry);

const manifest=JSON.parse(readFileSync(entry,'utf8'));
if(manifest.catalogId!=='iso'||!manifest.manifest){
  fail('Invalid ISO distribution entry manifest');
}

const releasePath=safeRelative(catalog,manifest.manifest);
ensureFile(releasePath);

const release=JSON.parse(readFileSync(releasePath,'utf8'));
if(!Array.isArray(release.datasets)||!release.datasets.length){
  fail('ISO release has no datasets');
}

for(const dataset of release.datasets){
  const file=safeRelative(dirname(releasePath),dataset.path);
  ensureFile(file);
  if(Number.isFinite(dataset.bytes)&&statSync(file).size!==dataset.bytes){
    fail('ISO dataset size mismatch: '+dataset.path);
  }
}

console.log('ISO distribution preflight OK:',manifest.release);

// Preserve the existing safe Vite build implementation.
run(['scripts/build-safe.mjs','pages']);

if(!existsSync(output)){
  fail('Vite did not produce the Pages directory');
}

const publishedConfig=join(output,'radar-catalog-config.json');
const publishedCatalog=join(output,'catalog-distribution');

if(existsSync(publishedConfig)||existsSync(publishedCatalog)){
  fail('Pages output already contains ISO distribution');
}

copyFileSync(config,publishedConfig);
cpSync(catalog,publishedCatalog,{recursive:true});

console.log('ISO distribution included in Pages artifact');

// Validate the actual final artifact, not only Vite output.
run([
  'tools/check-pages-readiness.mjs',
  '--repo','.',
  '--out','.radarchart-build/pages',
  '--strict'
]);

console.log('S14.1 COMPLETE PAGES BUILD: OK');
