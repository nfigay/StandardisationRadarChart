import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {enrich} from '../tools/enrich-omg-public-histories.mjs';
const j=x=>JSON.stringify(x,null,2)+'\n';
const sha=b=>createHash('sha256').update(b).digest('hex');
const data=JSON.parse(readFileSync('tools/S16-C6-R2-BPMN-evidence.json','utf8'));
function setup(){
 const root=mkdtempSync(join(tmpdir(),'s16-c6-r2-')),candidate=join(root,'source'),out=join(root,'out');
 mkdirSync(join(candidate,'histories'),{recursive:true});
 const files={
  'index.json':{schemaVersion:1,records:[]},
  'coverage.json':{schemaVersion:1,sourceId:'omg-history-coverage',summary:{catalogFamilies:1,verifiedFamilies:1,inProcessOnlyFamilies:0,unresolvedFamilies:0,formalEditions:4,inProcessVersions:0},families:[{family:'BPMN',state:'verified',historyAvailable:true,formalVersions:4,inProcessVersions:0}]},
  'histories/BPMN.json':{schemaVersion:1,sourceId:'omg-public-history-links',family:'BPMN',distribution:'public-links-only',coverage:{complete:true,records:4},records:['1.0','1.1','1.2','2.0.2'].map(edition=>({url:`https://www.omg.org/spec/BPMN/${edition}`,publicationDate:'2014-01'}))}
 };
 const checksums=[];
 for(const [path,payload] of Object.entries(files)){const bytes=j(payload);writeFileSync(join(candidate,path),bytes);checksums.push({path,sha256:sha(bytes)});}
 const review={operation:'S16-C6-PUBLIC-DISTRIBUTION-REVIEW',publication:false,sourceSnapshotsCopied:false,files:3,histories:1,summary:files['coverage.json'].summary,unresolved:[],checksums};
 writeFileSync(join(root,'review.json'),j(review));writeFileSync(join(root,'evidence.json'),j(data));
 return {root,candidate,reviewFile:join(root,'review.json'),evidenceFile:join(root,'evidence.json'),out};
}
test('R2 adds documented editions without replacing 2.0.2',()=>{
 const s=setup(),r=enrich({...s});assert.equal(r.addedEditions,2);assert.equal(r.formalEditions,6);
 const a=JSON.parse(readFileSync(join(s.out,'histories/BPMN.json')));
 assert.deepEqual(a.records.map(x=>x.url.split('/').at(-1)),['1.0','1.1','1.2','2.0','2.0.1','2.0.2']);
 assert.equal(a.records.find(x=>x.url.endsWith('/2.0')).publicationDate,'2010-12');
 const coverage=JSON.parse(readFileSync(join(s.out,'coverage.json')));
 assert.equal(coverage.families[0].formalVersions,6);
 assert.equal(coverage.supplementalEditionEvidence.editions.length,2);
 const review=JSON.parse(readFileSync(join(s.root,'c6-r2-review.json')));
 for(const x of review.checksums)assert.equal(sha(readFileSync(join(s.out,x.path))),x.sha256);
 assert.equal(sha(readFileSync(join(s.out,'index.json'))),sha(readFileSync(join(s.candidate,'index.json'))));
 assert.throws(()=>enrich({...s}),/Destination already exists/);
});
test('R2 generates validated new candidates without a legal approval flag',()=>{const s=setup();const result=enrich(s);assert.equal(result.addedEditions,2);});
test('R2 refuses modified input digest',()=>{const s=setup();writeFileSync(join(s.candidate,'index.json'),'{}');assert.throws(()=>enrich({...s}),/integrity/);assert.equal(existsSync(s.out),false);});
test('R2 refuses duplicate edition without replacing existing evidence',()=>{const s=setup();const e=JSON.parse(readFileSync(s.evidenceFile));e.editions[0].edition='2.0.2';e.editions[0].url='https://www.omg.org/spec/BPMN/2.0.2';e.editions[0].evidenceUrl='https://www.omg.org/spec/BPMN/2.0.2';writeFileSync(s.evidenceFile,j(e));assert.throws(()=>enrich({...s}),/Already present/);assert.equal(existsSync(s.out),false);});
test('R2 rejects cross-family evidence and path traversal',()=>{const s=setup(),e=JSON.parse(readFileSync(s.evidenceFile));e.editions[0].family='../BPMN';writeFileSync(s.evidenceFile,j(e));assert.throws(()=>enrich({...s}));assert.equal(existsSync(s.out),false);});
test('R2 rejects mismatch between catalog coverage and edition count',()=>{const s=setup(),cov=JSON.parse(readFileSync(join(s.candidate,'coverage.json')));cov.families[0].formalVersions=3;const bytes=j(cov);writeFileSync(join(s.candidate,'coverage.json'),bytes);const review=JSON.parse(readFileSync(s.reviewFile));review.checksums.find(x=>x.path==='coverage.json').sha256=sha(bytes);writeFileSync(s.reviewFile,j(review));assert.throws(()=>enrich({...s}),/Expected values to be strictly equal/);assert.equal(existsSync(s.out),false);});
