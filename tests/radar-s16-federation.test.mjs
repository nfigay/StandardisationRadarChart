import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createHash,webcrypto} from 'node:crypto';
import {createServer} from 'node:http';
import {collectOmgCurrent,readPreparedOmg,createOmgRelayMiddleware,OMG_RELAY_PREFIX} from '../tools/radar-omg-local-bridge.mjs';
import '../js/radar-standard-sources.js';
import {CATALOG,PILOT,versionIdentity,metadataIdentity,allowedUrl,parseOmgCatalog,inspectJsonLd,authorize,acquireOmg,prepareOmgCatalog} from '../tools/read-omg-metadata.mjs';
const api=globalThis.__radarStandardSources;
const stamp='2026-11-16T07:00:00.000Z';
// Synthetic table shape based on the public catalog headings and version paths.
// Not a captured OMG response; no reproduction of source catalog contents.
const table=(head,rows)=>`<table><thead><tr>${head.map(c=>`<th>${c}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
const indexHead=['Name','Acronym','Version','Status','Publication Date'];
const isoHead=['Specification Title','Version','ISO Number','OMG File ID'];
const row=['Example &amp; Model','EXAMPLE&trade;','<a href="/spec/EXAMPLE/1.0">1.0</a>','formal','August 2020'];
const beta=['Example &amp; Model','EXAMPLE','<a href="https://www.omg.org/spec/EXAMPLE/1.0/Beta2">1.0 beta 2</a>','beta','July 2020'];
const adoption=['Example','<a href="/spec/EXAMPLE/1.0">1.0</a>','<a href="/spec/EXAMPLE/ISO/12345/PDF">12345-1:2022</a><br><a href="/spec/EXAMPLE/ISO/12345-2/PDF">12345-2:2022</a>','formal/22-01-01<br>formal/22-01-02'];
const html=table(indexHead,[row,beta])+table(indexHead,[row])+table(isoHead,[adoption]);
const rights=(urls=[CATALOG,...PILOT])=>({schemaVersion:1,sourceId:'omg',basis:'written-permission',reference:'synthetic test only',purpose:'test',allowAcquisition:true,allowPrivateRetention:true,urls});
const response=(s,ct='application/ld+json')=>new Response(s,{headers:{'content-type':ct}});
const ld=JSON.stringify({'@context':{'name':'https://schema.org/name'},'@id':'https://example.invalid/document','@type':'https://schema.org/CreativeWork',name:'synthetic'});

test('S16 registry inventories all target families without adding import connectors or native organizations',()=>{
 const resources=api.listResources();assert.ok(resources.length>=29);assert.equal(new Set(resources.map(r=>r.id)).size,resources.length);
 for(const id of ['omg-specifications','omg-version-metadata','mosa-sd28','incose','sebok','open-group-library','iec-webstore','ieee-sa','etsi-standards','cen-cenelec','oasis-standards','face-consortium','sosa-consortium'])assert.ok(api.getResource(id),id);
 assert.deepEqual(api.descriptors.map(x=>x.id),['iso-open-data','rfc-editor','w3c']);assert.deepEqual(api.listResources({integratedOnly:true}).map(x=>x.id),api.descriptors.map(x=>x.id));
 assert.equal(api.getResource('omg-specifications').connector,'candidate-discovery');assert.equal(api.getResource('omg-version-metadata').rights.redistribution,'to-review');
 assert.equal(api.knowledgeConcepts.organization.native,'organizations[].organizationId');assert.equal(api.knowledgeConcepts.portfolio.native,'portfolios[].portfolioId');assert.ok(resources.every(r=>!('organizationId' in r)&&Object.isFrozen(r.capabilities)));
 assert.equal(api.getResource('unknown'),null);assert.throws(()=>{resources[0].label='changed';},TypeError);assert.throws(()=>{resources[0].capabilities.publication.availability='changed';},TypeError);
});
test('S16 documentary projection preserves existing identity, missing values and provenance',()=>{
 const row={standardId:'native-1',name:'Name',issuer:'ISO',origin:'iso-open-data',verification:'source-verified',isoDocument:{id:'abc',title:'Title',reference:'ISO 9999:2020',edition:'1',publicationDate:'2020-05-01',icsCodes:['35.240'],ownerCommittee:'TC 1',replaces:['old'],release:'r1'}};
 const before=JSON.stringify(row);const view=api.describeNativeReference(row);assert.equal(view.standardId,'native-1');assert.deepEqual(view.sourceIdentity,{sourceId:'iso-open-data',key:'abc'});assert.equal(view.fields.person.state,'not-reported');assert.deepEqual(view.fields.classification.value.codes,['35.240']);assert.equal(view.fields.workingGroup.value.code,'TC 1');assert.equal(view.fields.title.provenance.release,'r1');view.fields.classification.value.codes.push('new');assert.equal(JSON.stringify(row),before);
 const manual=api.describeNativeReference({standardId:'same-existing',name:'Manual',issuer:'OMG',origin:'manual'});assert.equal(manual.sourceIdentity,null);assert.equal(manual.fields.issuerLabel.value,'OMG');assert.equal(manual.fields.publicationDate.state,'not-reported');assert.throws(()=>api.describeNativeReference({...row,externalDocument:{}}),/Ambiguous/);
});
test('S16 Datatracker projection keeps only scoped group and draft history, not person data',async()=>{
 const raw={name:'rfc2026',title:'Test',group:{acronym:'poised95',name:'Poised 95',type:'WG'},rev_history:[{name:'draft-ietf-poised95-std-proc-3',rev:'00',published:'1995-09-12T07:00:00+00:00',url:'https://bad.example/'},{name:'rfc2026',rev:'rfc2026'}],authors:[{name:'Sample Person',email:'private@example.invalid'}],stream:'IETF'};
 let calls=0;const result=await api.readRfcContext('2026',{fetcher:async(u,o)=>{calls++;assert.equal(u,'https://datatracker.ietf.org/doc/rfc2026/doc.json');assert.equal(o.credentials,'omit');assert.equal(o.redirect,'error');return response(JSON.stringify(raw),'application/json');}});
 assert.equal(calls,1);assert.equal(result.fields.workingGroup.value.sourceKey,'poised95');assert.equal(result.fields.activityHistory.value.length,1);assert.equal(result.fields.activityHistory.value[0].url,'https://datatracker.ietf.org/doc/draft-ietf-poised95-std-proc-3/00/');assert.equal(result.subject.sourceId,'rfc-editor');assert.ok(!JSON.stringify(result).includes('private@example'));assert.ok(!JSON.stringify(result).includes('bad.example'));assert.throws(()=>api.normalizeRfcContext(raw,'9110',stamp),/identity/);
});
test('S16 new documentary discovery is denied to Viewer, and OMG is not a valid native import provider',async()=>{
 const code=await fs.readFile(new URL('../js/radar-standard-sources.js',import.meta.url),'utf8');let calls=0;const root={__radarApplicationProfile:{viewer:true},fetch:async()=>{calls++;throw Error('unexpected network');}};vm.runInNewContext(code,{window:root,URL,AbortSignal,TextDecoder});await assert.rejects(root.__radarStandardSources.readRfcContext('2026'),/denied/);await assert.rejects(root.__radarStandardSources.load('omg-specifications'),/denied/);assert.equal(calls,0);await assert.rejects(api.load('omg-specifications'),/source/i);
});
test('S16 OMG version identity is versioned, keeps beta variant, rejects external and mutable URLs',()=>{
 assert.equal(versionIdentity('/spec/SysML/1.4').sourceKey,'SysML/1.4');assert.equal(metadataIdentity(PILOT[1]).sourceKey,'C2MS/1.2/Beta1');assert.equal(metadataIdentity(PILOT[0]).metadataUrl,PILOT[0]);
 for(const x of ['https://evil.example/spec/SysML/1.4/About-SysML.jsonld','https://www.omg.org/spec/SysML/About-SysML.jsonld','https://www.omg.org/spec/SysML/1.4/About-UML.jsonld','https://www.omg.org/spec/SysML/1.4/PDF','https://www.omg.org/spec/SysML/1.4/About-SysML.jsonld?x=1'])assert.throws(()=>allowedUrl(x));
});
test('S16 OMG index extracts one record per publication and distinct ISO relations without guessing equivalence',()=>{
 const result=parseOmgCatalog(html,{acquiredAt:stamp,sourceDigest:'test'});assert.equal(result.records.length,2);assert.equal(result.isoAdoptions.length,1);assert.equal(result.records[0].title,'Example & Model');assert.equal(result.records[0].publicationDate,'2020-08');assert.equal(result.records[1].sourceKey,'EXAMPLE/1.0/Beta2');assert.deepEqual(result.isoAdoptions[0].isoDesignations,['12345-1:2022','12345-2:2022']);assert.equal(result.isoAdoptions[0].subject.sourceKey,'EXAMPLE/1.0');assert.equal(result.isoAdoptions[0].relationType,'omg-reports-iso-adoption');assert.equal(result.coverage.complete,true);assert.equal(result.distribution,'private-only');
});
test('S16 OMG index rejects changed table shape and flags unrecognized rows instead of claiming completeness',()=>{
 assert.throws(()=>parseOmgCatalog('<html>not a catalog</html>'),/No recognized/);const partial=parseOmgCatalog(table(indexHead,[row,['missing','x','<a href="/spec/X">latest</a>','formal','August 2020']])+table(isoHead,[adoption]));assert.equal(partial.coverage.complete,false);assert.equal(partial.coverage.rejected.length,1);
});
test('S16 OMG JSON-LD syntax discovery never expands contexts or guesses field meanings',()=>{
 const result=inspectJsonLd({'@context':'https://example.invalid/context','@graph':[{'@id':'x','@type':'T',p:'value'}]},PILOT[0]);assert.equal(result.syntax.expanded,false);assert.deepEqual(result.syntax.contexts,['https://example.invalid/context']);assert.deepEqual(result.syntax.types,['T']);assert.equal(result.mapping,'pending-observed-vocabulary');assert.throws(()=>inspectJsonLd({html:'not ld'},PILOT[0]),/no JSON-LD/);
});
test('S16 OMG acquisition requires an explicit scoped basis before fetch or disk write',async()=>{
 let calls=0;const fetcher=async()=>{calls++;throw Error('unexpected');};await assert.rejects(acquireOmg({urls:[CATALOG],rights:null,outputParent:os.tmpdir(),fetcher}),/basis/);await assert.rejects(acquireOmg({urls:[CATALOG],rights:rights(PILOT),outputParent:os.tmpdir(),fetcher}),/outside documented scope/);assert.equal(calls,0);assert.throws(()=>authorize({...rights(),basis:'personal-noncommercial-single-copy',purpose:'product'},[CATALOG]),/not applicable/);
});
test('S16 OMG authorized acquisition is bounded, sequential, private and hashes actual bytes',async()=>{
 const parent=await fs.mkdtemp(path.join(os.tmpdir(),'s16-test-'));try{const calls=[],pauses=[];const report=await acquireOmg({urls:[CATALOG,PILOT[0]],rights:rights(),outputParent:parent,wait:async n=>pauses.push(n),fetcher:async(url,o)=>{calls.push(url);assert.equal(o.redirect,'error');assert.equal(o.credentials,'omit');return url===CATALOG?response(html,'text/html; charset=utf-8'):response(ld);}});assert.equal(report.ok,true);assert.deepEqual(calls,[CATALOG,PILOT[0]]);assert.deepEqual(pauses,[2000]);assert.equal(report.records.length,2);assert.equal(report.records[0].result.count,2);assert.equal(report.records[1].result.mapping,'pending-observed-vocabulary');assert.equal(report.redistribution,false);assert.match(report.records[0].sha256,/^[a-f0-9]{64}$/);assert.equal((await fs.stat(path.join(report.directory,'catalog.html'))).mode&0o777,0o600);assert.equal(JSON.parse(await fs.readFile(path.join(report.directory,'report.json'),'utf8')).ok,true);}finally{await fs.rm(parent,{recursive:true,force:true});}
});
test('S16 OMG acquisition stops on rate limit and persists failure without further requests',async()=>{
 const parent=await fs.mkdtemp(path.join(os.tmpdir(),'s16-test-'));try{let n=0;const report=await acquireOmg({urls:PILOT,rights:rights(),outputParent:parent,wait:async()=>{},fetcher:async()=>{n++;return new Response('',{status:429});}});assert.equal(n,1);assert.equal(report.ok,false);assert.match(report.errors[0],/429/);assert.equal(JSON.parse(await fs.readFile(path.join(report.directory,'report.json'),'utf8')).ok,false);}finally{await fs.rm(parent,{recursive:true,force:true});}
});


test('S16-R2 local OMG HTML and normalized JSON share parser, identities and provenance; invalid input preserves active generation',async()=>{
 api.clearOmg();await api.importOmg(html,{format:'html'});const first=api.omgStatus();assert.equal(first.count,2);assert.equal(first.origin,'local-unverified');assert.equal(first.acquiredAt,null);assert.equal(first.storage,'session-only');assert.deepEqual(api.searchOmg('12345').rows[0].isoAdoptions,['12345-1:2022','12345-2:2022']);
 const snapshot=parseOmgCatalog(html,{acquiredAt:stamp,sourceDigest:'a'.repeat(64)});await api.importOmg(JSON.stringify(snapshot));const second=api.omgStatus();assert.ok(second.generation>first.generation);assert.equal(second.acquiredAt,stamp);assert.equal(second.origin,'local-unverified');
 const invalid=JSON.parse(JSON.stringify(snapshot));invalid.records[0].url='https://evil.example/spec/EXAMPLE/1.0';await assert.rejects(api.importOmg(JSON.stringify(invalid)),/OMG URL|identity/);assert.equal(api.omgStatus().generation,second.generation);api.clearOmg();assert.equal(api.omgStatus(),null);
});
test('S16-R3 browser OMG import does not require acquisition authorization or make network requests',async()=>{
 assert.equal(api.loadOmg,undefined);assert.equal(api.omg.authorize,undefined);await api.clearOmg();await api.importOmg(html,{format:'html'});assert.equal(api.omgStatus().distribution,'private-only');await api.clearOmg();assert.equal(await api.restoreOmg(),null);
});

test('S16-R2 OMG ISO adoptions retain older versions absent from current specification index',async()=>{
 const older=['Historical Example','<a href="/spec/EXAMPLE/0.9">0.9</a>','12344:2005','formal/05-01-01'];
 const input=table(indexHead,[row,beta])+table(isoHead,[adoption,older]);api.clearOmg();await api.importOmg(input,{format:'html'});assert.equal(api.omgStatus().count,2);assert.equal(api.omgStatus().adoptionCount,2);const result=api.searchOmg('12344',0,true);assert.equal(result.total,1);assert.equal(result.rows[0].key,'EXAMPLE/0.9');assert.equal(result.rows[0].title,'Historical Example');assert.equal(result.rows[0].status,null);assert.deepEqual(result.rows[0].isoAdoptions,['12344:2005']);assert.equal(api.searchOmg('12344').total,0);api.clearOmg();
});

// Small asynchronous IndexedDB contract double, shared across VM instances.
function memoryDatabase(){const records=new Map();const db={transaction(){const tx={objectStore(){return {put(v,k){return request(()=>{records.set(k,JSON.parse(JSON.stringify(v)));return k;});},get(k){return request(()=>records.get(k));},delete(k){return request(()=>records.delete(k));}};}};function request(fn){const q={};queueMicrotask(()=>{q.result=fn();q.onsuccess?.();tx.oncomplete?.();});return q;}return tx;}};return {records,indexedDB:{open(){const q={result:db};queueMicrotask(()=>q.onsuccess?.());return q;}}};}
async function browserApi(indexedDB,viewer=false,{href='https://example.test/radar.html',fetcher=async()=>{throw Error('No network in OMG browser');}}={}){const code=await fs.readFile(new URL('../js/radar-standard-sources.js',import.meta.url),'utf8');const root={indexedDB,location:{href},crypto:webcrypto,__radarApplicationProfile:{viewer,require(){}},fetch:fetcher};vm.runInNewContext(code,{window:root,URL,TextEncoder,TextDecoder,AbortSignal,console});return root.__radarStandardSources;}
test('S16-R3 private corpus survives a new browser service, clear deletes only OMG cache',async()=>{
 const db=memoryDatabase();db.records.set('rfc-editor',{sentinel:true});const a=await browserApi(db.indexedDB);await a.importOmg(html,{format:'html'});assert.equal(a.omgStatus().storage,'browser-cache');const b=await browserApi(db.indexedDB);assert.equal(b.omgStatus(),null);await b.restoreOmg();assert.equal(b.omgStatus().count,2);assert.equal(b.searchOmg('12345',0,true).total,1);assert.equal(b.omgStatus().origin,'local-unverified');await b.clearOmg();const c=await browserApi(db.indexedDB);assert.equal(await c.restoreOmg(),null);assert.equal(db.records.get('rfc-editor').sentinel,true);const viewer=await browserApi(db.indexedDB,true);await assert.rejects(viewer.restoreOmg(),/denied/);
});
test('S16-R3 invalid replacement preserves the cached corpus and clear supersedes pending import',async()=>{
 const db=memoryDatabase();const a=await browserApi(db.indexedDB);await a.importOmg(html,{format:'html'});const gen=a.omgStatus().generation;await assert.rejects(a.importOmg('{}'),/Invalid/);assert.equal(a.omgStatus().generation,gen);const b=await browserApi(db.indexedDB);await b.restoreOmg();assert.equal(b.omgStatus().count,2);const pending=a.importOmg(html,{format:'html'});const deletion=a.clearOmg();await assert.rejects(pending,/superseded/);await deletion;assert.equal(a.omgStatus(),null);assert.equal(await (await browserApi(db.indexedDB)).restoreOmg(),null);
});
test('S16-R3 offline collector produces an importable private corpus and coverage report',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'omg-prepare-test-'));try{const input=path.join(dir,'catalog.html');await fs.writeFile(input,html);const r=await prepareOmgCatalog({input,outputParent:dir});assert.equal(r.ok,true);assert.equal(r.network,false);assert.equal(r.records,2);assert.equal(r.adoptions,1);assert.equal(r.distribution,'private-only');assert.equal((await fs.stat(r.file)).mode&0o777,0o600);const content=await fs.readFile(r.file,'utf8');await api.importOmg(content);assert.equal(api.omgStatus().count,2);await api.clearOmg();assert.equal(JSON.parse(await fs.readFile(path.join(r.directory,'report.json'),'utf8')).sourceDigest,r.sourceDigest);}finally{await fs.rm(dir,{recursive:true,force:true});}
});

// R3.1: online public index. Synthetic tables remain explicitly non-official fixtures.
const onlineHtml=html;
const htmlResponse=(value=onlineHtml)=>response(value,'text/html; charset=utf-8');
const hash=value=>createHash('sha256').update(value).digest('hex');

test('S16-R3.1 nested OMG publication identities preserve FIBO families without guessing nested metadata URLs',()=>{
 for(const [part,version] of [['BE','1.1'],['FBC','1.0'],['FND','1.2'],['IND','1.0']]){
   const key='EDMC-FIBO/'+part+'/'+version;const id=versionIdentity('/spec/'+key);assert.equal(id.sourceKey,key);assert.equal(id.acronym,'EDMC-FIBO/'+part);
   const r=['Synthetic FIBO fixture','EDMC-FIBO/'+part,`<a href="/spec/${key}">${version}</a>`,'formal','January 2018'];const result=parseOmgCatalog(table(indexHead,[r])+table(isoHead,[adoption]));assert.equal(result.records[0].sourceKey,key);assert.equal(result.coverage.rejected.length,0);
 }
 assert.throws(()=>metadataIdentity('https://www.omg.org/spec/EDMC-FIBO/BE/1.1/About-BE.jsonld'));
});
test('S16-R3.1 online catalog verifies table totals, full and recent lists, and keeps distinct historical adoption rows',async()=>{
 const full=table(indexHead,[row,beta]).replace('</tbody>','<tr><td colspan="5">Total: 2</td></tr></tbody>');const recent=table(indexHead,[beta]);const all=full+recent+table(isoHead,[adoption]);
 const good=parseOmgCatalog(all,{acquiredAt:stamp,sourceDigest:'a'.repeat(64)});assert.equal(good.coverage.complete,true);assert.equal(good.coverage.tables[0].declaredTotal,2);assert.equal(good.records.length,2);api.validateOmgOnlineSnapshot(good);
 const bad=parseOmgCatalog(all.replace('Total: 2','Total: 3'),{acquiredAt:stamp,sourceDigest:'a'.repeat(64)});assert.equal(bad.coverage.complete,false);assert.match(bad.coverage.rejected[0].reason,/Declared total/);assert.throws(()=>api.validateOmgOnlineSnapshot(bad),/coverage incomplete/);
 await assert.rejects(api.readOmgPublicCatalog({fetcher:async()=>htmlResponse(recent+table(isoHead,[adoption]))}),/coverage incomplete/);
});
test('S16-R3.1 direct public acquisition fetches exactly the official index, validates content and hashes response bytes',async()=>{
 let n=0;const snapshot=await api.readOmgPublicCatalog({fetcher:async(url,opts)=>{n++;assert.equal(url,CATALOG);assert.equal(opts.method,'GET');assert.equal(opts.credentials,'omit');assert.equal(opts.redirect,'error');assert.equal(opts.mode,'cors');assert.equal(opts.headers.Accept,'text/html');return htmlResponse();}});
 assert.equal(n,1);assert.equal(snapshot.provenance.url,CATALOG);assert.equal(snapshot.provenance.sha256,hash(onlineHtml));assert.equal(snapshot.records.length,2);assert.equal(snapshot.isoAdoptions.length,1);assert.equal(snapshot.distribution,'private-only');
 await assert.rejects(api.readOmgPublicCatalog({fetcher:async()=>response('{}','application/json')}),/content type/);
 await assert.rejects(api.readOmgPublicCatalog({fetcher:async()=>new Response('',{status:429})}),/429/);
 await assert.rejects(api.readOmgPublicCatalog({fetcher:async()=>new Response('x',{headers:{'content-type':'text/html','content-length':String(api.omg.LIMIT+1)}})}),/size limit/);
});
test('S16-R3.1 explicit browser online refresh restores origin and preserves last complete corpus after failure',async()=>{
 const db=memoryDatabase();const a=await browserApi(db.indexedDB);let calls=0;
 await a.loadOmgOnline({fetcher:async u=>{calls++;assert.equal(u,CATALOG);return htmlResponse();}});assert.equal(calls,1);assert.equal(a.omgStatus().origin,'official-fetch');assert.equal(a.omgStatus().storage,'browser-cache');const first=a.omgStatus();
 await assert.rejects(a.loadOmgOnline({fetcher:async()=>htmlResponse('<html>not an index</html>')}),/No recognized/);assert.equal(a.omgStatus().generation,first.generation);
 const b=await browserApi(db.indexedDB);await b.restoreOmg();assert.equal(b.omgStatus().origin,'official-fetch');assert.equal(b.omgStatus().sha256,hash(onlineHtml));assert.equal(b.omgStatus().count,2);
 const imported=parseOmgCatalog(onlineHtml,{acquiredAt:stamp,sourceDigest:'a'.repeat(64)});imported.provenance.localOrigin='official-fetch';await b.importOmg(JSON.stringify(imported));assert.equal(b.omgStatus().origin,'local-unverified');const c=await browserApi(db.indexedDB);await c.restoreOmg();assert.equal(c.omgStatus().origin,'local-unverified');
 const viewer=await browserApi(db.indexedDB,true);await assert.rejects(viewer.loadOmgOnline({fetcher:async()=>{throw Error('Unexpected network');}}),/denied/);await assert.rejects(viewer.loadOmgPrepared(),/denied/);
});
test('S16-R3.1 online refresh cannot resurrect a corpus cleared during acquisition',async()=>{
 const db=memoryDatabase();const a=await browserApi(db.indexedDB);let resolve;const deferred=new Promise(r=>resolve=r);const pending=a.loadOmgOnline({fetcher:async()=>deferred});await a.clearOmg();resolve(htmlResponse());await assert.rejects(pending,/superseded/);assert.equal(a.omgStatus(),null);assert.equal(await (await browserApi(db.indexedDB)).restoreOmg(),null);
});
test('S16-R3.1 loopback relay supplies prepared and refreshed corpus; absent relay alone falls back to CORS',async()=>{
 const db=memoryDatabase(),a=await browserApi(db.indexedDB,false,{href:'http://127.0.0.1:5174/radar.html'});const snapshot=parseOmgCatalog(onlineHtml,{acquiredAt:stamp,sourceDigest:hash(onlineHtml)});const calls=[];
 const relay=async(u,o)=>{calls.push(u);assert.equal(o.method,'POST');assert.equal(o.headers['X-Radar-Documentary'],'omg-index-v1');return response(JSON.stringify({operation:'S16-OMG-LOCAL-RELAY',ok:true,snapshot}),'application/json');};
 assert.equal(a.omgHasLocalRelay(),true);await a.loadOmgPrepared({fetcher:relay});assert.equal(a.omgStatus().origin,'local-prepared');await a.loadOmgOnline({fetcher:relay});assert.equal(a.omgStatus().origin,'local-relay');assert.deepEqual(calls,['http://127.0.0.1:5174'+OMG_RELAY_PREFIX+'current','http://127.0.0.1:5174'+OMG_RELAY_PREFIX+'refresh']);
 let n=0;await a.loadOmgOnline({fetcher:async(u)=>{n++;return u===CATALOG?htmlResponse():new Response('missing',{status:404,headers:{'content-type':'text/plain'}});}});assert.equal(n,2);assert.equal(a.omgStatus().origin,'official-fetch');const first=a.omgStatus();
 n=0;await assert.rejects(a.loadOmgOnline({fetcher:async()=>{n++;return new Response(JSON.stringify({operation:'S16-OMG-LOCAL-RELAY',ok:false,error:'OMG upstream rate limited'}),{status:502,headers:{'content-type':'application/json'}});}}),/rate limited/);assert.equal(n,1);assert.equal(a.omgStatus().generation,first.generation);
});
test('S16-R3.1 online collector writes private normalized corpus and leaves it unchanged after partial response',async()=>{
 const parent=await fs.mkdtemp(path.join(os.tmpdir(),'omg-online-test-'));try{const cacheFile=path.join(parent,'current.json');const audit=path.join(parent,'audit');await fs.mkdir(audit);const alias=path.join(parent,'audit-alias');await fs.symlink(audit,alias,'dir');let calls=0;const first=await collectOmgCurrent({cacheFile,outputParent:alias,fetcher:async(u)=>{calls++;assert.equal(u,CATALOG);return htmlResponse();}});assert.equal(calls,1);assert.equal(first.auditFile,path.join(await fs.realpath(audit),'omg-catalog.json'));assert.equal(first.current,path.join(await fs.realpath(parent),'current.json'));assert.equal(first.snapshot.records.length,2);assert.equal((await fs.stat(cacheFile)).mode&0o777,0o600);assert.equal((await fs.stat(first.auditFile)).mode&0o777,0o600);const before=await fs.readFile(cacheFile,'utf8');assert.equal(await fs.readFile(first.auditFile,'utf8'),before);assert.equal((await readPreparedOmg({cacheFile})).provenance.sha256,hash(onlineHtml));
 await assert.rejects(collectOmgCurrent({cacheFile,fetcher:async()=>htmlResponse(table(indexHead,[row]))}),/coverage incomplete/);assert.equal(await fs.readFile(cacheFile,'utf8'),before);assert.deepEqual((await fs.readdir(parent)).sort(),['audit','audit-alias','current.json']);
 }finally{await fs.rm(parent,{recursive:true,force:true});}
});
test('S16-R3.1 local HTTP relay admits only explicit same-origin fixed-index requests and never forwards arbitrary URLs',async()=>{
 const parent=await fs.mkdtemp(path.join(os.tmpdir(),'omg-relay-test-'));const cacheFile=path.join(parent,'current.json');let calls=0,t=1000,fail=false;
 const middleware=createOmgRelayMiddleware({cacheFile,clock:()=>t,minIntervalMs:1000,fetcher:async(u)=>{calls++;assert.equal(u,CATALOG);return fail?new Response('',{status:429}):htmlResponse();}});
 const server=createServer((req,res)=>{void middleware(req,res,()=>{res.statusCode=404;res.end('not handled');});});
 try{await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});const origin='http://127.0.0.1:'+server.address().port;
 const headers={Origin:origin,'X-Radar-Documentary':'omg-index-v1'};const call=(action,options={})=>fetch(origin+OMG_RELAY_PREFIX+action,{method:'POST',headers,...options});
 assert.equal((await call('refresh',{headers:{...headers,Origin:'https://evil.example'}})).status,403);assert.equal((await call('refresh',{method:'GET'})).status,403);assert.equal((await call('refresh',{headers:{Origin:origin}})).status,403);assert.equal((await call('refresh?url=https://evil.example')).status,404);assert.equal((await call('refresh',{body:'x'})).status,403);assert.equal(calls,0);
 assert.equal((await call('current')).status,404);const live=await call('refresh');assert.equal(live.status,200);assert.equal(live.headers.get('access-control-allow-origin'),null);assert.equal((await live.json()).snapshot.records.length,2);assert.equal(calls,1);
 assert.equal((await call('current')).status,200);assert.equal(calls,1);assert.equal((await call('refresh')).status,429);assert.equal(calls,1);t+=2000;fail=true;assert.equal((await call('refresh')).status,502);assert.equal(calls,2);assert.equal((await (await call('current')).json()).snapshot.records.length,2);
 }finally{if(server.listening)await new Promise(resolve=>server.close(resolve));await fs.rm(parent,{recursive:true,force:true});}
});

// R4: historical editions, not just the current OMG catalog index.
const umlHistoryHtml=table(['Version','Adoption Date','URL'],[
 ['2.5.1','December 2017','<a href="https://www.omg.org/spec/UML/2.5.1">2.5.1</a>'],
 ['2.4.1','July 2011','<a href="/spec/UML/2.4.1">2.4.1</a>'],
 ['2.3','May 2010','<a href="/spec/UML/2.3">2.3</a>'],
 ['1.4','September 2001','<a href="/spec/UML/1.4">1.4</a>']
]);
test('R4 official formal history yields distinct retained edition identities, never deduced obsolescence',()=>{
 const h=api.omg.parseOmgHistory(umlHistoryHtml,'UML',{acquiredAt:stamp,sourceDigest:'a'.repeat(64)});
 assert.equal(h.records.length,4);assert.equal(h.coverage.scope,'formal versions listed for this family; not operational applicability');
 assert.deepEqual(h.records.map(x=>x.key),['UML/2.5.1','UML/2.4.1','UML/2.3','UML/1.4']);
 assert.equal(h.records[1].publicationDate,'2011-07');assert.equal(h.records[3].status,'formal');
 assert.ok(!('operationalApplicability' in h.records[3]));
});
test('R4 history parser fails closed for malformed or foreign historical links',()=>{
 for(const bad of [
  table(['Version','Adoption Date','URL'],[['2.4.1','July 2011','<a href="https://evil.invalid/spec/UML/2.4.1">2.4.1</a>']]),
  table(['Version','Adoption Date','URL'],[['2.4.1','July 2011','<a href="/spec/SysML/2.4.1">2.4.1</a>']]),
  table(['Version','Adoption Date','URL'],[['2.4.1','July 2011','<a href="/spec/UML/2.3">2.3</a>']]),
  '<html>No History table</html>'
 ])assert.throws(()=>api.omg.parseOmgHistory(bad,'UML'),/Incomplete/);
 assert.throws(()=>api.omg.familyUrl('../UML'),/Invalid/);
 assert.equal(api.omg.familyUrl('EDMC-FIBO/BE'),'https://www.omg.org/spec/EDMC-FIBO/BE/');
});
test('R4 online history fetch validates official family URL and MIME and returns dated evidence',async()=>{
 let calls=0;const h=await api.readOmgHistory('UML',{fetcher:async(u,options)=>{
  calls++;assert.equal(u,'https://www.omg.org/spec/UML/');assert.equal(options.credentials,'omit');return response(umlHistoryHtml,'text/html');
 }});assert.equal(calls,1);assert.equal(h.records.length,4);assert.equal(h.provenance.url,'https://www.omg.org/spec/UML/');
 await assert.rejects(api.readOmgHistory('UML',{fetcher:async()=>response('{}','application/json')}),/response/);
});
test('R4 session and IndexedDB keep old editions separately from the current OMG index',async()=>{
 const db=memoryDatabase();
 // Standard service under a fresh browser context; the live index is not overwritten.
 const a=await browserApi(db.indexedDB);await a.importOmg(html,{format:'html'});const before=a.omgStatus().count;
 let calls=0;await a.loadOmgHistory('UML',{fetcher:async()=>{calls++;return response(umlHistoryHtml,'text/html');}});
 assert.equal(calls,1);assert.equal(a.searchOmgHistory('UML').total,4);assert.equal(a.omgStatus().count,before);
 const b=await browserApi(db.indexedDB);assert.equal(b.omgHistoryStatus('UML'),null);await b.restoreOmgHistory('UML');
 assert.equal(b.searchOmgHistory('UML','2.4.1').rows[0].key,'UML/2.4.1');
 assert.equal(b.selectedOmgHistory('UML','UML/1.4',b.omgHistoryStatus('UML').generation).edition,'1.4');
 assert.throws(()=>b.selectedOmgHistory('UML','UML/1.4',-1),/Stale/);
 await b.clearOmg();assert.equal(b.searchOmgHistory('UML').total,4); // history retained independently
});
test('R4 rejected partial history update preserves previously acquired family editions',async()=>{
 const db=memoryDatabase(),a=await browserApi(db.indexedDB);
 await a.loadOmgHistory('UML',{fetcher:async()=>response(umlHistoryHtml,'text/html')});
 const original=a.omgHistoryStatus('UML').generation;
 await assert.rejects(a.loadOmgHistory('UML',{refresh:true,fetcher:async()=>response('<html>partial</html>','text/html')}),/Incomplete/);
 assert.equal(a.omgHistoryStatus('UML').generation,original);
 assert.equal(a.searchOmgHistory('UML').total,4);
});
test('R4 nested OMG family identities can carry formal history',()=>{
 const h=api.omg.parseOmgHistory(table(['Version','Adoption Date','URL'],[['1.1','January 2017','<a href="/spec/EDMC-FIBO/BE/1.1">1.1</a>']]),'EDMC-FIBO/BE');
 assert.equal(h.records[0].key,'EDMC-FIBO/BE/1.1');
});
test('R4 Creator exposes history and version-specific import, not automatic newest replacement',async()=>{
 const panel=await fs.readFile(new URL('../js/radar-standards-panel.js',import.meta.url),'utf8');
 const owner=await fs.readFile(new URL('../js/radar-catalog-persistence.js',import.meta.url),'utf8');
 assert.match(panel,/loadOmgHistory\(row\.acronym\)/);
 assert.match(panel,/importOmgReference\(row\.key,documentResult\.generation/);
 assert.match(owner,/function importOmgReference/);
 assert.match(owner,/var id='omg:'\+key/);
 assert.match(owner,/existing reference; reconcile explicitly/);
 assert.ok(!owner.includes('autoLatestOmg'));
});

async function r4Owner(sources,standards=[]){
 const root={crypto:webcrypto,__radarStandardSources:sources,__radarApplicationProfile:{viewer:false,require(){},assertCatalog(){} }};
 const code=await fs.readFile(new URL('../js/radar-catalog-persistence.js',import.meta.url),'utf8');
 vm.runInNewContext(code,{window:root,Date,URL});
 root.__radarCatalogPersistence.remember({schemaVersion:'1.0.0',title:'R4 synthetic',organizations:[],portfolios:[],standards,assessments:[],radarRevisions:[]},{revisions:[]});
 return root.__radarCatalogPersistence;
}
test('R4 native import retains multiple OMG editions and selected historical identities',async()=>{
 const provider=await browserApi(memoryDatabase().indexedDB);await provider.loadOmgHistory('UML',{fetcher:async()=>response(umlHistoryHtml,'text/html')});
 const owner=await r4Owner(provider),g=provider.omgHistoryStatus('UML').generation;
 const a=owner.importOmgReference('UML/2.4.1',g,{family:'UML'});
 const b=owner.importOmgReference('UML/1.4',g,{family:'UML'});
 assert.deepEqual([a.standardId,b.standardId],['omg:UML/2.4.1','omg:UML/1.4']);
 const records=owner.listReferenceRecords();assert.equal(records.length,2);
 assert.equal(records[0].editionDesignation,'2.4.1');assert.equal(records[1].editionDesignation,'1.4');
 assert.equal(records[0].externalDocument.historyEvidence,'https://www.omg.org/spec/UML/');
 assert.equal(records[1].verification,'source-verified');
 assert.equal(owner.importOmgReference('UML/2.4.1',g,{family:'UML'}).action,'existing');
 assert.equal(owner.listReferenceRecords().length,2);
});
test('R4 native import refuses stale selection and conflicts without changing catalog',async()=>{
 const provider=await browserApi(memoryDatabase().indexedDB);await provider.loadOmgHistory('UML',{fetcher:async()=>response(umlHistoryHtml,'text/html')});
 const owner=await r4Owner(provider,[{standardId:'manual',name:'UML version 1.4',extensions:{referenceDeclaration:{issuer:'OMG',designation:'UML',editionDesignation:'1.4',origin:'manual',verification:'unverified'}}}]);
 const g=provider.omgHistoryStatus('UML').generation;
 assert.throws(()=>owner.importOmgReference('UML/2.4.1',g+1,{family:'UML'}),/Stale/);
 assert.throws(()=>owner.importOmgReference('UML/1.4',g,{family:'UML'}),/conflict/i);
 assert.equal(owner.listReferenceRecords().length,1);
 assert.equal(owner.importOmgReference('UML/2.4.1',g,{family:'UML'}).standardId,'omg:UML/2.4.1');
});
test('R4 viewer profile cannot mutate OMG catalog even with an already selected edition',async()=>{
 const provider=await browserApi(memoryDatabase().indexedDB);await provider.loadOmgHistory('UML',{fetcher:async()=>response(umlHistoryHtml,'text/html')});
 const owner=await r4Owner(provider);const g=provider.omgHistoryStatus('UML').generation;
 assert.equal(owner.listReferenceRecords().length,0);
 // Source selection itself is read-only and must require the same Creator capability.
 assert.throws(()=>provider.selectedOmgHistory('UML','UML/1.4',g+1),/Stale/);
 assert.equal(owner.listReferenceRecords().length,0);
});
test('R4 local HTTP relay serves only indexed OMG family histories, not arbitrary paths',async()=>{
 const parent=await fs.mkdtemp(path.join(os.tmpdir(),'omg-history-relay-'));
 const cacheFile=path.join(parent,'current.json');
 const catalog=api.omg.parseOmgCatalog(table(indexHead,[['Unified Modeling Language','UML','<a href="/spec/UML/2.5.1">2.5.1</a>','formal','December 2017']])+table(indexHead,[['Unified Modeling Language','UML','<a href="/spec/UML/2.5.1">2.5.1</a>','formal','December 2017']])+table(isoHead,[['Unified Modeling Language','<a href="/spec/UML/2.4.1">2.4.1</a>','19505-1:2012','formal/12-01-01']]),{acquiredAt:stamp,sourceDigest:'a'.repeat(64)});
 await fs.writeFile(cacheFile,JSON.stringify(catalog));let calls=0;
 const catalogHtml=table(indexHead,[['Unified Modeling Language','UML','<a href="/spec/UML/2.5.1">2.5.1</a>','formal','December 2017']])+table(indexHead,[['Unified Modeling Language','UML','<a href="/spec/UML/2.5.1">2.5.1</a>','formal','December 2017']])+table(isoHead,[['Unified Modeling Language','<a href="/spec/UML/2.4.1">2.4.1</a>','19505-1:2012','formal/12-01-01']]);
 const middleware=createOmgRelayMiddleware({cacheFile,minIntervalMs:15000,clock:()=>1000,fetcher:async(url)=>{calls++;if(url===CATALOG)return response(catalogHtml,'text/html');assert.equal(url,'https://www.omg.org/spec/UML/');return response(umlHistoryHtml,'text/html');}});
 const server=createServer((req,res)=>{void middleware(req,res,()=>{res.statusCode=404;res.end('not handled');});});
 try{
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  const origin='http://127.0.0.1:'+server.address().port,headers={Origin:origin,'X-Radar-Documentary':'omg-index-v1'};
  const req=path=>fetch(origin+OMG_RELAY_PREFIX+path,{method:'POST',headers});
  assert.equal((await req('history/OtherFamily')).status,422);
  assert.equal((await req('history/..')).status,404); // Node URL resolves literal dot segment outside fixed endpoint
  assert.equal((await req('history/UML%252Fbad')).status,422);
  assert.equal(calls,0);
  // A user can open History immediately after pressing Refresh OMG index;
  // separate acquisition classes share serialization but not the cooldown.
  assert.equal((await req('refresh')).status,200);assert.equal(calls,1);
  const successful=await req('history/UML');assert.equal(successful.status,200);
  const body=await successful.json();assert.equal(body.ok,true);assert.equal(body.snapshot.family,'UML');assert.equal(body.snapshot.records.length,4);assert.equal(calls,2);
  assert.equal((await req('history/UML')).status,429);assert.equal((await req('refresh')).status,429);assert.equal(calls,2);
  assert.equal((await req('history/UML/2.4.1')).status,422);
 }finally{if(server.listening)await new Promise(resolve=>server.close(resolve));await fs.rm(parent,{recursive:true,force:true});}
});
