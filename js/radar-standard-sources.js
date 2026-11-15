/* S15-B: optional external documentary sources. The native catalog is not a cache.
 * Classic script shared by the Creator and the Node acquisition tool. No startup I/O.
 */
(function(root){
 'use strict';
 const descriptors=Object.freeze([
   Object.freeze({id:'iso-open-data',label:'ISO Open Data',kind:'installed-iso'}),
   Object.freeze({id:'rfc-editor',label:'RFC Editor',kind:'documents'}),
   Object.freeze({id:'w3c',label:'W3C',kind:'series'})
 ]);
 const RFC='https://www.rfc-editor.org/rfc-index.xml', W3C='https://api.w3.org/specifications';
 const MAX_XML=32*1024*1024, MAX_ROWS=30000, MAX_JSON=12*1024*1024;
 const text=(v)=>typeof v==='string'?v.trim():'';
 const clean=(v,max=500)=>{const s=text(v);if(!s||s.length>max)throw Error('Invalid source field');return s;};
 const norm=v=>String(v??'').normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
 const copy=v=>JSON.parse(JSON.stringify(v));
 const validSource=id=>id==='rfc-editor'||id==='w3c';
 const safeShortname=s=>typeof s==='string'&&/^[A-Za-z0-9][A-Za-z0-9._+-]{0,149}$/.test(s)&&s!=='.'&&s!=='..';
 const validTime=s=>typeof s==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(s)&&Number.isFinite(Date.parse(s));
 const now=()=>new Date().toISOString();
 function requireAuthor(){if(root.__radarApplicationProfile?.viewer)throw Error('Source acquisition denied');root.__radarApplicationProfile?.require('catalog.declareReference');}
 function validDate(s){return /^\d{4}-\d\d-\d\d$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;}
 const monthNames=['January','February','March','April','May','June','July','August','September','October','November','December'];
 function rfcRecord(raw){
   const match=/^RFC\s*0*([1-9]\d{0,5})$/i.exec(text(raw.docId));if(!match)throw Error('Invalid RFC identifier');
   const n=match[1],year=text(raw.year),month=monthNames.findIndex(m=>m.toLowerCase()===text(raw.month).toLowerCase());
   if(!/^\d{4}$/.test(year))throw Error('Invalid RFC publication year');
   const stream=text(raw.stream),streamKey=stream.toLowerCase();
   // A RFC is not necessarily a standards-track publication, or even from the IETF stream.
   const issuer=streamKey==='ietf'||streamKey.startsWith('ietf ')?'IETF':streamKey==='iab'||streamKey.startsWith('iab ')?'IAB':streamKey==='irtf'||streamKey.startsWith('irtf ')?'IRTF':streamKey.includes('independent')?'Independent Submission':streamKey.includes('editorial')?'Editorial Stream':'RFC Series';
   return {sourceId:'rfc-editor',key:n,issuer,designation:'RFC '+n,title:clean(raw.title,2000),edition:year+(month>=0?'-'+String(month+1).padStart(2,'0'):''),status:text(raw.status)||null,stream:stream||null,url:'https://www.rfc-editor.org/rfc/rfc'+n};
 }
 // Raw XML entry count for acquisition reports; browser DOM validation remains authoritative.
 function countRfcEntries(xml){
   if(typeof xml!=='string'||xml.length>MAX_XML||/<!DOCTYPE|<!ENTITY/i.test(xml))throw Error('Invalid RFC XML index');
   const markup=xml.replace(/<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<\?[\s\S]*?\?>/g,'');
   const count=(markup.match(/<(?:[A-Za-z_][\w.-]*:)?rfc-entry(?=[\s/>])/g)||[]).length;
   if(!count||count>MAX_ROWS)throw Error('Invalid RFC index size');return count;
 }
 function parseRfcIndex(xml,Parser=root.DOMParser){
   if(typeof xml!=='string'||xml.length>MAX_XML||/<!DOCTYPE|<!ENTITY/i.test(xml)||typeof Parser!=='function')throw Error('Invalid RFC XML index');
   const doc=new Parser().parseFromString(xml,'application/xml');
   if(doc.getElementsByTagName('parsererror').length||doc.documentElement?.localName!=='rfc-index')throw Error('Invalid RFC XML index');
   const children=(el,name)=>Array.from(el?.children||[]).filter(n=>n.localName===name),value=(el,name)=>text(children(el,name)[0]?.textContent);
   const entries=children(doc.documentElement,'rfc-entry');if(!entries.length||entries.length>MAX_ROWS)throw Error('Invalid RFC index size');
   const rows=entries.map(el=>{const date=children(el,'date')[0];return rfcRecord({docId:value(el,'doc-id'),title:value(el,'title'),year:value(date,'year'),month:value(date,'month'),stream:value(el,'stream'),status:value(el,'current-status')||value(el,'publication-status')});});
   unique(rows);return rows;
 }
 function w3cLink(link){
   const href=text(link?.href||link?._links?.self?.href),title=clean(link?.title,2000);
   const match=/^https:\/\/api\.w3\.org\/specifications\/([A-Za-z0-9][A-Za-z0-9._+-]{0,149})\/?$/.exec(href);
   if(!match||!safeShortname(match[1]))throw Error('Invalid W3C specification link');
   return {sourceId:'w3c',key:match[1],issuer:'W3C',designation:match[1],title};
 }
 function w3cRecord(raw,shortname){
   if(!safeShortname(shortname)||!validDate(text(raw?.date)))throw Error('Invalid W3C version date');
   const date=raw.date.trim(),id=date.replace(/-/g,''),uri=clean(raw.uri,1000);
   const url=new URL(uri);if(!['http:','https:'].includes(url.protocol)||url.hostname!=='www.w3.org'||url.username||url.password||url.port||url.search||url.hash||!url.pathname.startsWith('/TR/'+date.slice(0,4)+'/')||!url.pathname.replace(/\/$/,'').toLowerCase().endsWith('-'+shortname.toLowerCase()+'-'+id))throw Error('W3C version must have a dated TR URI');
   // The date and the exact API shortname identify this publication, not the latest alias.
   const self=raw._links?.self?.href;if(self&&self!==W3C+'/'+shortname+'/versions/'+id)throw Error('W3C version identity mismatch');
   url.protocol='https:';
   return {sourceId:'w3c',key:shortname+':'+id,issuer:'W3C',designation:shortname,title:clean(raw.title,2000),edition:date,status:clean(raw.status,200),stream:null,url:url.href};
 }
 function unique(rows){const keys=new Set();for(const r of rows){if(keys.has(r.key))throw Error('Duplicate source identity: '+r.key);keys.add(r.key);}return rows;}
 function collection(doc,keys){
   for(const key of keys){const a=doc?._embedded?.[key];if(Array.isArray(a))return a;}
   for(const key of keys){const a=doc?._links?.[key]||doc?.[key];if(Array.isArray(a))return a;}
   throw Error('Invalid W3C HAL collection');
 }
 async function responseText(fetcher,url,limit,signal){
   const r=await fetcher(url,{cache:'no-store',credentials:'omit',signal:signal||AbortSignal.timeout(30000),headers:{Accept:'application/json, application/xml, text/xml'}});
   if(!r.ok)throw Error('HTTP '+r.status+' — '+url);
   if(r.url){const requested=new URL(url),actual=new URL(r.url);if(actual.origin!==requested.origin&&!(requested.hostname==='www.rfc-editor.org'&&actual.protocol==='https:'&&actual.hostname==='rfc-editor.org'))throw Error('Unexpected source redirect');}
   const length=Number(r.headers?.get?.('content-length'));if(length>limit)throw Error('Source exceeds size limit');
   // Bound streamed responses too; the fallback is for deterministic fetch doubles.
   if(r.body?.getReader){const reader=r.body.getReader(),decoder=new TextDecoder();let out='',bytes=0;try{for(;;){const {value,done}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>limit)throw Error('Source exceeds size limit');out+=decoder.decode(value,{stream:true});}return out+decoder.decode();}finally{try{await reader.cancel();}catch(_){}}}
   const value=await r.text();if(value.length>limit)throw Error('Source exceeds size limit');return value;
 }
 async function json(fetcher,url,signal){return JSON.parse(await responseText(fetcher,url,MAX_JSON,signal));}
 async function pages(fetcher,base,keys,signal){
   const rows=[],seen=new Set();let url=base+'?items=1000&embed=1';
   for(let i=0;url&&i<100;i++){
     const u=new URL(url);if(u.origin!=='https://api.w3.org'||u.pathname!==new URL(base).pathname||seen.has(u.href))throw Error('Invalid W3C pagination link');seen.add(u.href);
     const data=await json(fetcher,u.href,signal);rows.push(...collection(data,keys));if(rows.length>MAX_ROWS)throw Error('W3C catalogue exceeds limit');
     const next=data?._links?.next?.href;if(!next&&Number(data.pages)>Number(data.page))throw Error('Incomplete W3C pagination');
     url=next?new URL(next,u).href:null;
   }
   if(url||!rows.length)throw Error('Incomplete W3C catalogue');return rows;
 }
 async function acquireIndex(sourceId,fetcher=root.fetch.bind(root),signal){
   if(!validSource(sourceId))throw Error('Unknown source');
   const payload=sourceId==='rfc-editor'?await responseText(fetcher,RFC,MAX_XML,signal):unique((await pages(fetcher,W3C,['specifications'],signal)).map(w3cLink));
   if(sourceId==='rfc-editor'&&(!/<(?:\w+:)?rfc-index\b/.test(payload)||!/<(?:\w+:)?rfc-entry\b/.test(payload)||/<!DOCTYPE|<!ENTITY/i.test(payload)))throw Error('Invalid RFC XML index');
   return {schemaVersion:1,sourceId,acquiredAt:now(),payload};
 }
 async function acquireVersions(shortname,fetcher=root.fetch.bind(root),signal){
   if(!safeShortname(shortname))throw Error('Invalid W3C shortname');
   const base=W3C+'/'+shortname+'/versions';
   const raw=await pages(fetcher,base,['version-history','spec_versions','versions'],signal),rows=[],unsupported=[];
   for(const v of raw){
     let record=v;
     if(!v.uri){const href=text(v.href);if(!href.startsWith(base+'/')||!/^\d{8}$/.test(href.slice(base.length+1)))throw Error('Invalid W3C version link');record=await json(fetcher,href,signal);}
     try{rows.push(w3cRecord(record,shortname));}catch(e){unsupported.push({date:text(record?.date),reason:e.message});}
   }
   if(!rows.length)throw Error('No dated W3C publications supported');
   return {schemaVersion:1,sourceId:'w3c',shortname,acquiredAt:now(),payload:unique(rows),unsupported:unsupported.length};
 }
 function validateIndex(snapshot){
   if(snapshot?.schemaVersion!==1||!validSource(snapshot.sourceId)||!validTime(snapshot.acquiredAt))throw Error('Invalid source snapshot');
   if(snapshot.sourceId==='rfc-editor')return parseRfcIndex(snapshot.payload);
   if(!Array.isArray(snapshot.payload)||!snapshot.payload.length||snapshot.payload.length>MAX_ROWS)throw Error('Invalid W3C index');
   return unique(snapshot.payload.map(r=>w3cLink({href:W3C+'/'+r.key,title:r.title})));
 }
 function validateVersions(snapshot,shortname){
   if(snapshot?.schemaVersion!==1||snapshot.sourceId!=='w3c'||snapshot.shortname!==shortname||!validTime(snapshot.acquiredAt)||!Array.isArray(snapshot.payload)||!snapshot.payload.length||snapshot.payload.length>MAX_ROWS)throw Error('Invalid W3C version snapshot');
   return unique(snapshot.payload.map(r=>w3cRecord({uri:r.url,date:r.edition,title:r.title,status:r.status},shortname)));
 }
 // Browser-only optional documentary cache. Persist complete snapshots atomically;
 // the catalogue author owns a separate, portable copy of each selected notice.
 let dbPromise;
 function database(){
   if(!root.indexedDB)return Promise.resolve(null);
   if(!dbPromise)dbPromise=new Promise(resolve=>{try{const q=root.indexedDB.open('radar-standard-sources-v1',1);q.onupgradeneeded=()=>q.result.createObjectStore('snapshots');q.onsuccess=()=>resolve(q.result);q.onerror=q.onblocked=()=>resolve(null);}catch(_){resolve(null);}});
   return dbPromise;
 }
 async function cached(key,write){const db=await database();if(!db)return null;return new Promise(resolve=>{try{const tx=db.transaction('snapshots',write?'readwrite':'readonly'),store=tx.objectStore('snapshots'),q=write?store.put(write,key):store.get(key);let result; q.onsuccess=()=>{result=q.result;};tx.oncomplete=()=>resolve(write?true:result||null);tx.onerror=tx.onabort=()=>resolve(null);}catch(_){resolve(null);}});}
 const indexes=new Map(),versions=new Map(),pending=new Map();let generation=0;
 function localUrl(key){const href=root.location?.href;if(!href||!/^https?:/.test(href))return null;return new URL('./standard-source-cache/'+key+'.json',href).href;}
 async function loadSnapshot(key,validate,acquire,refresh){
   if(!refresh){let best=null;const stored=await cached(key);if(stored){try{best={snapshot:stored,rows:validate(stored),storage:'browser-cache'};}catch(_){/* reject malformed cache */}}
     const url=localUrl(key);if(url){try{const local=JSON.parse(await responseText(root.fetch.bind(root),url,key==='rfc-editor'?MAX_XML*2:MAX_JSON));const rows=validate(local);if(!best||Date.parse(local.acquiredAt)>=Date.parse(best.snapshot.acquiredAt)){await cached(key,local);return {snapshot:local,rows,storage:'local-cache'};}}catch(_){/* optional local acquisition */}}
     if(best)return best;
   }
   const snapshot=await acquire(),rows=validate(snapshot);const saved=await cached(key,snapshot);return {snapshot,rows,storage:saved?'browser-cache':'session'};
 }
 function serialize(key,fn){if(pending.has(key))return pending.get(key);const p=Promise.resolve().then(fn).finally(()=>pending.delete(key));pending.set(key,p);return p;}
 function view(entry){return {generation:entry.generation,acquiredAt:entry.snapshot.acquiredAt,count:entry.rows.length,storage:entry.storage,unsupported:entry.snapshot.unsupported||0};}
 async function load(sourceId,{refresh=false,reload=false}={}){
   requireAuthor();if(!validSource(sourceId))throw Error('Unknown external source');if(!refresh&&!reload&&indexes.has(sourceId))return view(indexes.get(sourceId));
   return serialize('index:'+sourceId,async()=>{const entry=await loadSnapshot(sourceId,s=>{if(s?.sourceId!==sourceId)throw Error('Wrong source');return validateIndex(s);},()=>acquireIndex(sourceId),refresh);entry.generation=++generation;indexes.set(sourceId,entry);if(sourceId==='w3c')versions.clear();return view(entry);});
 }
 async function loadVersions(shortname,{refresh=false,reload=false}={}){
   requireAuthor();const index=indexes.get('w3c');if(!index||!index.rows.some(r=>r.key===shortname))throw Error('W3C series not in active index');
   if(!refresh&&!reload&&versions.has(shortname))return view(versions.get(shortname));
   return serialize('versions:'+shortname,async()=>{const entry=await loadSnapshot('w3c-'+shortname,s=>validateVersions(s,shortname),()=>acquireVersions(shortname),refresh);if(indexes.get('w3c')!==index)throw Error('W3C index changed during acquisition');entry.generation=++generation;versions.set(shortname,entry);return view(entry);});
 }
 function search(sourceId,query='',shortname=null){requireAuthor();const entry=sourceId==='w3c'&&shortname?versions.get(shortname):indexes.get(sourceId);if(!entry)return {generation:null,rows:[],total:0};const q=norm(query),compact=q.replace(/\s/g,'');const matches=entry.rows.filter(r=>!q||norm([r.designation,r.title,r.issuer,r.edition,r.status,r.stream].join(' ')).includes(q)||norm(r.designation).replace(/\s/g,'').includes(compact));return {generation:entry.generation,total:matches.length,rows:copy(matches.slice(0,100))};}
 function selected(sourceId,key,token){requireAuthor();const entry=sourceId==='rfc-editor'?indexes.get(sourceId):sourceId==='w3c'?versions.get(String(key).split(':')[0]):null;if(!entry||entry.generation!==token)throw Error('Source selection is stale');const row=entry.rows.find(r=>r.key===key);if(!row||!row.edition||!row.url)throw Error('Source publication not found');return {schemaVersion:1,...copy(row),acquiredAt:entry.snapshot.acquiredAt};}
 function status(sourceId){const e=indexes.get(sourceId);return e?view(e):null;}
 root.__radarStandardSources=Object.freeze({descriptors,RFC,W3C,rfcRecord,countRfcEntries,parseRfcIndex,w3cLink,w3cRecord,acquireIndex,acquireVersions,validateIndex,validateVersions,load,loadVersions,search,selected,status});
})(typeof window!=='undefined'?window:globalThis);
