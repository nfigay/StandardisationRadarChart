import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,writeFileSync,mkdirSync,existsSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {sourceApi} from '../tools/prepare-omg-public-links.mjs';
import {diagnoseHistory} from '../tools/collect-omg-family-histories.mjs';
import {unresolvedFromCoverage,retryUnresolved,parseRetryOptions} from '../tools/retry-omg-unresolved.mjs';
const api=sourceApi(readFileSync(new URL('../js/radar-standard-sources.js',import.meta.url),'utf8'));
const header='<tr><th>Version</th><th>Adoption Date</th><th>URL</th></tr>';
const row=(v,url)=>`<tr><td>${v}</td><td>March 2025</td><td><a href="https://www.omg.org/spec/${url}">link</a></td></tr>`;
const t=(type,rows)=>`<h3>${type} Versions</h3><table>${header}${rows}</table>`;
const formal=(f,v)=>t('Formal',row(v,`${f}/${v}`));
const inproc=(v,url)=>t('In Process',row(v,url));
const valid=(html,f)=>diagnoseHistory(html,f,api,{acquiredAt:'2026-11-17T14:40:31.024Z',sourceDigest:'a'.repeat(64)});
test('C5-R2 preserves canonical Beta2 identity when printed as beta 2',()=>{
 const r=valid(inproc('1.0 beta 2','DPROD/1.0/Beta2'),'DPROD');
 assert.equal(r.state,'in-process-only');assert.equal(r.inProcess[0].sourceKey,'DPROD/1.0/Beta2');assert.equal(r.rejected.length,0);
});
test('C5-R2 recognizes alpha 0 as preliminary, never formal',()=>{
 const r=valid(inproc('1.2 alpha 0','TOIF/1.2/Alpha0')+formal('TOIF','1.3'),'TOIF');
 assert.equal(r.state,'verified');assert.equal(r.inProcess[0].sourceKey,'TOIF/1.2/Alpha0');assert.equal(r.formal.records.length,1);
 assert.equal(api.omg.versionIdentity('https://www.omg.org/spec/TOIF/1.2/Alpha0').variant,'Alpha0');
});
test('C5-R2 does not accept incorrect ordinal or foreign host',()=>{
 const x=valid(inproc('1.0 beta 3','DPROD/1.0/Beta2'),'DPROD');assert.equal(x.state,'unresolved');
 assert.match(x.rejected[0].reason,/disagree/);
 assert.throws(()=>api.omg.versionIdentity('https://example.com/spec/DPROD/1.0/Beta2'));
});
test('C5-R2 formal UTP2 lineage is explicit and unresolved, not silently UTP2',()=>{
 const h=t('Formal',row('2.2','UTP2/2.2')+row('2.1','UTP2/2.1')+row('2.0','UTP2/2.0')+row('1.2','UTP/1.2')+row('1.1','UTP/1.1')+row('1.0','UTP/1.0'));
 const r=valid(h,'UTP2');assert.equal(r.state,'unresolved');
 assert.equal(r.rejected[0].category,'formal');assert.equal(r.rejected[0].rows.length,3);
 assert.ok(r.rejected[0].rows.every(x=>/Different OMG family: UTP/.test(x.reason)));
});
test('C5-R2 transient HTTP 525 is retryable but stays unresolved',async()=>{
 const {collectBatch}=await import('../tools/collect-omg-family-histories.mjs');
 const base=mkdtempSync(join(tmpdir(),'c5r2-http-'));
 try{
  const record={sourceId:'omg-specifications',sourceKey:'TOIF/1.3',acronym:'TOIF',version:'1.3',variant:null,url:'https://www.omg.org/spec/TOIF/1.3',title:'TOIF',designation:'TOIF',edition:'1.3',status:'formal',publicationDate:'2024-02'};
  const snapshot={schemaVersion:1,sourceId:'omg-specifications',distribution:'private-only',provenance:{url:api.omg.CATALOG,acquiredAt:'2026-11-17T07:44:03.981Z',sha256:'f'.repeat(64)},coverage:{complete:true,indexTables:2,adoptionTables:1,rejected:[],tables:[{kind:'index',rows:1,accepted:1,declaredTotal:1},{kind:'index',rows:1,accepted:1,declaredTotal:1},{kind:'adoptions',rows:1,accepted:1,declaredTotal:1}]},records:[record],isoAdoptions:[{subject:{sourceId:'omg-specifications',sourceKey:'TOIF/1.3',acronym:'TOIF',version:'1.3',variant:null,url:'https://www.omg.org/spec/TOIF/1.3'},title:'TOIF',relationType:'omg-reports-iso-adoption',isoDesignations:['19505:2012'],omgFileIds:[]}]};
  const r=await collectBatch({api,snapshot,families:['TOIF'],out:join(base,'result'),fetcher:async url=>({ok:false,status:525,url}),sleep:async()=>{}});
  assert.equal(r.unresolvedFamilies,1);assert.equal(r.results[0].retryable,true);
 }finally{rmSync(base,{recursive:true,force:true});}
});
test('C5-R2 retry options require a new output directory and explicit source',()=>{
 assert.throws(()=>parseRetryOptions(['--out','a']),/Usage/);
 assert.deepEqual(parseRetryOptions(['--catalog','a','--coverage','b','--out','c','--family','TOIF']).families,['TOIF']);
});
