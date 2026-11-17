#!/usr/bin/env node
// S16: projection of official OMG identity pointers only.
// No copyrighted title, descriptive text, HTML, PDF, source snapshot or ISO cache.
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,join,dirname} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import vm from 'node:vm';

export function project(source,api,{family=null}={}){
  assert.equal(source.distribution,'private-only');
  assert.equal(source.schemaVersion,1);
  assert.equal(source.coverage?.complete,true,'Incomplete source must not be published');
  const verified=family?api.validateOmgHistory(source,family):api.validateOmgOnlineSnapshot(source);
  const records=verified.rows.map(r=>family?{url:r.url,publicationDate:r.publicationDate}:{url:r.url,status:r.status,publicationDate:r.publicationDate})
    .sort((a,b)=>a.url.localeCompare(b.url));
  assert.equal(new Set(records.map(r=>r.url)).size,records.length);
  return {
    schemaVersion:1,
    sourceId:family?'omg-public-history-links':'omg-public-links',
    ...(family?{family}:{}),
    distribution:'public-links-only',
    provenance:{url:family?api.omg.familyUrl(family):api.omg.CATALOG,acquiredAt:source.provenance.acquiredAt},
    coverage:{complete:true,records:records.length},
    records
  };
}
export function sourceApi(script){const context=vm.createContext({URL,TextEncoder,TextDecoder,AbortSignal});vm.runInContext(script,context,{timeout:2000});return context.__radarStandardSources;}
export function publish({catalog,history,out,sourceScript}){
  if(existsSync(out))throw Error('Output already exists: '+out);
  const api=sourceApi(readFileSync(sourceScript,'utf8'));
  const source=JSON.parse(readFileSync(catalog,'utf8'));
  const index=project(source,api);
  const histories=[];
  for(const path of history){
    const data=JSON.parse(readFileSync(path,'utf8'));
    const family=data.family;
    // Nested official families are allowed, but traversal/encoding never is.
    api.omg.familyUrl(family);
    if(histories.some(h=>h.family===family))throw Error('Duplicate OMG family');
    histories.push({family,data:project(data,api,{family})});
  }
  // Fail before creating the output if any source is invalid.
  mkdirSync(join(out,'histories'),{recursive:true});
  const payload=JSON.stringify(index,null,2)+'\n';
  writeFileSync(join(out,'index.json'),payload,{flag:'wx'});
  for(const h of histories){const file=join(out,'histories',h.family+'.json');mkdirSync(dirname(file),{recursive:true});writeFileSync(file,JSON.stringify(h.data,null,2)+'\n',{flag:'wx'});}
  const digest=createHash('sha256').update(payload).digest('hex');
  return {records:index.records.length,histories:histories.map(h=>({family:h.family,records:h.data.records.length})),sha256:digest,out};
}
if(process.argv[1]&&resolve(process.argv[1])===resolve(new URL(import.meta.url).pathname)){
  const argv=process.argv.slice(2),value=(k)=>{const i=argv.indexOf(k);return i<0?null:argv[i+1]};
  const catalog=value('--catalog'),out=value('--out'),history=[];
  for(let i=0;i<argv.length;i++)if(argv[i]==='--history')history.push(argv[i+1]);
  if(!catalog||!out){console.error('Usage: node tools/prepare-omg-public-links.mjs --catalog <private-snapshot.json> --history <UML.json> --out catalog-distribution/omg-public');process.exit(2);}
  try{console.log(JSON.stringify(publish({catalog,history,out,sourceScript:resolve('js/radar-standard-sources.js')}),null,2));}
  catch(e){console.error('OMG PUBLIC LINKS ERROR: '+e.message);process.exit(1);}
}
