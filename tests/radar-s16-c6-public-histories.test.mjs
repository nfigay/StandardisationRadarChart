import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync,mkdtempSync,readdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {mergeCoverage,buildManifest,assemble} from '../tools/assemble-omg-public-histories.mjs';
import {project,sourceApi} from '../tools/prepare-omg-public-links.mjs';
const api=sourceApi(readFileSync(resolve('js/radar-standard-sources.js'),'utf8'));
const historyFixture=()=>({
 schemaVersion:1,sourceId:'omg-formal-history',family:'UML',distribution:'private-only',
 provenance:{url:'https://www.omg.org/spec/UML/',acquiredAt:'2026-11-17T00:00:00.000Z',sha256:'0000000000000000000000000000000000000000000000000000000000000000'},
 coverage:{complete:true,formalVersions:2,historyTables:1},
 records:['2.4.1','2.5.1'].map((v,i)=>({
  ...api.omg.versionIdentity('https://www.omg.org/spec/UML/'+v),
  key:'UML/'+v,designation:'UML',edition:v,title:'UML '+v,status:'formal',
  publicationDate:i?'2017-12':'2011-08',issuer:'OMG',
  historyEvidence:'https://www.omg.org/spec/UML/',historyRelation:'formal-version-reported'
 }))
});
const j=x=>JSON.stringify(x,null,2)+'\n';
function setup(){
 const root=mkdtempSync(join(tmpdir(),'s16-c6-'));const coverage=join(root,'coverage'),retry=join(root,'retry'),out=join(root,'public');
 mkdirSync(join(coverage,'batch-0001'),{recursive:true});mkdirSync(retry);
 const families=['FUML','UML','UTP2'];
 const rows=[{family:'FUML',state:'in-process-only',versions:0,inProcessVersions:1,inProcessFile:'FUML.in-process.json'}, {family:'UML',state:'verified',versions:2,inProcessVersions:0,file:'UML.json'}, {family:'UTP2',state:'unresolved',reason:'Formal rows link to different family',diagnostics:[{category:'formal'}]}];
 const cp={schemaVersion:1,operation:'S16-C5-R1-COVERAGE-CHECKPOINT',families,limit:20,catalogSha256:'fixture'};
 const c={operation:'S16-C5-R1-COVERAGE-REPORT',catalogFamilies:3,processedFamilies:3,remainingFamilies:0,batches:1};
 writeFileSync(join(coverage,'checkpoint.json'),j(cp));writeFileSync(join(coverage,'coverage.json'),j(c));
 writeFileSync(join(coverage,'batch-0001','report.json'),j({results:rows}));
 writeFileSync(join(coverage,'batch-0001','UML.json'),j(historyFixture()));
 const index={schemaVersion:1,sourceId:'omg-public-links',distribution:'public-links-only',provenance:{url:'https://www.omg.org/spec/',acquiredAt:'2026-11-17T07:44:03.981Z'},coverage:{complete:true,records:3},records:[{url:'https://www.omg.org/spec/FUML/1.5',status:'formal',publicationDate:'2024-01'},{url:'https://www.omg.org/spec/UML/2.5.1',status:'formal',publicationDate:'2017-12'},{url:'https://www.omg.org/spec/UTP2/2.0',status:'formal',publicationDate:'2025-01'}]};
 writeFileSync(join(root,'index.json'),j(index));
 return {root,coverageDir:coverage,retryDir:null,out,rows,sourceScript:resolve('js/radar-standard-sources.js'),publicIndex:join(root,'index.json')};
}
test('C6: merge preserves current family identities and permits only unresolved replacements',()=>{
 const a=[{family:'UML',state:'verified',versions:11},{family:'UTP2',state:'unresolved'}];
 const merged=mergeCoverage({catalogFamilies:['UML','UTP2'],batches:[a],retries:[{family:'UTP2',state:'in-process-only',inProcessVersions:1}]});
 assert.equal(merged[0].versions,11);assert.equal(merged[1].state,'in-process-only');
 assert.throws(()=>mergeCoverage({catalogFamilies:['UML'],batches:[a]}),/Unknown catalog family/);
 assert.throws(()=>mergeCoverage({catalogFamilies:['UML','UTP2'],batches:[a],retries:[{family:'UML',state:'unresolved'}]}),/Retry may only replace unresolved/);
});
test('C6: coverage differentiates official formal vs only in-process vs unresolved',()=>{
 const manifest=buildManifest([{family:'UML',state:'verified',versions:11,inProcessVersions:0},{family:'FUML',state:'in-process-only',versions:0,inProcessVersions:1},{family:'UTP2',state:'unresolved',diagnostics:[{category:'formal'}]}],api);
 assert.deepEqual(manifest.summary,{catalogFamilies:3,verifiedFamilies:1,inProcessOnlyFamilies:1,unresolvedFamilies:1,formalEditions:11,inProcessVersions:1});
 assert.equal(manifest.families[2].historyAvailable,false);
 assert.equal(manifest.families[2].reasonCategory,'documentary-cross-family-review');
 assert.equal(manifest.families[1].formalVersions,0);
});
test('C6: output requires available valid sources, not legal approvals',()=>{
 const f=setup();const result=assemble(f);assert.equal(result.histories,1);
});
test('C6: produces C4-compatible formal history and coverage with private data excluded',()=>{
 const f=setup();const report=assemble({...f});
 assert.equal(report.histories,1);assert.equal(report.summary.formalEditions,2);
 const pub=JSON.parse(readFileSync(join(f.out,'histories','UML.json'),'utf8'));
 assert.equal(pub.records.length,2);assert.equal(pub.records[0].url,'https://www.omg.org/spec/UML/2.4.1');
 assert.ok(pub.records.every(x=>Object.keys(x).sort().join(',')==='publicationDate,url'));
 assert.ok(!existsSync(join(f.out,'histories','UTP2.json')));
 assert.ok(!existsSync(join(f.out,'histories','FUML.json')));
 const coverage=JSON.parse(readFileSync(join(f.out,'coverage.json'),'utf8'));
 assert.equal(coverage.families.find(x=>x.family==='UTP2').state,'unresolved');
 assert.equal(coverage.families.find(x=>x.family==='FUML').state,'in-process-only');
 assert.equal(api.validateOmgPublicHistory(pub,'UML').rows.length,2);
 assert.equal(api.validateOmgPublicLinks(JSON.parse(readFileSync(join(f.out,'index.json'),'utf8'))).rows.length,3);
 assert.equal(report.sourceSnapshotsCopied,false);
 assert.throws(()=>assemble({...f}),/Output exists/);
});
test('C6: mismatch in a declared formal history rejects output before writing',()=>{
 const f=setup();const filename=join(f.coverageDir,'batch-0001','UML.json');const data=JSON.parse(readFileSync(filename,'utf8'));data.family='UTP2';writeFileSync(filename,j(data));
 assert.throws(()=>assemble({...f}),/Family mismatch/);assert.equal(existsSync(f.out),false);
});
test('C6: rejects incomplete history rather than inventing old editions',()=>{
 const f=setup();const filename=join(f.coverageDir,'batch-0001','UML.json');const data=JSON.parse(readFileSync(filename,'utf8'));data.coverage.complete=false;writeFileSync(filename,j(data));
 assert.throws(()=>assemble({...f}),/Incomplete source/);assert.equal(existsSync(f.out),false);
});
