#!/usr/bin/env node
/* S16-C6-R2: additive, evidence-gated corrections to public OMG edition pointers.
   The output is a NEW candidate; original C6 candidate and private C5 files are untouched.
   No live HTTP, Git operations or deployment. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,mkdirSync,existsSync,lstatSync,realpathSync} from 'node:fs';
import {dirname,resolve,relative,isAbsolute,join} from 'node:path';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const json=x=>JSON.stringify(x,null,2)+'\n';
const digest=x=>createHash('sha256').update(x).digest('hex');
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
function inRoot(root,p){
 assert.equal(typeof p,'string');
 assert.ok(p&&!p.startsWith('/')&&!p.includes('\\')&&!p.split('/').some(x=>!x||x==='.'||x==='..'),'Unsafe relative path: '+p);
 const file=resolve(root,p),rel=relative(resolve(root),file);
 assert.ok(rel&&!rel.startsWith('..')&&!isAbsolute(rel),'Unsafe output path');
 return file;
}
function official(family,edition){
 assert.match(family,/^[A-Za-z0-9][A-Za-z0-9._+\/-]*$/);
 assert.ok(!family.split('/').some(x=>!x||x==='.'||x==='..'));
 assert.match(edition,/^[0-9]+(?:\.[0-9]+)*$/);
 return `https://www.omg.org/spec/${family}/${edition}`;
}
function checkEvidence(e){
 assert.equal(e.schemaVersion,1);
 assert.equal(e.operation,'S16-C6-R2-OMG-EDITION-EVIDENCE');
 assert.ok(Array.isArray(e.editions)&&e.editions.length>0&&e.editions.length<1000);
 const seen=new Set();
 for(const r of e.editions){
  assert.deepEqual(Object.keys(r).sort(),['edition','evidenceUrl','family','publicationDate','url']);
  assert.equal(r.url,official(r.family,r.edition));
  assert.match(r.publicationDate,/^\d{4}-(0[1-9]|1[0-2])$/);
  const u=new URL(r.evidenceUrl);
  assert.equal(u.origin,'https://www.omg.org');
  assert.ok(u.pathname===`/spec/${r.family}/${r.edition}`||u.pathname===`/spec/${r.family}/${r.edition}/About-${r.family}`,'Evidence must identify the exact official version');
  assert.ok(!seen.has(r.url),'Duplicate edition evidence');seen.add(r.url);
 }
}
export function enrich({candidate,reviewFile,evidenceFile,out}){
 assert.ok(!existsSync(out),'Destination already exists: '+out);
 const review=read(reviewFile),evidence=read(evidenceFile);
 assert.equal(review.operation,'S16-C6-PUBLIC-DISTRIBUTION-REVIEW');
 assert.equal(review.publication,false);
 assert.equal(review.sourceSnapshotsCopied,false);
 assert.ok(Number.isSafeInteger(review.files)&&review.files>0);
 assert.ok(Array.isArray(review.checksums)&&review.checksums.length===review.files);
 checkEvidence(evidence);
 const originals=new Map();
 for(const item of review.checksums){
  assert.deepEqual(Object.keys(item).sort(),['path','sha256']);
  assert.match(item.sha256,/^[a-f0-9]{64}$/);
  assert.ok(!originals.has(item.path),'Duplicate input path');
  const file=inRoot(candidate,item.path);
  assert.ok(lstatSync(file).isFile()&&realpathSync(file)===resolve(realpathSync(candidate),item.path),'Non-regular input');
  const bytes=readFileSync(file);assert.equal(digest(bytes),item.sha256,'Original candidate integrity: '+item.path);
  originals.set(item.path,bytes);
 }
 assert.ok(originals.has('index.json')&&originals.has('coverage.json'));
 const coverage=JSON.parse(originals.get('coverage.json'));
 assert.equal(coverage.sourceId,'omg-history-coverage');
 assert.ok(Array.isArray(coverage.families));
 const baseline=coverage.summary.formalEditions, added=[];
 for(const r of evidence.editions){
  const path=`histories/${r.family}.json`,bytes=originals.get(path);
  assert.ok(bytes,'No verified formal history for '+r.family);
  const row=coverage.families.find(x=>x.family===r.family);
  assert.ok(row&&row.state==='verified'&&row.historyAvailable,'Not a verified family: '+r.family);
  const history=JSON.parse(bytes);
  assert.equal(history.family,r.family);
  assert.equal(history.distribution,'public-links-only');
  assert.equal(history.sourceId,'omg-public-history-links');
  assert.equal(history.coverage.complete,true);
  assert.equal(history.coverage.records,history.records.length);
  assert.equal(row.formalVersions,history.records.length);
  assert.ok(!history.records.some(v=>v.url===r.url),'Already present: '+r.url);
  history.records.push({url:r.url,publicationDate:r.publicationDate});
  history.records.sort((a,b)=>a.url.localeCompare(b.url));
  assert.equal(new Set(history.records.map(x=>x.url)).size,history.records.length);
  history.coverage.records=history.records.length;
  row.formalVersions++;
  coverage.summary.formalEditions++;
  originals.set(path,Buffer.from(json(history)));
  added.push({...r});
 }
 assert.equal(coverage.summary.formalEditions,baseline+added.length);
 assert.equal(coverage.families.reduce((n,x)=>n+x.formalVersions,0),coverage.summary.formalEditions);
 // Explicitly record provenance without suggesting these two references were in C5.
 coverage.supplementalEditionEvidence={operation:evidence.operation,editions:added};
 originals.set('coverage.json',Buffer.from(json(coverage)));
 const checksums=[];
 for(const [name,bytes] of originals)checksums.push({path:name,sha256:digest(bytes)});
 assert.equal(checksums.length,review.files);
 const nextReview={...review,summary:coverage.summary,checksums,enrichment:{operation:evidence.operation,sourceEvidenceSha256:digest(readFileSync(evidenceFile)),added:added.length,editions:added},publication:false,sourceSnapshotsCopied:false};
 // All preconditions are checked before the first output write.
 mkdirSync(out,{recursive:true});
 for(const [name,bytes] of originals){const path=inRoot(out,name);mkdirSync(dirname(path),{recursive:true});writeFileSync(path,bytes,{flag:'wx'});}
 writeFileSync(join(dirname(out),'c6-r2-review.json'),json(nextReview),{flag:'wx'});
 return {operation:'S16-C6-R2-ENRICHMENT',ok:true,publication:false,baselineEditions:baseline,addedEditions:added.length,formalEditions:coverage.summary.formalEditions,files:checksums.length,histories:review.histories,evidence:added.map(x=>x.url),output:resolve(out),reviewFile:join(dirname(out),'c6-r2-review.json')};
}
function options(argv){const o={};for(let i=0;i<argv.length;i++){if(!['--candidate','--review','--evidence','--out'].includes(argv[i])||!argv[i+1])throw Error('Unknown/missing option '+argv[i]);o[argv[i].slice(2)]=argv[++i];}for(const k of ['candidate','review','evidence','out'])if(!o[k])throw Error('Missing --'+k);return {candidate:resolve(o.candidate),reviewFile:resolve(o.review),evidenceFile:resolve(o.evidence),out:resolve(o.out)};}
if(process.argv[1]&&resolve(process.argv[1])===resolve(new URL(import.meta.url).pathname)){
 try{console.log(json(enrich(options(process.argv.slice(2)))));}catch(e){console.error('S16 C6 R2 ERROR: '+String(e.stack||e));process.exitCode=1;}
}
