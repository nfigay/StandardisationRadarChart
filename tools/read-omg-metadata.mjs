/* S16-A-R1: private, explicit OMG documentary discovery. No native mutations.
 * No dependency, no startup fetch, no recursive crawl, no PDF or normative models.
 * A documented basis is required for remote acquisition. Never infer rights from HTTP.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const ORIGIN='https://www.omg.org';
export const CATALOG=ORIGIN+'/spec/';
const POLICY=ORIGIN+'/legal/';
const LIMIT=8*1024*1024;
export const PILOT=Object.freeze([
  ORIGIN+'/spec/SysML/1.4/About-SysML.jsonld',
  ORIGIN+'/spec/C2MS/1.2/Beta1/About-C2MS.jsonld'
]);
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const stamp=()=>new Date().toISOString();
const delay=ms=>new Promise(r=>setTimeout(r,ms));
import '../js/radar-standard-sources.js';
import {collectOmgCurrent} from './radar-omg-local-bridge.mjs';
const sharedOmg=globalThis.__radarStandardSources.omg;
export const {versionIdentity,metadataIdentity,allowedUrl,parseOmgCatalog}=sharedOmg;
export function authorize(rights,urls){
  if(!rights||rights.schemaVersion!==1||rights.sourceId!=='omg'||!['written-permission','specific-license','personal-noncommercial-single-copy'].includes(rights.basis)||rights.allowAcquisition!==true||rights.allowPrivateRetention!==true||typeof rights.reference!=='string'||!rights.reference.trim()||typeof rights.purpose!=='string'||!rights.purpose.trim()||!Array.isArray(rights.urls))throw Error('Documented acquisition and retention basis required');
  if(rights.basis==='personal-noncommercial-single-copy'&&rights.purpose!=='personal-noncommercial')throw Error('Personal copy basis is not applicable to project/commercial use');
  const allowed=new Set(rights.urls.map(allowedUrl));for(const url of urls)if(!allowed.has(allowedUrl(url)))throw Error('URL outside documented scope: '+url);
  return {basis:rights.basis,reference:rights.reference,purpose:rights.purpose,policyUrl:POLICY,redistribution:'not-authorized-by-this-tool'};
}

// JSON-LD discovery intentionally inventories syntax without expanding unknown contexts.
// A source vocabulary mapping will be based on observed raw responses, not guessed keys.
export function inspectJsonLd(raw,url){
  const identity=metadataIdentity(url);if(!raw||typeof raw!=='object'||(!Array.isArray(raw)&&!Object.keys(raw).length))throw Error('Invalid JSON-LD document');
  const keys=new Map(),contexts=new Set(),types=new Set();let count=0,hasLD=false;
  function visit(x,depth=0){if(depth>64||++count>100000)throw Error('JSON-LD structure exceeds limit');if(!x||typeof x!=='object')return;if(Array.isArray(x)){x.forEach(v=>visit(v,depth+1));return;}
    for(const [k,v] of Object.entries(x)){if(k.length>1000)throw Error('Oversized JSON-LD key');keys.set(k,(keys.get(k)||0)+1);if(k.startsWith('@'))hasLD=true;
      if(k==='@context'){for(const c of Array.isArray(v)?v:[v])if(typeof c==='string')contexts.add(c.slice(0,1000));continue;}
      if(k==='@type'){for(const t of Array.isArray(v)?v:[v])if(typeof t==='string')types.add(t.slice(0,1000));}
      visit(v,depth+1);
    }
  }
  visit(raw);if(!hasLD)throw Error('Response has no JSON-LD keywords');
  return {identity,syntax:{topLevel:Array.isArray(raw)?'array':'object',keys:[...keys].sort((a,b)=>a[0].localeCompare(b[0])).map(([key,count])=>({key,count})),contexts:[...contexts],types:[...types],expanded:false},mapping:'pending-observed-vocabulary',distribution:'private-only'};
}
async function readBounded(fetcher,url){
  const r=await fetcher(url,{redirect:'error',credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(30000),headers:{Accept:url===CATALOG?'text/html':'application/ld+json, application/json','User-Agent':'StandardizationRadarChart-DocumentaryResearch/1.0'}});
  if(!r.ok)throw Error('HTTP '+r.status+' '+url);if(r.url&&r.url!==url)throw Error('Unexpected redirect');
  const ct=r.headers.get('content-type')||'';if(url===CATALOG?!/^text\/html\b/i.test(ct):!/^application\/(?:ld\+json|json)\b/i.test(ct))throw Error('Unexpected content type: '+ct);
  if(Number(r.headers.get('content-length'))>LIMIT)throw Error('Response exceeds size limit');
  const chunks=[];let n=0;for await(const chunk of r.body){n+=chunk.byteLength;if(n>LIMIT)throw Error('Response exceeds size limit');chunks.push(Buffer.from(chunk));}return Buffer.concat(chunks,n);
}
export async function acquireOmg({urls,rights,outputParent,fetcher=fetch,wait=delay}){
  const unique=[...new Set(urls.map(allowedUrl))];if(!unique.length||unique.length>50||unique.length!==urls.length)throw Error('Explicit 1–50 distinct URLs required');
  const authorization=authorize(rights,unique); // before all I/O
  const parent=await fs.realpath(outputParent);const root=await fs.realpath(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'));
  if(parent===root||parent.startsWith(root+path.sep))throw Error('Private output must be outside repository');
  const directory=await fs.mkdtemp(path.join(parent,'S16-OMG-'));await fs.chmod(directory,0o700);
  const report={operation:'S16-OMG-DOCUMENTARY-ACQUISITION',schemaVersion:1,startedAt:stamp(),directory,authorization,records:[],errors:[],ok:false,redistribution:false};
  try{
    for(const [i,url] of unique.entries()){
      if(i)await wait(2000); // no concurrency, no retries
      const raw=await readBounded(fetcher,url),acquiredAt=stamp(),digest=sha(raw),body=new TextDecoder('utf-8',{fatal:true}).decode(raw);
      const entry={url,acquiredAt,sha256:digest,bytes:raw.length};
      // Retain one private raw copy; no copy into repository, Git Pages or Viewer.
      const filename=url===CATALOG?'catalog.html':metadataIdentity(url).sourceKey.replaceAll('/','-')+'.jsonld';
      await fs.writeFile(path.join(directory,filename),raw,{mode:0o600,flag:'wx'});entry.file=filename;
      try{
        if(url===CATALOG){const index=parseOmgCatalog(body,{acquiredAt,sourceDigest:digest});const file='catalog-normalized.json';await fs.writeFile(path.join(directory,file),JSON.stringify(index,null,2)+'\n',{mode:0o600,flag:'wx'});entry.result={file,count:index.records.length,adoptions:index.isoAdoptions.length,coverage:index.coverage};}
        else entry.result=inspectJsonLd(JSON.parse(body),url);
      }catch(e){entry.error=e.message;report.records.push(entry);throw e;}
      report.records.push(entry);
    }
    report.ok=report.records.every(r=>!r.error&&r.result?.coverage?.complete!==false);
    if(!report.ok)report.errors.push('Catalog coverage incomplete: inspect rejected rows');
  }catch(e){report.errors.push(e.message);}
  finally{report.finishedAt=stamp();await fs.writeFile(path.join(directory,'report.json'),JSON.stringify(report,null,2)+'\n',{mode:0o600,flag:'wx'});}
  return report;
}
// Prepare an importable corpus from an already-held HTML copy, with no network.
export async function prepareOmgCatalog({input,outputParent}){
  const parent=await fs.realpath(outputParent),root=await fs.realpath(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'));
  if(parent===root||parent.startsWith(root+path.sep))throw Error('Private output must be outside repository');
  const stat=await fs.stat(input);if(!stat.isFile()||stat.size>LIMIT)throw Error('Invalid catalog input');
  const raw=await fs.readFile(input);if(raw.length>LIMIT)throw Error('Input exceeds size limit');
  const index=parseOmgCatalog(new TextDecoder('utf-8',{fatal:true}).decode(raw),{acquiredAt:null,sourceDigest:sha(raw)});
  const directory=await fs.mkdtemp(path.join(parent,'S16-OMG-Corpus-'));await fs.chmod(directory,0o700);
  const file=path.join(directory,'omg-catalog.json');await fs.writeFile(file,JSON.stringify(index,null,2)+'\n',{mode:0o600,flag:'wx'});
  const report={operation:'S16-OMG-CORPUS-PREPARATION',ok:index.coverage.complete,network:false,directory,file,records:index.records.length,adoptions:index.isoAdoptions.length,coverage:index.coverage,sourceDigest:sha(raw),origin:'local-unverified',distribution:'private-only'};
  await fs.writeFile(path.join(directory,'report.json'),JSON.stringify(report,null,2)+'\n',{mode:0o600,flag:'wx'});return report;
}
async function main(){
  const args=process.argv.slice(2);let report;
  try{
    if(args.length===1&&args[0]==='--plan'){report={operation:'S16-OMG-PLAN',ok:true,catalog:CATALOG,pilot:PILOT,policy:POLICY,network:false,rightsRequired:true,publicIndex:{command:'--collect-public-index --out <private-directory>',scope:'single public catalog; private bibliographic facts only',formRequired:false}};}
    else if(args[0]==='--collect-public-index'&&args[1]==='--out'&&args.length===3){const {snapshot,current,auditFile}=await collectOmgCurrent({outputParent:args[2]});report={operation:'S16-OMG-PUBLIC-CATALOG-COLLECTION',ok:true,network:true,sourceUrl:CATALOG,acquiredAt:snapshot.provenance.acquiredAt,sourceDigest:snapshot.provenance.sha256,records:snapshot.records.length,adoptions:snapshot.isoAdoptions.length,coverage:snapshot.coverage,current,file:auditFile,distribution:'private-only',redistributionAuthorized:false};}
    else if(args[0]==='--prepare-catalog'&&args[2]==='--out'&&args.length===4){report=await prepareOmgCatalog({input:args[1],outputParent:args[3]});}
    else if(args[0]==='--inspect-catalog'&&args.length===2){const stat=await fs.stat(args[1]);if(stat.size>LIMIT)throw Error('Input exceeds size limit');const data=await fs.readFile(args[1]);const index=parseOmgCatalog(new TextDecoder('utf-8',{fatal:true}).decode(data),{acquiredAt:null,sourceDigest:sha(data)});report={operation:'S16-OMG-CATALOG-INSPECTION',ok:index.coverage.complete,network:false,records:index.records.length,adoptions:index.isoAdoptions.length,coverage:index.coverage,sourceDigest:sha(data),note:'Local input, origin not independently verified; no new output copy'};}
    else if(args[0]==='--inspect-jsonld'&&args.length===3){const stat=await fs.stat(args[2]);if(stat.size>LIMIT)throw Error('Input exceeds size limit');const data=await fs.readFile(args[2]);report={operation:'S16-OMG-JSONLD-INSPECTION',ok:true,network:false,sha256:sha(data),...inspectJsonLd(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(data)),args[1])};}
    else if(args[0]==='--acquire'&&args[1]==='--rights'&&args[3]==='--out'&&args.length>=6){const rights=JSON.parse(await fs.readFile(args[2],'utf8'));const urls=args.slice(5).flatMap(x=>x==='--catalog'?[CATALOG]:x==='--pilot'?PILOT:[x]);report=await acquireOmg({urls,rights,outputParent:args[4]});}
    else throw Error('Usage: --plan | --collect-public-index --out <private-directory> | --prepare-catalog <html> --out <private-directory> | --inspect-catalog <html> | --inspect-jsonld <official-url> <file> | --acquire --rights <json> --out <existing-private-directory> [--catalog|--pilot|URL...]');
  }catch(e){report={operation:'S16-OMG-DOCUMENTARY-ACQUISITION',ok:false,errors:[e.message]};}
  console.log(JSON.stringify(report,null,2));if(!report.ok)process.exitCode=1;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();
