#!/usr/bin/env node
// S16 C6: audited merge of private C5 histories into C4-compatible public identity links.
// Never republishes private snapshots, source HTML, descriptions or documents.
import {readFileSync,writeFileSync,mkdirSync,existsSync,rmSync,renameSync} from 'node:fs';
import {join,dirname,resolve,relative,isAbsolute} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {project,sourceApi} from './prepare-omg-public-links.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex');
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const json=x=>JSON.stringify(x,null,2)+'\n';
function safeFile(root,relativePath){
 const name=resolve(root,relativePath), rel=relative(root,name);
 if(!rel||rel.startsWith('..')||isAbsolute(rel))throw Error('Unsafe source file path');
 return name;
}
function historyPath(family){
 if(typeof family!=='string'||!family||/[\\%?#]/.test(family)||family.split('/').some(s=>!s||s==='.'||s==='..'))throw Error('Unsafe OMG family');
 return 'histories/'+family+'.json';
}
function familyReportRow(row,folder,api){
 assert.equal(typeof row.family,'string');api.omg.familyUrl(row.family);
 assert.ok(['verified','in-process-only','unresolved'].includes(row.state));
 const actual={...row,_folder:folder};
 if(row.file){assert.equal(row.state,'verified');actual._source=safeFile(folder,row.file);}
 if(row.inProcessFile)actual._inProcessSource=safeFile(folder,row.inProcessFile);
 return actual;
}
export function mergeCoverage({catalogFamilies,batches,retries=[]}){
 assert.ok(Array.isArray(catalogFamilies)&&new Set(catalogFamilies).size===catalogFamilies.length);
 const expected=new Set(catalogFamilies),rows=new Map();
 for(const batch of batches)for(const item of batch){
  assert.ok(expected.has(item.family),'Unknown catalog family');
  assert.ok(!rows.has(item.family),'Duplicate initial family: '+item.family);
  rows.set(item.family,item);
 }
 assert.equal(rows.size,catalogFamilies.length,'Incomplete initial coverage');
 for(const item of retries){
  assert.ok(rows.has(item.family),'Retry family missing from initial coverage');
  assert.equal(rows.get(item.family).state,'unresolved','Retry may only replace unresolved family');
  rows.set(item.family,item);
 }
 return catalogFamilies.map(f=>rows.get(f));
}
export function projectFamily(item,api){
 if(item.state!=='verified')return null;
 assert.ok(item._source,'Verified family without formal history file: '+item.family);
 const source=read(item._source);
 assert.equal(source.family,item.family,'Family mismatch');
 const payload=project(source,api,{family:item.family});
 assert.equal(payload.coverage.records,item.versions,'Edition count mismatch: '+item.family);
 // Keep C4 read contract unchanged: exact official links, dates, formal only.
 assert.equal(payload.sourceId,'omg-public-history-links');
 return payload;
}
export function buildManifest(rows,api,sourceCommit=null){
 return {
  schemaVersion:1,operation:'S16-C6-OMG-PUBLIC-HISTORY-COVERAGE',
  sourceId:'omg-history-coverage',distribution:'public-links-only',
  ...(sourceCommit?{sourceCommit}:{}),
  completeness:'examined-catalog-families-not-entire-OMG-universe',
  summary:{catalogFamilies:rows.length,verifiedFamilies:rows.filter(x=>x.state==='verified').length,inProcessOnlyFamilies:rows.filter(x=>x.state==='in-process-only').length,unresolvedFamilies:rows.filter(x=>x.state==='unresolved').length,formalEditions:rows.reduce((n,x)=>n+(x.state==='verified'?x.versions:0),0),inProcessVersions:rows.reduce((n,x)=>n+(x.inProcessVersions||0),0)},
  families:rows.map(x=>{
   const url=api.omg.familyUrl(x.family);
   return {family:x.family,url,state:x.state,formalVersions:x.state==='verified'?x.versions:0,inProcessVersions:x.inProcessVersions||0,historyAvailable:x.state==='verified',...(x.state==='unresolved'?{reasonCategory:x.diagnostics?.some(d=>d.category==='formal')?'documentary-cross-family-review':'unresolved-acquisition-or-validation'}:{})};
  })
 };
}
export function assemble({coverageDir,retryDir,publicIndex,sourceScript,out}){
 if(existsSync(out))throw Error('Output exists: '+out);
 const api=sourceApi(readFileSync(sourceScript,'utf8'));
 const checkpoint=read(join(coverageDir,'checkpoint.json'));
 const coverage=read(join(coverageDir,'coverage.json'));
 assert.equal(coverage.operation,'S16-C5-R1-COVERAGE-REPORT');
 assert.equal(coverage.remainingFamilies,0);
 assert.equal(coverage.processedFamilies,checkpoint.families.length);
 assert.equal(coverage.catalogFamilies,checkpoint.families.length);
 const batches=[];
 for(let i=1;i<=coverage.batches;i++){
  const folder=join(coverageDir,'batch-'+String(i).padStart(4,'0'));
  const data=read(join(folder,'report.json'));
  batches.push(data.results.map(row=>familyReportRow(row,folder,api)));
 }
 let retries=[];
 if(retryDir){
  const report=read(join(retryDir,'reconciliation.json'));
  assert.equal(report.operation,'S16-C5-R2-RETRY-RECONCILIATION');
  assert.equal(report.originalCoverageUnmodified,true);
  retries=report.results.map(row=>familyReportRow(row,retryDir,api));
 }
 const rows=mergeCoverage({catalogFamilies:checkpoint.families,batches,retries});
 const index=read(publicIndex);
 const validated=api.validateOmgPublicLinks(index);
 const indexFamilies=[...new Set(validated.rows.map(r=>r.acronym))].sort();
 assert.deepEqual(indexFamilies,[...checkpoint.families].sort(),'Public index and C5 checkpoint family sets differ');
 const formal=new Map();
 for(const row of rows){
  const item=projectFamily(row,api);
  if(item)formal.set(row.family,item);
 }
 const manifest=buildManifest(rows,api);
 assert.equal(formal.size,manifest.summary.verifiedFamilies);
 assert.equal([...formal.values()].reduce((n,p)=>n+p.records.length,0),manifest.summary.formalEditions);
 // All source and validation checks above precede the first destination write.
 mkdirSync(join(out,'histories'),{recursive:true});
 writeFileSync(join(out,'index.json'),json(index),{flag:'wx'});
 for(const [family,payload] of formal){const file=safeFile(out,historyPath(family));mkdirSync(dirname(file),{recursive:true});writeFileSync(file,json(payload),{flag:'wx'});}
 writeFileSync(join(out,'coverage.json'),json(manifest),{flag:'wx'});
 const files=[{path:'index.json',sha256:sha(json(index))},{path:'coverage.json',sha256:sha(json(manifest))},...Array.from(formal,([family,p])=>({path:historyPath(family),sha256:sha(json(p))}))];
 const review={operation:'S16-C6-PUBLIC-DISTRIBUTION-REVIEW',publication:false,sourceSnapshotsCopied:false,files:files.length,histories:formal.size,summary:manifest.summary,unresolved:manifest.families.filter(x=>x.state==='unresolved').map(x=>({family:x.family,url:x.url,reasonCategory:x.reasonCategory})),checksums:files};
 writeFileSync(join(dirname(out),'c6-review.json'),json(review),{flag:'wx'});
 return review;
}
function options(args){const o={};for(let i=0;i<args.length;i++){const a=args[i];if(!['--coverage','--retry','--index','--sources','--out'].includes(a)||!args[i+1])throw Error('Unknown/missing argument: '+a);o[a.slice(2)]=args[++i];}for(const k of ['coverage','index','sources','out'])if(!o[k])throw Error('Missing --'+k);return o;}
if(process.argv[1]&&resolve(process.argv[1])===resolve(new URL(import.meta.url).pathname)){
 try{const o=options(process.argv.slice(2));const result=assemble({coverageDir:resolve(o.coverage),retryDir:o.retry?resolve(o.retry):null,publicIndex:resolve(o.index),sourceScript:resolve(o.sources),out:resolve(o.out)});console.log(JSON.stringify({operation:result.operation,publication:false,histories:result.histories,summary:result.summary,unresolved:result.unresolved,reviewFile:join(dirname(resolve(o.out)),'c6-review.json')},null,2));}
 catch(e){console.error('S16 C6 ERROR: '+e.message);process.exitCode=1;}
}
