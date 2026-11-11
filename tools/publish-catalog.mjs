#!/usr/bin/env node
/** Build a static, immutable SDO catalog release from locally collected JSONL files.
 * Node >= 20; no network, credentials or application user data.
 */
import { createHash } from 'node:crypto';
import { createReadStream, createWriteStream, existsSync, mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { createGzip } from 'node:zlib';
import { fileURLToPath } from 'node:url';

export const DATASETS = Object.freeze({deliverables:'iso_deliverables_metadata',committees:'iso_technical_committees'});
const hex = /^[a-f0-9]{64}$/i;
const digest = buf => createHash('sha256').update(buf).digest('hex');
const safeRelease = s => /^\d{4}-\d{2}-\d{2}(?:[.-][a-zA-Z0-9_-]+)?$/.test(s);
function options(argv){const a={};for(let i=0;i<argv.length;i++){if(argv[i].startsWith('--')){const k=argv[i].slice(2);if(!['repo','out','release'].includes(k)||!argv[i+1]||argv[i+1].startsWith('--'))throw Error('Option incorrecte: '+argv[i]);a[k]=argv[++i];}else throw Error('Argument inattendu: '+argv[i]);}return a;}
async function hashFile(file){const h=createHash('sha256');let bytes=0;for await(const chunk of createReadStream(file)){h.update(chunk);bytes+=chunk.length;}return {sha256:h.digest('hex'),bytes};}
async function inspectJsonl(file){let records=0,first='';const h=createHash('sha256');let partial='';for await(const chunk of createReadStream(file)){h.update(chunk);partial+=chunk.toString('utf8');let pos;while((pos=partial.indexOf('\n'))>=0){const line=partial.slice(0,pos).trim();partial=partial.slice(pos+1);if(!line)continue;records++;if(!first)first=line; if(records===1||records%10000===0){const item=JSON.parse(line);if(!item||typeof item!=='object'||!item.id)throw Error('Enregistrement sans identifiant: '+file);}}if(partial.length>8*1024*1024)throw Error('Ligne JSONL trop volumineuse');}if(partial.trim()){records++;if(!first)first=partial.trim();}if(!records||!JSON.parse(first).id)throw Error('JSONLines vide ou invalide: '+file);return {records};}
export async function publish({repo,out,release}){
 const root=resolve(repo),destination=resolve(out),date=release;
 if(!safeRelease(date))throw Error('Identifiant de version invalide (YYYY-MM-DD[.suffix])');
 const source=join(root,'iso-open-data-cache'),prior=join(source,'manifest.json');
 if(!existsSync(prior))throw Error('Manifeste local ISO absent : '+prior);
 const collected=JSON.parse(readFileSync(prior,'utf8'));
 if(collected.schemaVersion!==1||!Array.isArray(collected.datasets))throw Error('Manifeste de collecte incompatible');
 const releaseDir=join(destination,'releases',date);
 if(existsSync(releaseDir))throw Error('Version déjà publiée (immuable): '+releaseDir);
 mkdirSync(join(destination,'releases'),{recursive:true});const temp=releaseDir+'.partial-'+process.pid;mkdirSync(temp,{recursive:false});
 const report={operation:'S14-I-CATALOG-PUBLISH',release:date,output:releaseDir,datasets:[],ok:false};
 try{
  for(const [type,sourceName] of Object.entries(DATASETS)){
   const entry=collected.datasets.find(x=>x.type===type);
   if(!entry||entry.file!==type+'.jsonl'||!hex.test(entry.sha256))throw Error('Entrée absente ou non fiable : '+type);
   const input=join(source,entry.file);if(!existsSync(input)||!statSync(input).isFile())throw Error('Fichier absent : '+input);
   const actual=await hashFile(input);
   if(actual.sha256!==entry.sha256||actual.bytes!==entry.bytes)throw Error('Empreinte de collecte incorrecte : '+type);
   const inspection=await inspectJsonl(input),filename=type+'.jsonl.gz',output=join(temp,filename);
   await pipeline(createReadStream(input),createGzip({level:6,mtime:0}),createWriteStream(output,{flags:'wx'}));
   const compressed=await hashFile(output);report.datasets.push({id:type,source:sourceName,path:filename,compression:'gzip',mediaType:'application/x-ndjson',bytes:compressed.bytes,sha256:compressed.sha256,uncompressedBytes:actual.bytes,uncompressedSha256:actual.sha256,records:inspection.records});
  }
  const manifest={schemaVersion:1,catalogId:'iso',release:date,source:'ISO Open Data',sourceLicense:'ODC-By 1.0',sourceManifestUpdatedAt:collected.updatedAt??null,generatedAt:new Date().toISOString(),datasets:report.datasets};
  writeFileSync(join(temp,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');renameSync(temp,releaseDir);
  const pointer={schemaVersion:1,catalogId:'iso',release:date,manifest:'releases/'+date+'/manifest.json'};
  const pointerTmp=join(destination,'manifest.json.tmp-'+process.pid);writeFileSync(pointerTmp,JSON.stringify(pointer,null,2)+'\n');renameSync(pointerTmp,join(destination,'manifest.json'));
  report.ok=true;return report;
 }catch(e){rmSync(temp,{recursive:true,force:true});throw e;}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{const args=options(process.argv.slice(2));const root=resolve(args.repo||process.cwd());const result=await publish({repo:root,out:args.out||join(root,'catalog-distribution'),release:args.release||new Date().toISOString().slice(0,10)});console.log(JSON.stringify(result,null,2));}
 catch(e){console.log(JSON.stringify({operation:'S14-I-CATALOG-PUBLISH',ok:false,error:e.message},null,2));process.exitCode=1;}
}
