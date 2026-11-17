#!/usr/bin/env node
// S16 C5-R1: controlled OMG history classification and resumable acquisition.
// All files are private audit files. No Git operations or publication.
import {readFileSync,writeFileSync,mkdirSync,existsSync,renameSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {sourceApi} from './prepare-omg-public-links.mjs';

const sha=x=>createHash('sha256').update(x).digest('hex');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const monthNames=['January','February','March','April','May','June','July','August','September','October','November','December'];
const clean=s=>String(s||'').replace(/<[^>]*>/g,' ').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/\s+/g,' ').trim();
const htmlLinks=s=>[...s.matchAll(/<a\b[^>]*\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))[^>]*>/gi)].map(m=>m[1]??m[2]??m[3]);
const month=s=>{const m=/^([A-Za-z]+)\s+(\d{4})$/.exec(s);const i=m?monthNames.indexOf(m[1]):-1;return i<0?null:m[2]+'-'+String(i+1).padStart(2,'0');};
const tableRows=t=>[...t.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr\s*>/gi)].map(m=>[...m[1].matchAll(/<(td|th)\b[^>]*>([\s\S]*?)<\/\1\s*>/gi)].map(x=>({text:clean(x[2]),raw:x[2],kind:x[1].toLowerCase()})));
function historyTables(html){
 const safe=html.replace(/<!--[\s\S]*?-->/g,'').replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,'');
 const result=[];
 for(const m of safe.matchAll(/<table\b[^>]*>[\s\S]*?<\/table\s*>/gi)){
  const rows=tableRows(m[0]);
  if(!rows.some(r=>r.map(c=>c.text.toLowerCase()).join('|')==='version|adoption date|url'))continue;
  // Classify from the closest preceding section heading, not arbitrary text in the page.
  const prefix=safe.slice(Math.max(0,m.index-4000),m.index);
  const headings=[...prefix.matchAll(/<h([2-6])\b[^>]*>([\s\S]*?)<\/h\1\s*>/gi)];
  const nearest=headings.length?clean(headings.at(-1)[2]).toLowerCase():'';
  const kind=nearest==='formal versions'?'formal':nearest==='in process versions'?'in-process':'unknown';
  result.push({kind,heading:nearest,html:m[0],rows});
 }
 return result;
}
function diagnoseFormalRows(table,family,api){
 const header=table.rows.findIndex(r=>r.map(c=>c.text.toLowerCase()).join('|')==='version|adoption date|url');
 const issues=[];
 for(const [i,r] of table.rows.slice(header+1).entries()){
  if(r.length===0||r.every(c=>!c.text))continue;
  const version=r[0]?.text||null,link=htmlLinks(r[2]?.raw||'')[0]||null;
  try{
   if(r.length!==3||!link)throw Error('Invalid formal history row');
   const id=api.omg.versionIdentity(link);
   if(id.acronym!==family)throw Error('Different OMG family: '+id.acronym+' (cross-family historical lineage; manual review required)');
   if(id.variant||id.version!==version)throw Error('Formal version and official link disagree');
   if(!month(r[1]?.text))throw Error('Invalid adoption date');
  }catch(e){issues.push({row:i+1,version,link,reason:e.message});}
 }
 return {rows:issues};
}
export function diagnoseHistory(html,family,api,{acquiredAt=new Date().toISOString(),sourceDigest=null}={}){
 api.omg.familyUrl(family);
 if(typeof html!=='string'||!html||new TextEncoder().encode(html).byteLength>api.omg.LIMIT)throw Error('Invalid page size');
 const tables=historyTables(html),rejected=[],inProcess=[],keys=new Set();
 // Backwards compatibility with the formal-only C5 fixture (one unlabelled table).
 if(tables.length===1&&tables[0].kind==='unknown'&&!/<h[2-6]\b/i.test(html))tables[0].kind='formal';
 const formalTables=tables.filter(t=>t.kind==='formal');
 const otherTables=tables.filter(t=>t.kind==='in-process');
 const unknown=tables.filter(t=>t.kind==='unknown');
 for(const t of unknown)rejected.push({category:'unknown-table',reason:'Unclassified OMG history table',heading:t.heading});
 for(const t of otherTables){
  const h=t.rows.findIndex(r=>r.map(c=>c.text.toLowerCase()).join('|')==='version|adoption date|url');
  for(const [idx,r] of t.rows.slice(h+1).entries()){
   if(r.length===0||r.every(c=>!c.text))continue;
   const item={category:'in-process',row:idx+1,version:r[0]?.text||null};
   try{
    if(r.length!==3)throw Error('Unexpected history column count');
    const links=htmlLinks(r[2].raw);if(links.length!==1)throw Error('Missing or ambiguous history link');
    const id=api.omg.versionIdentity(links[0]);
    if(id.acronym!==family)throw Error('Wrong OMG family');
    if(!id.variant||! /^(?:Beta[1-9]\d{0,2}|Alpha(?:0|[1-9]\d{0,2}))$/.test(id.variant))throw Error('Not a canonical OMG preliminary variant');
    const kind=id.variant.startsWith('Beta')?'beta':'alpha';
    const ordinal=id.variant.slice(kind.length===4?4:5);
    const expected=new Set([`${id.version} ${kind}`,`${id.version} ${kind} ${ordinal}`,`${id.version} ${kind}${ordinal}`]);
    if(!expected.has(r[0].text.toLowerCase().replace(/\s+/g,' ').trim()) ||
       (ordinal!=='1'&&r[0].text.toLowerCase().replace(/\s+/g,' ').trim()===`${id.version} ${kind}`))
      throw Error('Version text and official link disagree');
    const date=month(r[1].text);if(!date)throw Error('Invalid adoption date');
    if(keys.has(id.sourceKey))throw Error('Duplicate in-process identity');keys.add(id.sourceKey);
    inProcess.push({...id,publicationDate:date,documentStatus:'in-process',historyEvidence:api.omg.familyUrl(family)});
   }catch(e){rejected.push({...item,reason:e.message,link:htmlLinks(r[2]?.raw||'')[0]||null});}
  }
 }
 let formal=null;
 if(formalTables.length===1){
  // Existing pure formal validator remains authoritative; beta tables never enter it.
  try{formal=api.omg.parseOmgHistory(formalTables[0].html,family,{acquiredAt,sourceDigest});
      api.validateOmgHistory(formal,family);
  }catch(e){rejected.push({category:'formal',reason:e.message,...diagnoseFormalRows(formalTables[0],family,api)});}
 }else if(formalTables.length>1){rejected.push({category:'formal',reason:'Multiple formal-version tables'});}
 if(!tables.length)rejected.push({category:'history',reason:'No recognized history table'});
 const complete=rejected.length===0&&(formal!==null||inProcess.length>0);
 const state=!complete?'unresolved':formal?'verified':'in-process-only';
 return {state,formal,inProcess,rejected,coverage:{formalVersions:formal?.records.length??0,inProcessVersions:inProcess.length,formalTables:formalTables.length,inProcessTables:otherTables.length,unknownTables:unknown.length,complete},provenance:{url:api.omg.familyUrl(family),acquiredAt,sha256:sourceDigest}};
}
function familyFromCatalogUrl(url,api){return api.omg.versionIdentity(url).acronym;}
export function discoverFamilies(snapshot,api){
 assert.equal(snapshot.schemaVersion,1);assert.equal(snapshot.sourceId,'omg-specifications');
 assert.equal(snapshot.distribution,'private-only');assert.equal(snapshot.coverage?.complete,true);
 const checked=api.validateOmgOnlineSnapshot(snapshot);
 return [...new Set(checked.rows.map(r=>familyFromCatalogUrl(r.url,api)))].sort((a,b)=>a.localeCompare(b,'en'));
}
const safeName=family=>family.replaceAll('/','__');
export async function collectBatch({api,snapshot,families,out,fetcher=fetch,delayMs=500,timeoutMs=20000,now=()=>new Date().toISOString(),sleep=wait}){
 const available=new Set(discoverFamilies(snapshot,api));
 assert.ok(Array.isArray(families)&&families.length>=1&&families.length<=20,'Choose 1..20 families per batch');
 assert.equal(new Set(families).size,families.length,'Duplicate families');
 assert.ok(Number.isInteger(delayMs)&&delayMs>=250&&delayMs<=10000);
 assert.ok(Number.isInteger(timeoutMs)&&timeoutMs>=1000&&timeoutMs<=60000);
 if(existsSync(out))throw Error('Output already exists: '+out);
 for(const f of families){api.omg.familyUrl(f);assert.ok(available.has(f),'Family absent from verified catalog: '+f);}
 mkdirSync(out,{recursive:false});const results=[];
 for(let i=0;i<families.length;i++){
  const family=families[i],url=api.omg.familyUrl(family),record={family,url,state:'unresolved'};
  try{
   const res=await fetcher(url,{method:'GET',redirect:'error',credentials:'omit',signal:AbortSignal.timeout(timeoutMs),headers:{accept:'text/html'}});
   if(!res.ok)throw Error('HTTP '+res.status);
   if(res.url&&res.url!==url)throw Error('Unexpected redirect');
   if(!/^text\/html(?:;|$)/i.test(res.headers?.get('content-type')||''))throw Error('Unexpected media type');
   const body=await res.text();const sourceDigest=sha(body);
   const analysis=diagnoseHistory(body,family,api,{acquiredAt:now(),sourceDigest});
   Object.assign(record,{state:analysis.state,versions:analysis.coverage.formalVersions,inProcessVersions:analysis.coverage.inProcessVersions,sourceSha256:sourceDigest,diagnostics:analysis.rejected});
   if(analysis.state==='verified'||analysis.state==='in-process-only'){
    if(analysis.formal){const file=safeName(family)+'.json';writeFileSync(join(out,file),JSON.stringify(analysis.formal,null,2)+'\n',{flag:'wx'});record.file=file;}
    if(analysis.inProcess.length){const file=safeName(family)+'.in-process.json';writeFileSync(join(out,file),JSON.stringify({schemaVersion:1,sourceId:'omg-in-process-history',family,distribution:'private-only',provenance:analysis.provenance,coverage:{complete:true,versions:analysis.inProcess.length},records:analysis.inProcess},null,2)+'\n',{flag:'wx'});record.inProcessFile=file;}
   }else record.reason=analysis.rejected.map(x=>x.reason).join('; ').slice(0,240);
  }catch(e){record.reason=String(e.message||e).slice(0,240);record.diagnostics=[{category:'acquisition',reason:record.reason,retryable:/^HTTP (?:408|425|429|5\d\d)$|(?:timeout|fetch failed|network)/i.test(record.reason)}];record.retryable=record.diagnostics[0].retryable;}
  results.push(record);if(i+1<families.length)await sleep(delayMs);
 }
 const verified=results.filter(r=>r.state==='verified');
 const report={operation:'S16-C5-R1-OMG-HISTORY-COVERAGE',source:'official-family-pages',sourceCatalogSha256:snapshot.provenance.sha256,sourceCatalogDate:snapshot.provenance.acquiredAt,selectedFamilies:families.length,verifiedFamilies:verified.length,inProcessOnlyFamilies:results.filter(r=>r.state==='in-process-only').length,unresolvedFamilies:results.filter(r=>r.state==='unresolved').length,verifiedEditions:results.reduce((n,r)=>n+(r.versions||0),0),inProcessVersions:results.reduce((n,r)=>n+(r.inProcessVersions||0),0),publication:false,results};
 writeFileSync(join(out,'report.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});return report;
}
export async function runCoverage({api,snapshot,out,fetcher=fetch,delayMs=500,sleep=wait,limit=20,stopAfterBatches=Infinity}){
 if(!Number.isInteger(limit)||limit<1||limit>20)throw Error('Invalid batch limit');
 if(!Number.isInteger(stopAfterBatches)&&stopAfterBatches!==Infinity)throw Error('Invalid stop limit');
 const families=discoverFamilies(snapshot,api),fingerprint=sha(JSON.stringify(snapshot));
 const metadata={schemaVersion:1,operation:'S16-C5-R1-COVERAGE-CHECKPOINT',catalogSha256:fingerprint,families,limit};
 mkdirSync(out,{recursive:true});const checkpoint=join(out,'checkpoint.json');
 if(existsSync(checkpoint)){
  const prev=JSON.parse(readFileSync(checkpoint,'utf8'));
  assert.deepEqual(prev,metadata,'Checkpoint does not match catalog or batch size');
 }else{
  if(existsSync(join(out,'batch-0001')))throw Error('Orphan batch without checkpoint');
  writeFileSync(checkpoint,JSON.stringify(metadata,null,2)+'\n',{flag:'wx'});
 }
 const batches=[];
 for(let i=0;i<families.length;i+=limit){
  const index=Math.floor(i/limit)+1,name='batch-'+String(index).padStart(4,'0'),path=join(out,name);
  const expected=families.slice(i,i+limit);
  if(existsSync(path)){
   const reportFile=join(path,'report.json');if(!existsSync(reportFile))throw Error('Incomplete checkpoint batch: '+name);
   const report=JSON.parse(readFileSync(reportFile,'utf8'));
   assert.deepEqual(report.results.map(x=>x.family),expected,'Checkpoint batch families changed');
   batches.push(report);continue;
  }
  if(batches.filter(r=>r._created).length>=stopAfterBatches)break;
  const tmp=join(out,name+'.pending');if(existsSync(tmp))throw Error('Incomplete pending batch: '+tmp);
  const report=await collectBatch({api,snapshot,families:expected,out:tmp,fetcher,delayMs,sleep});
  renameSync(tmp,path);report._created=true;batches.push(report);
 }
 const rows=batches.flatMap(b=>b.results),coverage={operation:'S16-C5-R1-COVERAGE-REPORT',catalogFamilies:families.length,processedFamilies:rows.length,verifiedFamilies:rows.filter(r=>r.state==='verified').length,inProcessOnlyFamilies:rows.filter(r=>r.state==='in-process-only').length,unresolvedFamilies:rows.filter(r=>r.state==='unresolved').length,verifiedEditions:rows.reduce((n,r)=>n+(r.versions||0),0),inProcessVersions:rows.reduce((n,r)=>n+(r.inProcessVersions||0),0),remainingFamilies:families.length-rows.length,publication:false,batches:batches.length};
 writeFileSync(join(out,'coverage.json'),JSON.stringify(coverage,null,2)+'\n');return coverage;
}
export function parseOptions(args){const opts={families:[]};for(let i=0;i<args.length;i++){const k=args[i];if(k==='--family')opts.families.push(args[++i]);else if(['--catalog','--out','--delay-ms','--limit','--stop-after-batches'].includes(k))opts[k.slice(2).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=args[++i];else if(k==='--all')opts.all=true;else throw Error('Unknown argument: '+k);}if(!opts.catalog||!opts.out||(!opts.all&&!opts.families.length)||opts.all&&opts.families.length)throw Error('Usage: --catalog <snapshot> --out <private dir> (--family UML ... | --all)');return opts;}
if(process.argv[1]&&resolve(process.argv[1])===resolve(new URL(import.meta.url).pathname)){
 try{const opts=parseOptions(process.argv.slice(2)),api=sourceApi(readFileSync('js/radar-standard-sources.js','utf8')),snapshot=JSON.parse(readFileSync(opts.catalog,'utf8'));if(opts.all){const report=await runCoverage({api,snapshot,out:resolve(opts.out),delayMs:opts.delayMs?Number(opts.delayMs):500,limit:opts.limit?Number(opts.limit):20,stopAfterBatches:opts.stopAfterBatches?Number(opts.stopAfterBatches):Infinity});console.log(JSON.stringify(report,null,2));}else{const report=await collectBatch({api,snapshot,families:opts.families,out:resolve(opts.out),delayMs:opts.delayMs?Number(opts.delayMs):500});console.log(JSON.stringify(report,null,2));if(report.unresolvedFamilies)process.exitCode=2;}}catch(e){console.error('S16-C5-R1 ERROR: '+e.message);process.exitCode=1;}
}
