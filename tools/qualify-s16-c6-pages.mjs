#!/usr/bin/env node
/* S16-C6-R1: read-only static Pages verification + same-origin HTTP runtime API check.
 * No browser GUI claim. No repository writes, no network outside 127.0.0.1.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {readFileSync,existsSync,lstatSync,realpathSync} from 'node:fs';
import {resolve,join,relative,sep,extname} from 'node:path';
import vm from 'node:vm';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');
const must=(b,m)=>assert.ok(b,m);
const report={operation:'S16-C6-R1-PAGES-QUALIFICATION',schemaVersion:1,ok:false,publication:false,checks:[],errors:[],limits:['Does not automate user-interface clicks or verify GUI rendering','No external OMG/RFC/W3C HTTP service is queried']};
const check=async(name,fn)=>{try{const detail=await fn();report.checks.push({name,ok:true,...(detail?{detail}:{})});}catch(e){report.checks.push({name,ok:false,error:String(e.message||e)});report.errors.push({name,error:String(e.stack||e)});}};
function option(name){const i=process.argv.indexOf(name);if(i<0||!process.argv[i+1])throw Error('Missing '+name);return resolve(process.argv[i+1]);}
let server;
try{
const repo=option('--repo'),build=option('--build'),reviewFile=option('--review');
const root=realpathSync(build);const review=read(reviewFile);
let base;
await check('review-integrity',()=>{
 must(review.operation==='S16-C6-PUBLIC-DISTRIBUTION-REVIEW','Unexpected review');
 must(review.publication===false&&review.sourceSnapshotsCopied===false,'Distribution must contain only public links');
 must(review.files===264&&review.histories===262&&review.checksums.length===264,'Unexpected manifest coverage');
 const r=review.summary;
 must(r.catalogFamilies===270&&r.verifiedFamilies===262&&r.inProcessOnlyFamilies===7&&r.unresolvedFamilies===1&&r.formalEditions===496&&r.inProcessVersions===27,'Unexpected summary');
 return {files:review.files,histories:review.histories,editions:r.formalEditions};
});
await check('published-files-sha256',()=>{
 const dir=join(root,'catalog-distribution/omg-public');base=realpathSync(dir);let verified=0;
 for(const entry of review.checksums){
  const file=resolve(base,entry.path),rel=relative(base,file);
  must(rel&&!rel.startsWith('..')&&!rel.startsWith(sep),'Unsafe path '+entry.path);
  must(lstatSync(file).isFile(),'Not a regular file '+entry.path);
  must(realpathSync(file)===file,'Unexpected symlink '+entry.path);
  must(sha(readFileSync(file))===entry.sha256,'Digest mismatch '+entry.path);
  verified++;
 }
 return {verified};
});
await check('coverage-preserves-documentary-status',()=>{
 const cov=read(join(base,'coverage.json'));
 const families=cov.families||[];
 must(families.length===270,'Missing family');
 must(families.filter(x=>x.state==='verified').length===262,'Verified mismatch');
 must(families.filter(x=>x.state==='in-process-only').length===7,'In-process mismatch');
 must(families.filter(x=>x.state==='unresolved').length===1,'Unresolved mismatch');
 must(families.some(x=>x.family==='UTP2'&&x.state==='unresolved'&&!x.historyAvailable),'UTP2 exception missing');
 must(!existsSync(join(base,'histories/UTP2.json')),'UTP2 must not be published as complete');
 for(const f of families.filter(x=>x.state!=='verified'))must(!existsSync(join(base,'histories',f.family+'.json')),'False formal history: '+f.family);
 const formal=families.reduce((n,x)=>n+(x.formalVersions||0),0);
 must(formal===496,'Formal edition count mismatch');
 return {families:families.length,formal,unresolved:'UTP2'};
});
await check('pages-runtime-and-connector-wiring',()=>{
 must(existsSync(join(root,'radar.html')),'Creator missing');
 const js=readFileSync(join(root,'js/radar-standard-sources.js'),'utf8');
 const ui=readFileSync(join(root,'js/radar-standards-panel.js'),'utf8');
 must(js.includes('loadOmgPublishedHistory')&&js.includes('selectedOmgHistory'),'Runtime functions missing');
 must(ui.includes('loadOmgPublishedHistory')&&ui.includes('omgPublished'),'Creator UI wiring missing');
 // Test the actual built output and not a working-copy source.
 return {creator:'radar.html',source:'js/radar-standard-sources.js',panel:'js/radar-standards-panel.js'};
});
if(!report.errors.length){
 // Serve the exact build, loopback only, with no dependencies and no file writes.
 server=createServer((req,res)=>{
  let pathname;
  try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);res.end();return;}
  const file=resolve(root,'.'+pathname),rel=relative(root,file);
  if(!rel||rel.startsWith('..')||rel.startsWith(sep)||!existsSync(file)||!lstatSync(file).isFile()){
   res.writeHead(404);res.end();return;
  }
  if(realpathSync(file)!==file){res.writeHead(403);res.end();return;}
  const data=readFileSync(file);res.writeHead(200,{'content-type':extname(file)==='.json'?'application/json':extname(file)==='.js'?'text/javascript':'text/html','content-length':data.length});res.end(data);
 });
 await new Promise((yes,no)=>{server.once('error',no);server.listen(0,'127.0.0.1',yes);});
 const origin=`http://127.0.0.1:${server.address().port}`;
 await check('http-creator-and-multi-family-resources',async()=>{
  for(const p of ['radar.html','catalog-distribution/omg-public/index.json','catalog-distribution/omg-public/coverage.json','catalog-distribution/omg-public/histories/UML.json','catalog-distribution/omg-public/histories/BPMN.json','catalog-distribution/omg-public/histories/BMM.json','catalog-distribution/omg-public/histories/EDMC-FIBO/BE.json']){
   const res=await fetch(origin+'/'+p);must(res.ok,p+' HTTP '+res.status);
   if(p.endsWith('.json'))must(res.headers.get('content-type')?.startsWith('application/json'),'JSON MIME missing');
  }
  return {http:'loopback-only',samples:7};
 });
 await check('http-fresh-author-api-historical-editions',async()=>{
  const code=await (await fetch(origin+'/js/radar-standard-sources.js')).text();
  const window={location:{href:origin+'/radar.html'},__radarApplicationProfile:{viewer:false,require(){}},fetch:fetch};
  const ctx=vm.createContext({window,URL,TextEncoder,TextDecoder,AbortSignal,Uint8Array,console});
  vm.runInContext(code,ctx,{timeout:5000});const api=window.__radarStandardSources;
  must(api&&typeof api.loadOmgPublished==='function','OMG loader absent');
  const catalog=await api.loadOmgPublished();must(catalog.count===286,'OMG catalog !=286');
  const families=[['UML','2.4.1'],['BPMN','2.0'],['BPMN','2.0.1'],['BPMN','2.0.2'],['BMM','1.0'],['EDMC-FIBO/BE','1.0']];
  const selected=[];
  for(const [family,edition] of families){
   const status=await api.loadOmgPublishedHistory(family);must(status.count>0,`${family} empty`);
   const found=api.searchOmgHistory(family,edition);const row=found.rows.find(r=>r.edition===edition);
   must(row,`Missing ${family}/${edition}`);
   const document=api.selectedOmgHistory(family,row.key,found.generation);
   must(document.edition===edition&&document.status==='formal',`Incorrect edition ${family}/${edition}`);
   must(document.url===`https://www.omg.org/spec/${family}/${edition}`,`Wrong official URL ${family}/${edition}`);
   selected.push({family,edition,url:document.url});
  }
  const bpmn=api.searchOmgHistory('BPMN');must(bpmn.total===6,'BPMN editions missing');
  const bpmnVersions=new Set(bpmn.rows.map(x=>x.edition));must(['2.0','2.0.1','2.0.2'].every(x=>bpmnVersions.has(x)),'BPMN exact historical editions missing');
  const back=await api.loadOmgPublishedHistory('UML');
  const variants=api.searchOmgHistory('UML');must(variants.total===11,'UML edition loss');
  const editions=new Set(variants.rows.map(x=>x.edition));must(editions.has('2.4.1')&&editions.has('2.5.1'),'Historical identity replaced by latest');
  return {catalog:catalog.count,selected,umlVersions:back.count};
 });
 await check('non-formal-and-UTP2-not-misrepresented',async()=>{
  const r=await fetch(origin+'/catalog-distribution/omg-public/histories/UTP2.json');must(r.status===404,'Unresolved UTP2 has a false formal history');
  return {utp2HistoryHTTP:r.status};
 });
}
} catch(e){report.errors.push({name:'setup',error:String(e.stack||e)});}
finally{if(server)await new Promise(done=>server.close(done));report.ok=report.errors.length===0;report.endedAt=new Date().toISOString();console.log(JSON.stringify(report,null,2));if(!report.ok)process.exitCode=1;}
