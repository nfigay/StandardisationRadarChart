#!/usr/bin/env node
/** S14-J: Compare two immutable ISO Open Data releases without changing them.
 * Output a verified change journal; absence from a snapshot is NOT proof of withdrawal.
 */
import { createReadStream, readFileSync, existsSync, mkdirSync, writeFileSync, renameSync, rmSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import { createGunzip } from 'node:zlib';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { pipeline } from 'node:stream/promises';
const hash=b=>createHash('sha256').update(b).digest('hex');
const releaseId=s=>/^\d{4}-\d{2}-\d{2}(?:[.-][a-zA-Z0-9_-]+)?$/.test(s);
const VALID_DATASETS=['deliverables','committees'];
function canonical(value){if(Array.isArray(value))return value.map(canonical);if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])]));return value;}
function printable(value){return value===undefined?null:canonical(value);}
export function keyFields(type,r){
 const names=type==='deliverables'?['reference','title','scope','icsCode','ownerCommittee','currentStage','edition','publicationDate','replaces','replacedBy','status','languages','deliverableType','supplementType']:['reference','title','scope','parentId','childrenId','status','committeeLiaisons'];
 return Object.fromEntries(names.filter(n=>Object.hasOwn(r,n)).map(n=>[n,printable(r[n])]));
}
function changeFields(oldEntry,newEntry){const keys=new Set([...Object.keys(oldEntry),...Object.keys(newEntry)]);return [...keys].sort().filter(k=>JSON.stringify(oldEntry[k])!==JSON.stringify(newEntry[k]));}
async function fileSha256(path){const h=createHash('sha256');let bytes=0;for await(const chunk of createReadStream(path)){h.update(chunk);bytes+=chunk.length;}return {sha256:h.digest('hex'),bytes};}
async function loadRelease(dir,release){
 if(!releaseId(release))throw Error('Identifiant de release invalide');
 const base=join(dir,'releases',release),manifest=JSON.parse(readFileSync(join(base,'manifest.json'),'utf8'));
 if(manifest.catalogId!=='iso'||manifest.schemaVersion!==1||manifest.release!==release)throw Error('Manifeste incompatible : '+release);
 const result={manifest,records:{}};
 for(const type of VALID_DATASETS){
  const entry=manifest.datasets?.find(x=>x.id===type);
  if(!entry||entry.path!==type+'.jsonl.gz'||entry.compression!=='gzip'||!Number.isSafeInteger(entry.records)||entry.records<1||!/^[a-f0-9]{64}$/i.test(entry.sha256))throw Error('Jeu absent ou incompatible : '+type);
  const path=join(base,entry.path),actual=await fileSha256(path);
  if(actual.sha256!==entry.sha256||actual.bytes!==entry.bytes)throw Error('Intégrité invalide : '+release+'/'+type);
  const records=new Map();let count=0;
  const reader=createInterface({input:createReadStream(path).pipe(createGunzip()),crlfDelay:Infinity});
  for await(const line of reader){if(!line.trim())continue;let record;try{record=JSON.parse(line);}catch{throw Error('Ligne JSONL invalide : '+type+' '+(count+1));}const id=String(record?.id||'');if(!id||records.has(id))throw Error('Identifiant absent ou dupliqué : '+type+' '+id);records.set(id,record);count++;}
  if(count!==entry.records)throw Error('Nombre d’enregistrements incohérent : '+type);
  result.records[type]=records;
 }
 return result;
}
export async function compare({distribution,from,to}){
 if(!releaseId(from)||!releaseId(to)||from===to)throw Error('Deux releases distinctes requises');
 const base=resolve(distribution),before=await loadRelease(base,from),after=await loadRelease(base,to);
 const changes=[],counts={};
 for(const type of VALID_DATASETS){const oldMap=before.records[type],newMap=after.records[type];const stat={added:0,missing:0,changed:0,unchanged:0};
  for(const [id,newRaw] of newMap){const oldRaw=oldMap.get(id);if(!oldRaw){stat.added++;changes.push({dataset:type,id,kind:'added',reference:newRaw.reference??'',current:keyFields(type,newRaw)});continue;}
   const previous=keyFields(type,oldRaw),current=keyFields(type,newRaw),fields=changeFields(previous,current);
   if(fields.length){stat.changed++;changes.push({dataset:type,id,kind:'changed',reference:newRaw.reference??oldRaw.reference??'',fields,before:Object.fromEntries(fields.map(k=>[k,previous[k]??null])),after:Object.fromEntries(fields.map(k=>[k,current[k]??null]))});}else stat.unchanged++;
  }
  for(const [id,oldRaw] of oldMap)if(!newMap.has(id)){stat.missing++;changes.push({dataset:type,id,kind:'missing',reference:oldRaw.reference??'',previous:keyFields(type,oldRaw)});}
  counts[type]=stat;
 }
 changes.sort((a,b)=>a.dataset.localeCompare(b.dataset)||a.kind.localeCompare(b.kind)||String(a.reference).localeCompare(String(b.reference))||a.id.localeCompare(b.id));
 return {schemaVersion:1,catalogId:'iso',from,to,generatedAt:new Date().toISOString(),semantics:{missing:'Absent du nouveau jeu, pas nécessairement retiré ou déprécié',changed:'Modification de métadonnées entre deux instantanés, pas un événement certifié ISO'},counts,changes};
}
export async function publishJournal(opts){const {distribution,from,to}=opts;const base=resolve(distribution),name=from+'--'+to,folder=join(base,'changes'),indexPath=join(folder,'index.json'),out=join(folder,name+'.json');
 if(existsSync(out))throw Error('Journal existant et immuable : '+out);
 const journal=await compare(opts),data=Buffer.from(JSON.stringify(journal)+'\n');mkdirSync(folder,{recursive:true});
 let index={schemaVersion:1,catalogId:'iso',journals:[]};if(existsSync(indexPath)){index=JSON.parse(readFileSync(indexPath,'utf8'));if(index.schemaVersion!==1||index.catalogId!=='iso'||!Array.isArray(index.journals))throw Error('Index des changements incompatible');}
 if(index.journals.some(x=>x.from===from&&x.to===to))throw Error('Journal déjà référencé');
 const tmp=out+'.partial-'+process.pid;writeFileSync(tmp,data,{flag:'wx'});renameSync(tmp,out);
 const descriptor={from,to,path:name+'.json',bytes:data.length,sha256:hash(data),counts:journal.counts,generatedAt:journal.generatedAt};
 const next={...index,journals:[...index.journals,descriptor]};const indexTmp=indexPath+'.partial-'+process.pid;
 try{writeFileSync(indexTmp,JSON.stringify(next,null,2)+'\n',{flag:'wx'});renameSync(indexTmp,indexPath);}catch(e){rmSync(indexTmp,{force:true});throw e;}
 return {operation:'S14-J-CATALOG-CHANGES',from,to,output:out,sha256:descriptor.sha256,counts:journal.counts,ok:true};
}
function parseArgs(argv){const o={};for(let i=0;i<argv.length;i++){const k=argv[i];if(!['--distribution','--from','--to'].includes(k)||!argv[i+1]||argv[i+1].startsWith('--'))throw Error('Argument invalide : '+k);o[k.slice(2)]=argv[++i];}if(!o.distribution||!o.from||!o.to)throw Error('--distribution, --from et --to obligatoires');return o;}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){try{console.log(JSON.stringify(await publishJournal(parseArgs(process.argv.slice(2))),null,2));}catch(e){console.log(JSON.stringify({operation:'S14-J-CATALOG-CHANGES',ok:false,error:e.message},null,2));process.exitCode=1;}}
