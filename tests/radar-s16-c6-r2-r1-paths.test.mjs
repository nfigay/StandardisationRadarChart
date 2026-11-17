import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,symlinkSync,existsSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {enrich} from '../tools/enrich-omg-public-histories.mjs';
const json=x=>JSON.stringify(x,null,2)+'\n';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
function fixture(){
 const root=mkdtempSync(join(tmpdir(),'s16-c6-r2-r1-'));
 const candidate=join(root,'candidate');mkdirSync(join(candidate,'histories'),{recursive:true});
 const files={
  'index.json':{schemaVersion:1,records:[]},
  'coverage.json':{schemaVersion:1,sourceId:'omg-history-coverage',summary:{catalogFamilies:1,verifiedFamilies:1,inProcessOnlyFamilies:0,unresolvedFamilies:0,formalEditions:1,inProcessVersions:0},families:[{family:'BPMN',state:'verified',historyAvailable:true,formalVersions:1,inProcessVersions:0}]},
  'histories/BPMN.json':{schemaVersion:1,sourceId:'omg-public-history-links',family:'BPMN',distribution:'public-links-only',coverage:{complete:true,records:1},records:[{url:'https://www.omg.org/spec/BPMN/2.0.2',publicationDate:'2014-01'}]}
 };
 const checksums=[];
 for(const [p,payload] of Object.entries(files)){const bytes=json(payload);writeFileSync(join(candidate,p),bytes);checksums.push({path:p,sha256:sha(bytes)});}
 const reviewFile=join(root,'review.json');writeFileSync(reviewFile,json({operation:'S16-C6-PUBLIC-DISTRIBUTION-REVIEW',publication:false,sourceSnapshotsCopied:false,files:3,histories:1,summary:files['coverage.json'].summary,unresolved:[],checksums}));
 const evidenceFile=join(root,'evidence.json');writeFileSync(evidenceFile,json({schemaVersion:1,operation:'S16-C6-R2-OMG-EDITION-EVIDENCE',editions:[{family:'BPMN',edition:'2.0',url:'https://www.omg.org/spec/BPMN/2.0',evidenceUrl:'https://www.omg.org/spec/BPMN/2.0',publicationDate:'2010-12'}]}));
 return {root,candidate,reviewFile,evidenceFile,out:join(root,'out')};
}
test('C6-R2-R1 accepts canonical /var vs /private/var style root aliases',()=>{
 const s=fixture();
 try {
  const alias=join(s.root,'candidate-alias');symlinkSync(s.candidate,alias,'dir');
  const result=enrich({...s,candidate:alias});
  assert.equal(result.addedEditions,1);
  assert.deepEqual(JSON.parse(readFileSync(join(s.out,'histories/BPMN.json'),'utf8')).records.map(r=>r.url.split('/').at(-1)),['2.0','2.0.2']);
 } finally {rmSync(s.root,{recursive:true,force:true});}
});
test('C6-R2-R1 still rejects a symbolic-link input file',()=>{
 const s=fixture();
 try {
  const path=join(s.candidate,'index.json'), real=join(s.root,'real-index.json');
  const bytes=readFileSync(path);rmSync(path);writeFileSync(real,bytes);symlinkSync(real,path);
  assert.throws(()=>enrich({...s}),/Non-regular input/);
  assert.equal(existsSync(s.out),false);
 } finally {rmSync(s.root,{recursive:true,force:true});}
});
