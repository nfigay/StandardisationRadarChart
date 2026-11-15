import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {spawn,spawnSync} from 'node:child_process';
import {setTimeout as sleep} from 'node:timers/promises';
const home=os.homedir(), original=path.join(home,'git/StandardisationRadarChart');
const commit='03474a66da02f57bcf5184b605b994ca5bc06c99',main='2695a6ef64cf338129f9ce0eb4f163dd495db1bf',release='894ae2a1ed25f7cef6bbbb56b3d2520792ecdc55';
const report={operation:'S15-D-A87-QUALIFICATION',startedAt:new Date().toISOString(),repository:original,codeCommit:commit,checks:[],errors:[],committed:false,pushed:false,published:false,ok:false};
fs.mkdirSync(path.join(home,'Documents'),{recursive:true});
const previousDir=path.join(home,'Documents','S15-D-A87-28glRO');
const dir=fs.mkdtempSync(path.join(home,'Documents','S15-D-R4-')), repo=path.join(previousDir,'source'), pilot=path.join(previousDir,'standalone'), downloads=path.join(dir,'downloads');
const sha=b=>createHash('sha256').update(b).digest('hex');
const assert=(x,m)=>{if(!x)throw Error(m);return x;};
const check=(name,ok,detail)=>{report.checks.push({name,ok:!!ok,detail});assert(ok,name+' failed: '+JSON.stringify(detail));};
function run(name,cmd,args,{cwd=repo,env={},timeout=300000}={}){
  console.error('=== '+name+' ===');
  const r=spawnSync(cmd,args,{cwd,encoding:'utf8',maxBuffer:128*1024*1024,timeout,env:{...process.env,...env}});
  const log=path.join(dir,name+'.log');fs.writeFileSync(log,(r.stdout||'')+'\n'+(r.stderr||''));
  check(name,r.status===0&&!r.error,{exitCode:r.status,signal:r.signal,error:r.error?.message||null,log,tail:((r.stdout||'')+'\n'+(r.stderr||'')).slice(-3000)});
  return r.stdout||'';
}
function git(cwd,...args){const r=spawnSync('git',args,{cwd,encoding:'utf8'});assert(r.status===0&&!r.error,'git '+args.join(' ')+': '+(r.stderr||r.error?.message));return r.stdout.trim();}
function originalState(){return {branch:git(original,'branch','--show-current'),head:git(original,'rev-parse','HEAD'),main:git(original,'rev-parse','main'),release:git(original,'rev-parse','pilot-a86^{commit}'),tracked:git(original,'status','--porcelain','-uno')};}
const cacheHashes={
 'rfc-editor.json':'0ba594f0ee30513957f9a84f28fd753e8cd751add352f655a4fd0d58b1d3c823',
 'w3c.json':'798653d01c5253328487cd908e70503501e89564fde2efe0b08db07588215026',
 'w3c-json-ld11.json':'48174cb440ae031f042cd87969553aa250f67a39e5cb5ce3b79e65a3f200c518',
 'w3c-daml+oil-axioms.json':'01360081cf7e4d8a44b6c018c0e2475b23fc630e7dacf0fd0af4961f87d21459'
};
let server,chrome,ws,seq=0,phase='initial',origin,initial;const pending=new Map(),blocked=[],exceptions=[],consoleErrors=[],networkFailures=[],servedCaches=[];
async function wait(fn,ms=30000){const end=Date.now()+ms;let last;while(Date.now()<end){try{const v=await fn();if(v)return v;}catch(e){last=e;}await sleep(150);}throw Error('Timeout in '+phase+': '+(last?.message||'condition not reached'));}
function cdp(method,params={},timeout=30000){return new Promise((resolve,reject)=>{const id=++seq,timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout '+method));},timeout);pending.set(id,{resolve,reject,timer});ws.send(JSON.stringify({id,method,params}));});}
async function evaluate(expression,timeout=30000){const r=await cdp('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true},timeout);if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;}
async function browserCheck(name,fn){phase=name;console.error('=== Chrome: '+name+' ===');try{const detail=await fn();check(name,true,detail);return detail;}catch(e){report.checks.push({name,ok:false,detail:e.message});try{report.browserLastState=await evaluate(`({href:location.href,ready:document.readyState,body:document.body?.innerText?.slice(0,2000),iso:window.__radarIsoStartup,profile:window.__radarApplicationProfile?.name})`);const shot=await cdp('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(dir,'failure.png'),Buffer.from(shot.data,'base64'));}catch{}throw e;}}
async function navigate(url){const n=await cdp('Page.navigate',{url},120000);assert(!n.errorText,n.errorText);return wait(()=>evaluate(`location.href===${JSON.stringify(url)}&&document.readyState==='complete'&&!!window.__radarWorkspaceExplorer?.graph?.()&&!!window.w2ui?.toolbar`),120000);}
async function downloadNamed(prefix,suffix){return wait(()=>{const list=fs.readdirSync(downloads).filter(n=>n.startsWith(prefix)&&n.endsWith(suffix));return list.length===1?path.join(downloads,list[0]):null;},90000);}
const pagePrefix='/StandardisationRadarChart/';
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.csv':'text/csv','.gz':'application/gzip','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf','.ico':'image/x-icon'};
try{
  initial=originalState();check('original-baseline',initial.branch==='feature/s15-standards-sources'&&initial.head===commit&&initial.main===main&&initial.release===release&&!initial.tracked,initial);
  for(const [name,expected] of Object.entries(cacheHashes)){const file=path.join(original,'standard-source-cache',name);const actual=fs.existsSync(file)?sha(fs.readFileSync(file)):null;check('cache:'+name,actual===expected,{file,expectedSha256:expected,actualSha256:actual});}
  const previousPath=path.join(previousDir,'S15-D-A87-QUALIFICATION.json');
  const previous=JSON.parse(fs.readFileSync(previousPath,'utf8'));
  const required=['clone','checkout','isolated-commit','node-version','npm-install','npm-dependency-versions','verify-source','node-tests','node-test-count','build','verify-build','build-pages','verify-pages','pages-readiness','build-client','verify-client','assemble-products','verify-products','prepare-pages-products','verify-pages-products','build-dist','verify-dist','build-common-standalone','pages-creator-startup','pages-iso-installed','pages-native-v1-compatibility','pages-create-radar','pages-import-and-reconcile','pages-create-blips-and-publish','pages-native-grid-and-language','pages-export-and-close'];
  const priorCheck=name=>{const matches=previous.checks.filter(c=>c.name===name);assert(matches.length===1&&matches[0].ok===true,'missing prior successful check '+name);return matches[0];};
  check('resume-prior-report',previous.operation==='S15-D-A87-QUALIFICATION'&&previous.codeCommit===commit&&previous.checks.some(c=>c.name==='standalone-creator-startup'&&!c.ok)&&previous.browserDiagnostics.exceptions.length===0&&required.every(n=>priorCheck(n)),previousPath);
  check('resume-isolated-commit',git(repo,'rev-parse','HEAD')===commit&&!git(repo,'status','--porcelain','-uno'),commit);
  check('resume-node-version',process.version==='v22.23.5',process.version);
  fs.mkdirSync(downloads);
  run('resume-verify-dist','npm',['run','verify:dist']);
  for(const name of required)report.checks.push({...priorCheck(name),reusedFrom:previousPath});
  report.resume={previousPath,previousReportSha256:sha(fs.readFileSync(previousPath)),reusedChecks:required,mode:'existing-artifacts-fresh-browser'};
  const creator=path.join(pilot,'standardization-radar-creator.html'),viewer=path.join(pilot,'standardization-radar-viewer.html');
  const creatorBytes=fs.readFileSync(creator),viewerBytes=fs.readFileSync(viewer);
  const tag=(id)=>{const match=creatorBytes.toString('utf8').match(new RegExp('<script type="application/json" id="'+id+'">([A-Za-z0-9+/=]+)</script>'));assert(match,'missing '+id);return Buffer.from(match[1],'base64');};
  const proof=JSON.parse(tag('radar-viewer-template-proof').toString());
  check('standalone-template-provenance',tag('radar-viewer-template').equals(viewerBytes)&&proof.codeCommit===commit&&proof.templateSha256===sha(viewerBytes)&&proof.templateBytes===viewerBytes.length&&proof.modules.includes('js/radar-standard-sources.js'),{codeCommit:proof.codeCommit,templateSha256:proof.templateSha256,templateBytes:proof.templateBytes,modules:proof.modules.length});
  const resourceKeys=bytes=>{const m=bytes.toString('utf8').match(/const resources=(\{[^\r\n]*\});/);assert(m,'standalone resource table missing');return Object.keys(JSON.parse(m[1]));};
  const creatorResources=resourceKeys(creatorBytes),viewerResources=resourceKeys(viewerBytes);
  check('standalone-resource-isolation',creatorResources.some(k=>k.startsWith('catalog-distribution/'))&&!viewerResources.some(k=>k.startsWith('catalog-distribution/'))&&!creatorResources.some(k=>k.startsWith('standard-source-cache/'))&&!viewerResources.some(k=>k.startsWith('standard-source-cache/'))&&proof.modules.includes('js/radar-publication-viewer.js')&&!proof.modules.includes('js/radar-publication-delivery.js')&&!proof.modules.includes('lib/jszip.min.js'),{creatorResources:creatorResources.length,viewerResources:viewerResources.length});
  report.artifacts={creator:{path:creator,bytes:creatorBytes.length,sha256:sha(creatorBytes)},viewerTemplate:{path:viewer,bytes:viewerBytes.length,sha256:sha(viewerBytes)},distribution:path.join(repo,'dist')};
  for(const key of ['creator','viewerTemplate']){const a=report.artifacts[key],b=previous.artifacts[key];check('resume-artifact:'+key,a.path===b.path&&a.bytes===b.bytes&&a.sha256===b.sha256,a);}
  // Serve the exact final dist at the GitHub Pages base path. Optional source caches
  // are separate test inputs; never copied into the dist tree or its manifest.
  const dist=path.join(repo,'dist');
  server=http.createServer((req,res)=>{try{const u=new URL(req.url,'http://127.0.0.1');const name=decodeURIComponent(u.pathname);if(!name.startsWith(pagePrefix))throw Error('wrong base');let relative=name.slice(pagePrefix.length)||'index.html';let file;
    if(relative.startsWith('standard-source-cache/')){const key=relative.slice('standard-source-cache/'.length);assert(Object.hasOwn(cacheHashes,key),'unknown cache');file=path.join(original,'standard-source-cache',key);servedCaches.push(key);}
    else {file=path.resolve(dist,relative);assert(file.startsWith(dist+path.sep),'path escapes dist');}
    const stat=fs.statSync(file);if(!stat.isFile())throw Error('not a file');res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Content-Length':stat.size,'Cache-Control':'no-store'});fs.createReadStream(file).pipe(res);
  }catch{res.writeHead(404);res.end('Not found');}});
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});origin=`http://127.0.0.1:${server.address().port}`;
  const bin=process.env.S15_CHROME||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';assert(fs.existsSync(bin),'Chrome not found: '+bin);
  const profile=path.join(dir,'chrome-profile'),log=fs.openSync(path.join(dir,'chrome.log'),'w');
  chrome=spawn(bin,['--headless=new','--disable-gpu','--disable-background-networking','--no-proxy-server','--no-first-run','--no-default-browser-check','--remote-debugging-port=0','--user-data-dir='+profile,'--window-size=1600,1000',...(process.env.S15_CHROME_NO_SANDBOX==='1'?['--no-sandbox']:[]),'about:blank'],{stdio:['ignore',log,log]});fs.closeSync(log);let launchError;chrome.on('error',e=>launchError=e);
  phase='Chrome startup';const port=await wait(()=>{if(launchError)throw launchError;const f=path.join(profile,'DevToolsActivePort');return fs.existsSync(f)&&fs.readFileSync(f,'utf8').split('\n')[0];});
  const target=await wait(async()=>{const a=await(await fetch(`http://127.0.0.1:${port}/json/list`)).json();return a.find(x=>x.type==='page');});
  ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
  ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);return;}
    if(m.method==='Runtime.exceptionThrown')exceptions.push({phase,detail:m.params.exceptionDetails});
    if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error')consoleErrors.push({phase,text:m.params.args.map(x=>x.value||x.description).join(' ').slice(0,2000)});
    if(m.method==='Network.loadingFailed'&&!m.params.canceled)networkFailures.push({phase,error:m.params.errorText,blockedReason:m.params.blockedReason});
    if(m.method==='Fetch.requestPaused'){const {requestId,request}=m.params;let local=false;try{local=false;}catch{}if(!local)blocked.push({phase,url:request.url});void cdp(local?'Fetch.continueRequest':'Fetch.failRequest',local?{requestId}:{requestId,errorReason:'BlockedByClient'}).catch(e=>report.errors.push(e.message));}
  });
  await cdp('Page.enable');await cdp('Runtime.enable');await cdp('Network.enable');await cdp('Fetch.enable',{patterns:[{urlPattern:'http://*'},{urlPattern:'https://*'}]});await cdp('Page.setDownloadBehavior',{behavior:'allow',downloadPath:downloads});
  const loadCatalog=`async input=>{const p=window.__radarCatalogPersistence,u=window.__radarCatalogUI,e=window.__radarWorkspaceExplorer;const v=await window.__radarArtifactIntegrity.inspect(input);const s=u.load(v.catalog,window.w2ui.toolbar);p.remember(v.catalog,s,v.manifest,v.digest);e.addCatalog(v.catalog,s);e.activate(s.revisions[0].group);return {summary:s,legacy:v.legacy,digest:v.digest}}`;
  const created=priorCheck('pages-create-radar').detail,integrated=priorCheck('pages-import-and-reconcile').detail;
  const catalogFile=path.join(previousDir,'catalogue-s15-d.json'),catalogBytes=fs.readFileSync(catalogFile),artifact=JSON.parse(catalogBytes);
  check('resume-catalog-integrity',previous.catalogArtifact.path===catalogFile&&sha(catalogBytes)===previous.catalogArtifact.sha256&&artifact.proof.digest===previous.catalogArtifact.digest&&artifact.artifact.data.radarRevisions[0].revisionId===created.revisionId&&artifact.artifact.data.standards.length===5&&artifact.artifact.data.radarRevisions[0].blips.length===5,previous.catalogArtifact);
  report.catalogArtifact=previous.catalogArtifact;
  const r3Path=path.join(home,'Documents','S15-D-R3-IXGW9d','S15-D-A87-QUALIFICATION.json');
  const r3Bytes=fs.readFileSync(r3Path),r3=JSON.parse(r3Bytes);
  const r3Names=['standalone-creator-startup','standalone-catalog-reopen','standalone-publisher-projection','publisher-real-html-download','publisher-real-zip-download'];
  const r3Check=name=>{const list=r3.checks.filter(c=>c.name===name);assert(list.length===1&&list[0].ok===true,'missing R3 check '+name);return list[0];};
  check('resume-R3-report',r3.operation===report.operation&&r3.codeCommit===commit&&r3.resume.previousReportSha256===sha(fs.readFileSync(previousPath))&&r3.checks.some(c=>c.name==='downloaded-viewer-offline-startup'&&!c.ok)&&r3.browserDiagnostics.exceptions.length===0&&r3Names.every(n=>r3Check(n)),r3Path);
  const projection=r3Check('standalone-publisher-projection').detail,candidate=r3Check('publisher-real-html-download').detail,zip=r3Check('publisher-real-zip-download').detail;
  const html=fs.readFileSync(candidate.file),zipBytes=fs.readFileSync(zip.file);
  check('resume-R3-artifacts',sha(html)===candidate.sha256&&html.length===candidate.bytes&&sha(zipBytes)===zip.sha256&&candidate.history===0&&zip.history===1&&candidate.projectionDigest===projection.projectionDigest&&projection.report.standardCount===5&&projection.report.blipCount===5&&projection.report.revisionIds.includes(created.revisionId),{candidate:candidate.sha256,zip:zip.sha256,projection:projection.projectionDigest});
  const unzip=name=>{const r=spawnSync('unzip',['-p',zip.file,name],{maxBuffer:128*1024*1024});assert(r.status===0,'ZIP entry missing: '+name);return r.stdout;};
  const manifest=JSON.parse(unzip('manifest.json'));
  check('resume-R3-zip',unzip('viewer.html').equals(html)&&JSON.stringify(manifest)===JSON.stringify(zip.manifest)&&manifest.codeCommit===commit&&manifest.templateSha256===sha(viewerBytes)&&manifest.projectionDigest===projection.projectionDigest&&manifest.artifacts[0].sha256===sha(html)&&manifest.artifacts[0].bytes===html.length,{codeCommit:manifest.codeCommit,projectionDigest:manifest.projectionDigest});
  const match=html.toString().match(/<script type="application\/json" id="radar-publication-payload">([A-Za-z0-9+/=]+)<\/script>/);assert(match,'missing publication payload');const payload=JSON.parse(Buffer.from(match[1],'base64').toString());
  check('resume-R3-payload',payload.projectionDigest===projection.projectionDigest&&!JSON.stringify(payload).includes('PRIVATE_S15D')&&!JSON.stringify(payload).includes('referenceReconciliation'),{projectionDigest:payload.projectionDigest});
  for(const name of r3Names)report.checks.push({...r3Check(name),reusedFrom:r3Path});
  report.resume.R3={path:r3Path,sha256:sha(r3Bytes),reusedChecks:r3Names};report.artifacts.candidate=candidate;report.artifacts.zip=zip;
  await browserCheck('downloaded-viewer-offline-startup',async()=>{const from=blocked.length;await navigate(pathToFileURL(candidate.file).href);const startup=await wait(()=>evaluate(`(()=>{const s=window.__radarPublicationViewer?.startupStatus();return s?.ok===true?s:null})()`),90000);const state=await evaluate(`({startup:window.__radarPublicationViewer.startupStatus(),profile:window.__radarStandalone?.profile,commit:window.__radarStandalone?.sourceCommit,title:document.title,author:window.__radarApplicationProfile.allows('publication.create'),catalogOpen:window.__radarApplicationProfile.allows('catalog.open'),iso:window.__radarIsoStartup||null,source:window.__radarStandardSources?.status('rfc-editor')||null})`);assert(startup.ok&&startup.projectionDigest===projection.projectionDigest&&startup.activeRevisionId===created.revisionId&&state.profile==='viewer'&&state.commit===commit&&!state.author&&!state.catalogOpen&&!state.iso&&!state.source,'Viewer startup or restrictions mismatch');assert(blocked.length===from,'Viewer attempted external HTTP');return state;});
  await browserCheck('downloaded-viewer-reference-grid',async()=>{const x=await evaluate(`(()=>{window.__radarStandardsPanel.openReferences();const g=window.w2ui.standardReferencesGrid;const p=window.__radarCatalogPersistence;const records=p.listReferenceRecords();let denied=false;try{p.referenceImpact(window.__radarWorkspaceExplorer.graph(),${JSON.stringify(integrated.rfc)})}catch{denied=true}return {rows:g?.records?.length,records:records.map(r=>({id:r.standardId,origin:r.origin,iso:!!r.isoDocument})),denied,authorButtons:document.querySelectorAll('[data-standard-sources], [data-reference-lifecycle]').length};})()`);assert(x.rows===5&&x.records.length===5&&x.records.some(r=>r.iso)&&x.denied&&x.authorButtons===0,'Viewer references or author controls mismatch');return x;});
  await browserCheck('downloaded-viewer-iso-detail',async()=>{await evaluate(`(()=>{const b=[...document.querySelectorAll('[data-native-iso-detail]')].find(x=>x.getAttribute('data-native-iso-detail')===${JSON.stringify(integrated.iso)});if(!b)throw Error('ISO detail control missing');b.click();})()`);const v=await wait(()=>evaluate(`(()=>{const f=window.w2ui?.isoStandardReadOnlyForm,d=document.getElementById('iso-standard-detail-dialog');return f&&d?{reference:f.record.reference,fields:f.fields.length,readOnly:f.fields.every(x=>String(x.html?.attr||'').includes('readonly')),actions:Object.keys(f.actions||{}),dialogOpen:d.open}:null;})()`));assert(v.reference==='ISO 10303-242:2014'&&v.fields>0&&v.readOnly&&!v.actions.length&&v.dialogOpen,'ISO portable detail is not read-only');return v;});
  await browserCheck('browser-no-runtime-exceptions',async()=>{assert(exceptions.length===0&&blocked.length===0&&consoleErrors.length===0&&networkFailures.length===0,'Viewer runtime or network diagnostics: '+JSON.stringify({exceptions,blocked,consoleErrors,networkFailures}).slice(0,4000));return {exceptions:exceptions.length,externalRequestsBlocked:blocked.length,consoleErrors:consoleErrors.length,networkFailures:networkFailures.length};});
  check('isolated-source-still-clean',git(repo,'rev-parse','HEAD')===commit&&!git(repo,'status','--porcelain','-uno'),commit);
  const after=originalState();check('original-unchanged',JSON.stringify(initial)===JSON.stringify(after),after);
  report.ok=true;
}catch(e){report.errors.push(e.stack||e.message);}
finally{
  if(ws)ws.close();if(chrome)chrome.kill();if(server)server.close();for(const p of pending.values())clearTimeout(p.timer);
  report.browserDiagnostics={blocked,exceptions,consoleErrors,networkFailures,servedCaches};report.finishedAt=new Date().toISOString();report.reportPath=path.join(dir,'S15-D-A87-QUALIFICATION.json');report.clipboard={ok:true};let json=JSON.stringify(report,null,2);fs.writeFileSync(report.reportPath,json+'\n');const cp=spawnSync('pbcopy',[],{input:json,encoding:'utf8'});if(cp.status!==0||cp.error){report.clipboard={ok:false,error:cp.error?.message||cp.stderr};report.ok=false;json=JSON.stringify(report,null,2);fs.writeFileSync(report.reportPath,json+'\n');}console.log(json);process.exitCode=report.ok?0:1;
}
