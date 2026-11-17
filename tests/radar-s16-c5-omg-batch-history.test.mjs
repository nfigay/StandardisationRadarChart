import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync,readdirSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {sourceApi} from '../tools/prepare-omg-public-links.mjs';
import {collectBatch,discoverFamilies,parseOptions} from '../tools/collect-omg-family-histories.mjs';
const api=sourceApi(readFileSync(new URL('../js/radar-standard-sources.js',import.meta.url),'utf8'));
const acquiredAt='2026-11-17T07:48:15.731Z';
function row(family,version){return {sourceId:'omg-specifications',sourceKey:`${family}/${version}`,acronym:family,version,variant:null,url:`https://www.omg.org/spec/${family}/${version}`,title:`${family} specification`,designation:family,edition:version,status:'formal',publicationDate:'2024-02'};}
function catalog(){const rows=[row('UML','2.5.1'),row('FUML','1.5'),row('UML','2.4.1')];return {schemaVersion:1,sourceId:'omg-specifications',distribution:'private-only',provenance:{url:api.omg.CATALOG,acquiredAt,sha256:'f'.repeat(64)},coverage:{complete:true,indexTables:2,adoptionTables:1,rejected:[],tables:[{kind:'index',rows:1,accepted:1,declaredTotal:1},{kind:'index',rows:3,accepted:3,declaredTotal:3},{kind:'adoptions',rows:1,accepted:1,declaredTotal:1}]},records:rows,isoAdoptions:[{subject:{sourceId:'omg-specifications',sourceKey:'UML/2.5.1',acronym:'UML',version:'2.5.1',variant:null,url:'https://www.omg.org/spec/UML/2.5.1'},title:'UML specification',relationType:'omg-reports-iso-adoption',isoDesignations:['19505:2012'],omgFileIds:[]}]};}
function html(family,versions){return `<html><table><tr><th>Version</th><th>Adoption Date</th><th>URL</th></tr>${versions.map(v=>`<tr><td>${v}</td><td>July 2011</td><td><a href="https://www.omg.org/spec/${family}/${v}">link</a></td></tr>`).join('')}</table></html>`;}
function reply(url,body,status=200){return {ok:status===200,status,url,headers:{get:()=> 'text/html; charset=utf-8'},text:async()=>body};}
function dir(){return mkdtempSync(join(tmpdir(),'s16-c5-test-'));}
test('C5 derives distinct family identities from verified official catalogue',()=>{
 assert.deepEqual(discoverFamilies(catalog(),api),['FUML','UML']);
 assert.throws(()=>discoverFamilies({...catalog(),coverage:{complete:false}},api));
});
test('C5 retains multiple versions by family without overwriting older identity',async()=>{
 const base=dir(),out=join(base,'private');
 try{const seen=[];const report=await collectBatch({api,snapshot:catalog(),families:['UML','FUML'],out,fetcher:async u=>{seen.push(u);return reply(u,u.endsWith('/UML/')?html('UML',['2.5.1','2.4.1','1.4']):html('FUML',['1.5','1.4']));},sleep:async()=>{},now:()=>acquiredAt});
 assert.equal(report.verifiedEditions,5);assert.equal(report.verifiedFamilies,2);assert.equal(report.publication,false);
 assert.deepEqual(seen,['https://www.omg.org/spec/UML/','https://www.omg.org/spec/FUML/']);
 const snapshot=JSON.parse(readFileSync(join(out,'UML.json'),'utf8'));
 assert.deepEqual(snapshot.records.map(x=>x.sourceKey),['UML/2.5.1','UML/2.4.1','UML/1.4']);
 assert.equal(snapshot.distribution,'private-only');assert.equal(snapshot.coverage.complete,true);
 }finally{rmSync(base,{recursive:true,force:true});}
});
test('C5 never labels malformed or inaccessible family as no historical editions',async()=>{
 const base=dir(),out=join(base,'private');
 try{const report=await collectBatch({api,snapshot:catalog(),families:['UML','FUML'],out,fetcher:async u=>u.endsWith('/UML/')?reply(u,'<html>no table</html>'):reply(u,'',503),sleep:async()=>{}});
 assert.equal(report.verifiedFamilies,0);assert.equal(report.unresolvedFamilies,2);
 assert.ok(report.results.every(x=>x.state==='unresolved'));
 assert.deepEqual(readdirSync(out),['report.json']);
 }finally{rmSync(base,{recursive:true,force:true});}
});
test('C5 bounds discovery and rejects unindexed family, duplicate and destination overwrite',async()=>{
 const base=dir();try{
  await assert.rejects(collectBatch({api,snapshot:catalog(),families:['UML','UML'],out:join(base,'a')}),/Duplicate/);
  await assert.rejects(collectBatch({api,snapshot:catalog(),families:['BAD'],out:join(base,'a')}),/absent/);
  await assert.rejects(collectBatch({api,snapshot:catalog(),families:Array(21).fill('UML'),out:join(base,'a')}),/1\.\.20/);
  await assert.rejects(collectBatch({api,snapshot:catalog(),families:['UML'],out:base}),/already exists/);
 }finally{rmSync(base,{recursive:true,force:true});}
});
test('C5 fails closed on unapproved URL and leaves working tree untouched',async()=>{
 const base=dir();try{
  const out=join(base,'result');const result=await collectBatch({api,snapshot:catalog(),families:['UML'],out,fetcher:async u=>reply('https://untrusted.example/',html('UML',['1.4'])),sleep:async()=>{}});
  assert.equal(result.unresolvedFamilies,1);assert.equal(existsSync(join(out,'UML.json')),false);
  assert.match(result.results[0].reason,/redirect/);
 }finally{rmSync(base,{recursive:true,force:true});}
});
test('C5 CLI requires explicit bounded families and never defaults to a bulk crawl',()=>{
 assert.throws(()=>parseOptions([]),/Usage/);
 assert.deepEqual(parseOptions(['--catalog','a','--family','UML','--family','FUML','--out','b']).families,['UML','FUML']);
});
