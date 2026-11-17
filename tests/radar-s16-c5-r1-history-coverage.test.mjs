import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync,readdirSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {sourceApi} from '../tools/prepare-omg-public-links.mjs';
import {collectBatch,discoverFamilies,diagnoseHistory,runCoverage,parseOptions} from '../tools/collect-omg-family-histories.mjs';
const api=sourceApi(readFileSync(new URL('../js/radar-standard-sources.js',import.meta.url),'utf8'));
const acquiredAt='2026-11-17T07:48:15.731Z';
const row=(family,version)=>({sourceId:'omg-specifications',sourceKey:`${family}/${version}`,acronym:family,version,variant:null,url:`https://www.omg.org/spec/${family}/${version}`,title:family,designation:family,edition:version,status:'formal',publicationDate:'2024-02'});
function catalog(){const rows=['ALMAS','BACM','BKPMN','UML'].map(f=>row(f,'1.0'));return {schemaVersion:1,sourceId:'omg-specifications',distribution:'private-only',provenance:{url:api.omg.CATALOG,acquiredAt,sha256:'f'.repeat(64)},coverage:{complete:true,indexTables:2,adoptionTables:1,rejected:[],tables:[{kind:"index",rows:1,accepted:1,declaredTotal:1},{kind:"index",rows:4,accepted:4,declaredTotal:4},{kind:"adoptions",rows:1,accepted:1,declaredTotal:1}]},records:rows,isoAdoptions:[{subject:{sourceId:'omg-specifications',sourceKey:'UML/1.0',acronym:'UML',version:'1.0',variant:null,url:'https://www.omg.org/spec/UML/1.0'},title:'UML',relationType:'omg-reports-iso-adoption',isoDesignations:['19505:2012'],omgFileIds:[]}]};}
function table(family,versions,beta=false){return `<table><tr><th>Version</th><th>Adoption Date</th><th>URL</th></tr>${versions.map(v=>`<tr><td>${v}${beta?' beta':''}</td><td>March 2025</td><td><a href="https://www.omg.org/spec/${family}/${v}${beta?'/Beta1':''}">link</a></td></tr>`).join('')}</table>`;}
const formal=(family,versions)=>`<h3>Formal Versions</h3>${table(family,versions)}`;
const inproc=(family,versions)=>`<h3>In Process Versions</h3>${table(family,versions,true)}`;
const reply=(url,body)=>({ok:true,status:200,url,headers:{get:()=> 'text/html; charset=utf-8'},text:async()=>body});
const dir=()=>mkdtempSync(join(tmpdir(),'s16-c5-r1-'));
test('C5-R1 separates formal editions and in-process beta variants',()=>{
 const r=diagnoseHistory(`<h2>History</h2>${inproc('BACM',['1.1'])}${formal('BACM',['1.0'])}`,'BACM',api,{acquiredAt,sourceDigest:'a'.repeat(64)});
 assert.equal(r.state,'verified');assert.equal(r.coverage.formalVersions,1);assert.equal(r.coverage.inProcessVersions,1);
 assert.equal(r.formal.records[0].sourceKey,'BACM/1.0');assert.equal(r.inProcess[0].sourceKey,'BACM/1.1/Beta1');
 assert.equal(r.inProcess[0].documentStatus,'in-process');assert.equal(r.rejected.length,0);
});
test('C5-R1 treats beta-only families as in-process-only, never as formal editions',()=>{
 const r=diagnoseHistory(inproc('BKPMN',['1.0']),'BKPMN',api,{acquiredAt,sourceDigest:'a'.repeat(64)});
 assert.equal(r.state,'in-process-only');assert.equal(r.formal,null);assert.equal(r.inProcess.length,1);
});
test('C5-R1 diagnostic retains invalid identity without inventing an edition',()=>{
 const r=diagnoseHistory(`<h3>Formal Versions</h3>${table('BACM',['1.0'])}${inproc('BACM',['2.0']).replace('BACM/2.0/Beta1','UML/2.0/Beta1')}`,'BACM',api,{acquiredAt,sourceDigest:'a'.repeat(64)});
 assert.equal(r.state,'unresolved');assert.equal(r.coverage.formalVersions,1);
 assert.equal(r.rejected[0].category,'in-process');assert.match(r.rejected[0].reason,/Wrong OMG family/);
});
test('C5-R1 writes separate private formal and beta snapshots, never publishes',async()=>{
 const base=dir();try{const report=await collectBatch({api,snapshot:catalog(),families:['BACM','BKPMN'],out:join(base,'out'),fetcher:async u=>reply(u,u.endsWith('BACM/')?inproc('BACM',['1.1'])+formal('BACM',['1.0']):inproc('BKPMN',['1.0'])),sleep:async()=>{},now:()=>acquiredAt});
 assert.equal(report.verifiedFamilies,1);assert.equal(report.inProcessOnlyFamilies,1);assert.equal(report.verifiedEditions,1);assert.equal(report.inProcessVersions,2);
 assert.ok(existsSync(join(base,'out','BACM.json')));assert.ok(existsSync(join(base,'out','BACM.in-process.json')));assert.ok(!existsSync(join(base,'out','BKPMN.json')));assert.equal(report.publication,false);
 }finally{rmSync(base,{recursive:true,force:true});}
});
test('C5-R1 resumable batches never refetch completed families',async()=>{
 const base=dir();try{let calls=[];const fetcher=async u=>{calls.push(u);return reply(u,formal(u.split('/').at(-2),['1.0']));};const out=join(base,'run');
 const a=await runCoverage({api,snapshot:catalog(),out,fetcher,sleep:async()=>{},limit:2,stopAfterBatches:1});assert.equal(a.processedFamilies,2);assert.equal(calls.length,2);
 const b=await runCoverage({api,snapshot:catalog(),out,fetcher,sleep:async()=>{},limit:2});assert.equal(b.processedFamilies,4);assert.equal(calls.length,4);
 const c=await runCoverage({api,snapshot:catalog(),out,fetcher,sleep:async()=>{},limit:2});assert.equal(c.processedFamilies,4);assert.equal(calls.length,4);
 }finally{rmSync(base,{recursive:true,force:true});}
});
test('C5-R1 rejects changed catalog and incomplete checkpoint',async()=>{
 const base=dir();try{const out=join(base,'run');await runCoverage({api,snapshot:catalog(),out,fetcher:async u=>reply(u,formal(u.split('/').at(-2),['1.0'])),sleep:async()=>{},limit:2,stopAfterBatches:1});
 await assert.rejects(runCoverage({api,snapshot:catalog(),out,limit:3}),/Checkpoint/);
 await assert.rejects(runCoverage({api,snapshot:{...catalog(),provenance:{...catalog().provenance,sha256:'a'.repeat(64)}},out,limit:2}),/Checkpoint/);
 }finally{rmSync(base,{recursive:true,force:true});}
});
test('C5-R1 CLI is explicit and bounded',()=>{
 assert.throws(()=>parseOptions(['--all']),/Usage/);
 assert.throws(()=>parseOptions(['--catalog','a','--out','b','--all','--family','UML']),/Usage/);
 assert.equal(parseOptions(['--catalog','a','--out','b','--all','--stop-after-batches','1']).all,true);
});
