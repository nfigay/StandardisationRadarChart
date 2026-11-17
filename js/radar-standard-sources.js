/* S15-B: optional external documentary sources. The native catalog is not a cache.
 * Classic script shared by the Creator and the Node acquisition tool. No startup I/O.
 */
(function(root){
 'use strict';
 // S16-A-R1: resource metadata is not a second register of business actors.
 // Provider labels describe the external publisher; they are not organizationIds.
 function freezeTree(value){if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freezeTree);Object.freeze(value);}return value;}
 const knowledgeConcepts=freezeTree({
   organization:{native:'organizations[].organizationId',meaning:'Actor; reuse native identity when explicitly resolved',vocabulary:'https://www.w3.org/TR/vocab-org/'},
   portfolio:{native:'portfolios[].portfolioId',meaning:'Existing governance scope; not an external data source'},
   standard:{native:'standards[].standardId',meaning:'Existing business reference; do not redefine abstract identity'},
   publication:{native:'standards[].extensions.isoDocument or externalDocument',meaning:'Source-scoped publication identity; edition semantics remain DEC-009/010'},
   classification:{native:null,meaning:'Source-scoped classification scheme and concept',vocabulary:'https://www.w3.org/TR/skos-reference/'},
   workingGroup:{native:null,meaning:'Group or committee as identified by its source'},
   person:{native:null,meaning:'Person distinct from organization; no matching by display name'},
   affiliation:{native:null,meaning:'Qualified role or representation with temporal provenance'},
   activity:{native:null,meaning:'Project, draft, or standardization activity'},
   documentRelation:{native:null,meaning:'Qualified documentary relation, not automatic identity merge'},
   assessment:{native:'assessments[].assessmentId',meaning:'Existing contextual evaluation'},
   profile:{native:null,meaning:'Candidate selection for joint use; not a new portfolio'},
   guidance:{native:null,meaning:'Method, guide or reference architecture; not necessarily a standard'},
   provenance:{native:'existing referenceDeclaration and documentary extensions',meaning:'Source, time and evidence for each assertion',vocabulary:'https://www.w3.org/TR/prov-o/'},
   radar:{native:'radarRevisions[].radarId / revisionId',meaning:'Existing visualization and revision identities'}
 });
 const conceptIds=Object.keys(knowledgeConcepts);
 // Availability and implementation are independent. No right is inferred from public access.
 const capability=(availability,implementation='not-implemented',mapping=null)=>({availability,implementation,mapping});
 const mapped=mapping=>capability('available','existing',mapping);
 const candidate=mapping=>capability('available','candidate',mapping);
 const available=mapping=>capability('available','not-implemented',mapping);
 const review=()=>capability('to-review');
 function resource(id,label,providerLabel,kind,url,access,connector,capabilities={},details={}){
   return {id,label,providerLabel,kind,access:{type:access,url,authentication:details.authentication||'to-review',documentation:details.documentation||url},connector,
     capabilities:Object.fromEntries(conceptIds.map(key=>[key,capabilities[key]||review()])),
     rights:{metadataReuse:'to-review',bulkAcquisition:details.bulkAcquisition||'to-review',redistribution:'to-review',policyUrl:details.policyUrl||null},
     note:details.note||null};
 }
 const resources=freezeTree([
   resource('iso-open-data','ISO Open Data','ISO','installed-iso','https://www.iso.org/','jsonl','existing-iso',{
     organization:mapped('referenceDeclaration.issuer (label only)'),standard:mapped('existing standardId'),publication:mapped('isoDocument.id/reference/edition/publicationDate/currentStage'),classification:mapped('isoDocument.icsCodes (ICS)'),workingGroup:mapped('isoDocument.ownerCommittee (source code)'),documentRelation:mapped('isoDocument.replaces/replacedBy (unresolved identifiers)'),provenance:mapped('isoDocument.release; referenceDeclaration')},{note:'Existing installed corpus; no new download endpoint inferred.'}),
   resource('rfc-editor','RFC Editor','RFC Editor','documents','https://www.rfc-editor.org/rfc-index.xml','xml-index','existing-index',{
     organization:mapped('stream-derived issuer label, not a native organizationId'),standard:mapped('existing standardId'),publication:mapped('RFC number/title/date/status/stream'),person:available('rfc-entry/author; not ingested'),documentRelation:available('RFC Index obsoletes/updates and subseries; not normalized'),provenance:mapped('externalDocument.acquiredAt/url')},{authentication:'none',documentation:'https://www.rfc-editor.org/retrieve/',policyUrl:'https://www.rfc-editor.org/series/rfc-use/'}),
   resource('w3c','W3C','W3C','series','https://api.w3.org/specifications','rest-hal','existing-series',{
     organization:mapped('issuer label'),standard:mapped('existing standardId'),publication:mapped('shortname and dated TR publication'),workingGroup:available('W3C API group resources; no joins implemented'),provenance:mapped('externalDocument.acquiredAt/url')},{authentication:'none',documentation:'https://www.w3.org/api/',policyUrl:'https://www.w3.org/copyright/'}),
   resource('ietf-datatracker','IETF Datatracker','IETF','document-context','https://datatracker.ietf.org/api/','rest-json','candidate-context',{
     publication:candidate('doc/rfc<number>/doc.json: name and title'),workingGroup:candidate('group.name/type/acronym (source-scoped, not canonical)'),activity:candidate('rev_history: draft name/revision'),documentRelation:candidate('rev_history links the RFC to document history, not normative dependencies'),person:available('authors; intentionally not collected into normalized output'),affiliation:available('authors.affiliation; intentionally not collected'),provenance:candidate('request URL + acquisition date')},{authentication:'none for simplified document endpoint',documentation:'https://datatracker.ietf.org/api/',policyUrl:'https://www.ietf.org/about/open-records/',note:'Explicit RFC lookup only; no bulk crawl, raw person data storage or native mutation.'}),
   resource('omg-specifications','OMG Specifications','OMG','specification-catalog','https://www.omg.org/spec/','html-index','candidate-discovery',{
     publication:candidate('catalog acronym/version/status/date and versioned URL'),classification:available('catalog categories and specification keywords'),organization:available('contributing organizations on version pages; unresolved source labels'),documentRelation:candidate('ISO adoption table: versioned OMG subject and reported ISO designations'),provenance:candidate('catalog URL, acquisition timestamp and source digest')},{authentication:'none for public pages',documentation:'https://www.omg.org/spec/',policyUrl:'https://www.omg.org/legal/',bulkAcquisition:'requires-documented-basis',note:'Priority source. Public catalog consultation on explicit request, private cache; no native import connector. Bulk collection and redistribution remain to review.'}),
   resource('omg-version-metadata','OMG version metadata','OMG','semantic-metadata','https://www.omg.org/spec/SysML/1.4/About-SysML.jsonld','json-ld-rdf','candidate-discovery',{
     publication:available('version-scoped About metadata; field mapping pending raw response'),provenance:candidate('source URL, SHA-256 and acquisition date')},{authentication:'none for public links',documentation:'https://www.omg.org/spec/SysML/1.4',policyUrl:'https://www.omg.org/legal/',bulkAcquisition:'requires-documented-basis',note:'Prefer explicitly advertised versioned JSON-LD/RDF; not a catalog API, not all pages verified; no remote context expansion.'}),
   resource('iec-webstore','IEC Webstore','IEC','specification-catalog','https://webstore.iec.ch/','web-catalog','none'),
   resource('ieee-sa','IEEE SA','IEEE','specification-catalog','https://standards.ieee.org/','web-catalog','none'),
   resource('etsi-standards','ETSI Standards','ETSI','specification-catalog','https://www.etsi.org/standards/','web-catalog','none',{
     publication:available('document types and PDF publications')},{documentation:'https://www.etsi.org/standards/understanding-standards/',note:'Free PDF download does not establish a bulk metadata license.'}),
   resource('oasis-standards','OASIS Standards','OASIS','specification-catalog','https://www.oasis-open.org/standards/','web-catalog','none'),
   resource('cen-cenelec','CEN-CENELEC','CEN / CENELEC','specification-catalog','https://www.cencenelec.eu/','portal','none'),
   resource('open-group-library','The Open Group Library','The Open Group','reference-library','https://publications.opengroup.org/','web-catalog','none',{}, {note:'Separate resource from the FACE/SOSA initiatives; access and rights vary.'}),
   resource('face-consortium','FACE Consortium','The Open Group','industrial-profile','https://www.opengroup.org/face','portal','none'),
   resource('sosa-consortium','SOSA Consortium','The Open Group','industrial-profile','https://www.opengroup.org/sosa','portal','none'),
   resource('incose','INCOSE','INCOSE','knowledge-portal','https://www.incose.org/','portal','none'),
   resource('sebok','SEBoK','SEBoK / BKCASE','knowledge-base','https://sebokwiki.org/','wiki','none',{}, {note:'Knowledge base rather than normative catalog; review per-content rights.'}),
   resource('mosa-sd28','MOSA / SD-28','US Defense Standardization Program','guidance','https://quicksearch.dla.mil/qsDocDetails.aspx?ident_number=286891','document-record','none',{
     guidance:available('SD-28 Standardization Decisions for a Modular Open Systems Approach')},{note:'MOSA is an approach, not an organization or a source of all standards it recommends.'}),
   resource('assist','ASSIST Quick Search','US Defense Logistics Agency','specification-catalog','https://quicksearch.dla.mil/','web-catalog','none'),
   resource('asd-s-series','S-Series IPS','ASD / AIA','industrial-profile','https://www.s-series.org/','portal','none'),
   resource('lotar','LOTAR International','LOTAR International','industrial-profile','https://lotar-international.org/','portal','none'),
   resource('prostep-ivip','prostep ivip','prostep ivip','industrial-profile','https://www.prostep.org/','portal','none'),
   resource('sae','SAE Standards','SAE International','specification-catalog','https://www.sae.org/standards/','web-catalog','none'),
   resource('eurocae','EUROCAE','EUROCAE','specification-catalog','https://www.eurocae.net/','portal','none'),
   resource('rtca','RTCA','RTCA','specification-catalog','https://www.rtca.org/','portal','none'),
   resource('nato-nso','NATO Standardization','NATO','specification-catalog','https://nso.nato.int/','portal','none'),
   resource('nist-publications','NIST Publications','NIST','reference-library','https://www.nist.gov/publications','portal','none'),
   resource('ogc','OGC Standards','Open Geospatial Consortium','specification-catalog','https://www.ogc.org/standards/','portal','none'),
   resource('gs1','GS1 Standards','GS1','specification-catalog','https://www.gs1.org/standards','portal','none'),
   resource('dmtf','DMTF Standards','DMTF','specification-catalog','https://www.dmtf.org/standards','portal','none')
 ]);
 const resourceById=new Map(resources.map(r=>[r.id,r]));
 if(resourceById.size!==resources.length)throw Error('Duplicate resource identity');
 // Compatibility: legacy source dialog still sees exactly the active S15 connectors.
 // Context and discovery resources cannot enter importSourceReference through this list.
 const descriptors=freezeTree(resources.filter(r=>r.connector.startsWith('existing-')).map(({id,label,kind})=>({id,label,kind})));
 function listResources({integratedOnly=false}={}){return resources.filter(r=>!integratedOnly||r.connector.startsWith('existing-'));}
 function getResource(id){return resourceById.get(id)||null;}
 const RFC='https://www.rfc-editor.org/rfc-index.xml', W3C='https://api.w3.org/specifications';
 const MAX_XML=32*1024*1024, MAX_ROWS=30000, MAX_JSON=12*1024*1024;
 const text=(v)=>typeof v==='string'?v.trim():'';
 const clean=(v,max=500)=>{const s=text(v);if(!s||s.length>max)throw Error('Invalid source field');return s;};
 const norm=v=>String(v??'').normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
 const copy=v=>JSON.parse(JSON.stringify(v));
 const validSource=id=>['existing-index','existing-series'].includes(resourceById.get(id)?.connector);
 const safeShortname=s=>typeof s==='string'&&/^[A-Za-z0-9][A-Za-z0-9._+-]{0,149}$/.test(s)&&s!=='.'&&s!=='..';
 const validTime=s=>typeof s==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(s)&&Number.isFinite(Date.parse(s));
 const now=()=>new Date().toISOString();
 function requireAuthor(){if(root.__radarApplicationProfile?.viewer)throw Error('Source acquisition denied');root.__radarApplicationProfile?.require('radar.consult');}
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
 function search(sourceId,query='',shortname=null,offset=0){requireAuthor();const entry=sourceId==='w3c'&&shortname?versions.get(shortname):indexes.get(sourceId);if(!entry)return {generation:null,rows:[],total:0};if(!Number.isSafeInteger(offset)||offset<0)throw Error('Invalid offset');const q=norm(query),compact=q.replace(/\s/g,'');const matches=entry.rows.filter(r=>!q||norm([r.designation,r.title,r.issuer,r.edition,r.status,r.stream].join(' ')).includes(q)||norm(r.designation).replace(/\s/g,'').includes(compact));return {generation:entry.generation,total:matches.length,rows:copy(matches.slice(offset,offset+100))};}
 function selected(sourceId,key,token){requireAuthor();const entry=sourceId==='rfc-editor'?indexes.get(sourceId):sourceId==='w3c'?versions.get(String(key).split(':')[0]):null;if(!entry||entry.generation!==token)throw Error('Source selection is stale');const row=entry.rows.find(r=>r.key===key);if(!row||!row.edition||!row.url)throw Error('Source publication not found');return {schemaVersion:1,...copy(row),acquiredAt:entry.snapshot.acquiredAt};}
 function status(sourceId,shortname=null){const e=sourceId==='w3c'&&shortname?versions.get(shortname):indexes.get(sourceId);return e?view(e):null;}
 // Read-only projection of an existing native reference. No new identity, record,
 // cache or mutation. Missing values in a snapshot are NOT negative assertions.
 function describeNativeReference(row){
   if(!row||typeof row.standardId!=='string'||!row.standardId.trim())throw Error('Native standardId required');
   const iso=row.isoDocument,ext=row.externalDocument;
   if(iso&&ext)throw Error('Ambiguous native source snapshot');
   const sourceIdentity=iso&&iso.id?{sourceId:'iso-open-data',key:String(iso.id)}:ext&&validSource(ext.sourceId)&&ext.key?{sourceId:ext.sourceId,key:String(ext.key)}:null;
   const provenance={sourceId:sourceIdentity?.sourceId||row.origin||'legacy',verification:row.verification||'unknown',url:row.sourceUrl||ext?.url||null,acquiredAt:ext?.acquiredAt||null,release:iso?.release||null};
   function fact(value,field){const known=value!==undefined&&value!==null&&value!==''&&(!Array.isArray(value)||value.length>0);return {state:known?'reported':'not-reported',value:known?copy(value):null,provenance:{...provenance,field}};}
   return {standardId:row.standardId,sourceIdentity,fields:{
     title:fact(iso?.title||ext?.title||row.name,iso?.title?'isoDocument.title':ext?.title?'externalDocument.title':'name'),
     designation:fact(iso?.reference||ext?.designation||row.designation,iso?'isoDocument.reference':ext?'externalDocument.designation':'referenceDeclaration.designation'),
     issuerLabel:fact(ext?.issuer||row.issuer,ext?'externalDocument.issuer':'referenceDeclaration.issuer'),
     edition:fact(iso?.edition||ext?.edition||row.editionDesignation,iso?'isoDocument.edition':ext?'externalDocument.edition':'referenceDeclaration.editionDesignation'),
     publicationDate:fact(iso?.publicationDate||ext?.edition,iso?'isoDocument.publicationDate':'externalDocument.edition'),
     status:fact(iso?.currentStage||ext?.status,iso?'isoDocument.currentStage':'externalDocument.status'),
     classification:fact(iso?.icsCodes?.length?{scheme:'ICS',codes:iso.icsCodes}:null,'isoDocument.icsCodes'),
     workingGroup:fact(iso?.ownerCommittee?{sourceId:'iso-open-data',code:iso.ownerCommittee}:null,'isoDocument.ownerCommittee'),
     stream:fact(ext?.stream,'externalDocument.stream'),
     replaces:fact(iso?.replaces,'isoDocument.replaces'),replacedBy:fact(iso?.replacedBy,'isoDocument.replacedBy'),
     person:fact(null,null),affiliation:fact(null,null)
   }};
 }
 // S16-A-R1: explicit, bounded Datatracker document-context lookup. The public
 // simplified API documents RFC name, group and revision history. Do not retain
 // authors, emails, affiliation, abstract, AD, shepherd or raw response.
 const DATATRACKER='https://datatracker.ietf.org';
 function rfcContextKey(value){if(typeof value!=='string'||!(/^[1-9][0-9]{0,5}$/).test(value))throw Error('Invalid RFC context key');return value;}
 function rfcContextUrl(key){return DATATRACKER+'/doc/rfc'+rfcContextKey(key)+'/doc.json';}
 function normalizeRfcContext(raw,key,acquiredAt){
   key=rfcContextKey(key);const url=rfcContextUrl(key);
   if(!raw||typeof raw!=='object'||Array.isArray(raw)||raw.name!=='rfc'+key||!validTime(acquiredAt))throw Error('Invalid Datatracker document identity');
   const sourceId='ietf-datatracker',provenance={sourceId,url,acquiredAt};
   const field=(value,path)=>({state:value==null?'not-reported':'reported',value,provenance:{...provenance,field:path}});
   let group=null;
   if(raw.group!=null){
     if(typeof raw.group!=='object'||Array.isArray(raw.group))throw Error('Invalid Datatracker group');
     const acronym=clean(raw.group.acronym,100);
     if(!/^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/.test(acronym))throw Error('Invalid Datatracker group acronym');
     group={sourceId,sourceKey:acronym,name:clean(raw.group.name,500),type:text(raw.group.type)||null};
   }
   let history=null;
   if(raw.rev_history!=null){
     if(!Array.isArray(raw.rev_history)||raw.rev_history.length>500)throw Error('Invalid Datatracker revision history');
     history=[];const seen=new Set();
     for(const item of raw.rev_history){
       const name=text(item?.name),rev=text(item?.rev);
       // RFC entries in the history are publications, not prior draft revisions.
       // The context is deliberately limited to the RFC's Internet-Draft history.
       if(/^rfc[1-9][0-9]{0,5}$/.test(name))continue;
       if(!/^draft-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)||name.length>200||!/^\d{2,3}$/.test(rev))throw Error('Invalid Datatracker draft revision');
       const id=name+':'+rev;if(seen.has(id))throw Error('Duplicate Datatracker draft revision');seen.add(id);
       const date=text(item.published);let publishedAt=null;
       if(date){if(!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(date)||!Number.isFinite(Date.parse(date)))throw Error('Invalid Datatracker revision date');publishedAt=new Date(date).toISOString();}
       // Construct fixed official URL; do not follow or expose arbitrary links.
       history.push({sourceId,sourceKey:id,name,revision:rev,publishedAt,url:DATATRACKER+'/doc/'+name+'/'+rev+'/'});
     }
   }
   return {schemaVersion:1,sourceId,subject:{sourceId:'rfc-editor',key},provenance,
     fields:{title:field(clean(raw.title,2000),'title'),workingGroup:field(group,'group'),activityHistory:field(history,'rev_history'),
       stream:field(text(raw.stream)||null,'stream'),documentState:field(text(raw.state)||null,'state'),
       standardsLevel:field(text(raw.std_level)||null,'std_level')},
     // This is documentary context, not a canonical identity, normative dependency,
     // statement of adoption or modification of the RFC Index snapshot.
     relationType:'document-history',storage:'session-only'};
 }
 async function readRfcContext(key,{fetcher=root.fetch?.bind(root),signal}={}){
   requireAuthor();const url=rfcContextUrl(key);if(typeof fetcher!=='function')throw Error('Datatracker fetch unavailable');
   // No alternate URL supplied by caller, no credentials, no redirected response.
   const guarded=async(target,options)=>{const response=await fetcher(target,{...options,redirect:'error',headers:{Accept:'application/json'}});if(response.url&&response.url!==target)throw Error('Unexpected Datatracker redirect');return response;};
   const raw=JSON.parse(await responseText(guarded,url,1024*1024,signal));
   return normalizeRfcContext(raw,key,now());
 }

 // S16-A-R2: shared pure OMG discovery parser, browser and Node. Never executes HTML.
 const omg=(()=>{
 const ORIGIN='https://www.omg.org',CATALOG=ORIGIN+'/spec/',POLICY=ORIGIN+'/legal/',LIMIT=8*1024*1024;
 const stamp=()=>new Date().toISOString();
const esc=s=>String(s??'').replace(/\s+/g,' ').trim();
const ENT={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' ',reg:'®',trade:'™',copy:'©',ndash:'–',mdash:'—',lsquo:'‘',rsquo:'’',ldquo:'“',rdquo:'”',middot:'·',hellip:'…'};
function decode(s){return String(s).replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]+);/gi,(m,k)=>{if(k[0]!=='#')return ENT[k.toLowerCase()]??m;const n=k[1].toLowerCase()==='x'?parseInt(k.slice(2),16):parseInt(k.slice(1),10);return n>0&&n<=0x10ffff&&!(n>=0xd800&&n<=0xdfff)?String.fromCodePoint(n):m;});}
const text=s=>esc(decode(String(s).replace(/<(?:script|style)\b[^>]*>[\s\S]*?<\/(?:script|style)\s*>/gi,'').replace(/<[^>]*>/g,' ')));
function officialUrl(value){const u=new URL(value,CATALOG);if(u.origin!==ORIGIN||u.username||u.password||u.search||u.hash||/%|\\/.test(u.pathname))throw Error('Non-canonical OMG URL');return u;}
function versionIdentity(value){const u=officialUrl(value);
  // The official index also contains the EDMC-FIBO/BE, /FBC, /FND and /IND families.
  const m=/^\/spec\/([A-Za-z0-9][A-Za-z0-9._+-]{0,99}(?:\/[A-Za-z0-9][A-Za-z0-9._+-]{0,99}){0,2})\/(\d+(?:\.\d+){0,3})(?:\/(Beta[1-9]\d{0,2}))?(?:\/About-([A-Za-z0-9][A-Za-z0-9._+-]{0,99}))?\/?$/.exec(u.pathname);
  if(!m||m[1].split('/').some(x=>x==='.'||x==='..')||(m[4]&&(m[1].includes('/')||m[4]!==m[1])))throw Error('Invalid OMG version identity');
  const key=[m[1],m[2],m[3]].filter(Boolean).join('/');return {sourceId:'omg-specifications',sourceKey:key,acronym:m[1],version:m[2],variant:m[3]||null,url:ORIGIN+'/spec/'+key};}
function metadataIdentity(value){const u=officialUrl(value);if(!u.pathname.endsWith('.jsonld'))throw Error('Expected versioned OMG JSON-LD URL');const id=versionIdentity(u.href.slice(0,-7));if(u.pathname!==new URL(id.url).pathname+'/About-'+id.acronym+'.jsonld')throw Error('Invalid versioned OMG JSON-LD URL');return {...id,metadataUrl:u.href};}
function allowedUrl(value){const u=officialUrl(value);if(u.href===CATALOG)return u.href;return metadataIdentity(u.href).metadataUrl;}
function links(cell){return [...cell.matchAll(/<a\b[^>]*\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))[^>]*>([\s\S]*?)<\/a\s*>/gi)].map(m=>({href:decode(m[1]??m[2]??m[3]),text:text(m[4])}));}
function tableRows(html){return [...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr\s*>/gi)].map(r=>[...r[1].matchAll(/<(th|td)\b[^>]*>([\s\S]*?)<\/\1\s*>/gi)].map(c=>({kind:c[1].toLowerCase(),raw:c[2],text:text(c[2])})));}
const header=r=>r.map(c=>c.text.toLowerCase().replace(/[^a-z ]/g,'').replace(/\s+/g,' ').trim()).join('|');
const months=['January','February','March','April','May','June','July','August','September','October','November','December'];
function month(value){const m=/^([A-Za-z]+)\s+(\d{4})$/.exec(value);const i=m?months.indexOf(m[1]):-1;return i<0?null:m[2]+'-'+String(i+1).padStart(2,'0');}
function rowVersion(cell){const identities=[];for(const link of links(cell.raw)){try{identities.push(versionIdentity(link.href));}catch{}}const unique=[...new Map(identities.map(x=>[x.sourceKey,x])).values()];if(unique.length!==1)throw Error('Missing or ambiguous version link');return unique[0];}
// R4: one explicit family history, including versions absent from the current index.
// This is bibliographic evidence; historical presence never implies operational obsolescence.
function familyUrl(acronym){
 if(typeof acronym!=='string'||!/^([A-Za-z0-9][A-Za-z0-9._+-]{0,99})(\/[A-Za-z0-9][A-Za-z0-9._+-]{0,99}){0,2}$/.test(acronym)||acronym.split('/').some(x=>x==='.'||x==='..'))throw Error('Invalid OMG family');
 return ORIGIN+'/spec/'+acronym+'/';
}
function parseOmgHistory(html,acronym,{acquiredAt=stamp(),sourceDigest=null}={}){
 const url=familyUrl(acronym);
 if(typeof html!=='string'||!html||new TextEncoder().encode(html).byteLength>LIMIT)throw Error('Invalid history page size');
 const input=html.replace(/<!--[^]*?-->/g,'').replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,'');
 const rows=new Map(),rejected=[];let tables=0;
 for(const table of input.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table\s*>/gi)){
  const trs=tableRows(table[1]);const h=trs.findIndex(r=>header(r)==='version|adoption date|url');if(h<0)continue;
  tables++;
  for(const r of trs.slice(h+1)){
   if(!r.length||r.every(c=>c.kind==='th')||r.every(c=>!c.text))continue;
   try{
    if(r.length!==3)throw Error('Unexpected history column count');
    const link=links(r[2].raw).map(x=>x.href);if(link.length!==1)throw Error('Missing or ambiguous history link');
    const id=versionIdentity(link[0]);if(id.acronym!==acronym||id.variant||r[0].text!==id.version)throw Error('History identity disagreement');
    const adopted=month(r[1].text);if(!adopted)throw Error('Invalid adoption date');
    const item={...id,key:id.sourceKey,designation:acronym,edition:id.version,title:acronym+' '+id.version,status:'formal',publicationDate:adopted,issuer:'OMG',historyEvidence:url,historyRelation:'formal-version-reported'};
    const prior=rows.get(id.sourceKey);if(prior&&JSON.stringify(prior)!==JSON.stringify(item))throw Error('Conflicting history version');
    rows.set(id.sourceKey,item);
   }catch(e){rejected.push({row:r[0]?.text||null,reason:e.message});}
  }
 }
 if(tables!==1||!rows.size||rejected.length)throw Error('Incomplete OMG formal version history: '+tables+' tables, '+rows.size+' accepted, '+rejected.length+' rejected');
 return {schemaVersion:1,sourceId:'omg-formal-history',family:acronym,provenance:{url,acquiredAt,sha256:sourceDigest},records:[...rows.values()],coverage:{complete:true,formalVersions:rows.size,historyTables:tables,scope:'formal versions listed for this family; not operational applicability'},distribution:'private-only'};
}
function parseOmgCatalog(html,{acquiredAt=stamp(),sourceDigest=null}={}){
  if(typeof html!=='string'||!html||new TextEncoder().encode(html).byteLength>LIMIT)throw Error('Invalid catalog size');
  const records=new Map(),adoptions=new Map(),rejected=[],tables=[];let indexTables=0,adoptionTables=0;
  const input=html.replace(/<!--[^]*?-->/g,'').replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,'');
  for(const table of input.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table\s*>/gi)){
    const rows=tableRows(table[1]);const h=rows.findIndex(r=>header(r)==='name|acronym|version|status|publication date'||header(r)==='specification title|version|iso number|omg file id');if(h<0)continue;
    const adoption=header(rows[h]).startsWith('specification title');if(adoption)adoptionTables++;else indexTables++;
    const kind=adoption?'adoptions':'index';const counts={kind,rows:0,accepted:0,declaredTotal:null};const totals=new Set();
    for(const r of rows){const m=/^Total\s*:\s*([0-9][0-9, ]*)$/i.exec(r.map(c=>c.text).join(' ').trim());if(m)totals.add(Number(m[1].replace(/[, ]/g,'')));}
    if(totals.size===1)counts.declaredTotal=[...totals][0];else if(totals.size>1)rejected.push({table:kind,row:0,reason:'Conflicting declared totals'});
    for(const r of rows.slice(h+1)){
      if(!r.length||r.every(c=>c.kind==='th')||/^total\s*:/i.test(r[0]?.text)||r.every(c=>!c.text))continue;
      counts.rows++;
      try{
        if(r.length!==(adoption?4:5))throw Error('Unexpected column count');
        const identity=rowVersion(r[adoption?1:2]);
        if(adoption){
          const iso=[...new Set(r[2].text.match(/\b\d{3,7}(?:-\d+)*:\d{4}\b/g)||[])];if(!iso.length)throw Error('Missing ISO designations');
          const fileIds=[...new Set(r[3].text.match(/\b(?:formal|ptc|dtc|ad)\/\d\d-\d\d-\d\d\b/gi)||[])];
          // Keep sets independently: no invented one-to-one pairing, no identity merge.
          const item={subject:identity,title:r[0].text,relationType:'omg-reports-iso-adoption',isoDesignations:iso,omgFileIds:fileIds};
          const existing=adoptions.get(identity.sourceKey);if(existing&&JSON.stringify(existing)!==JSON.stringify(item))throw Error('Conflicting adoption row');adoptions.set(identity.sourceKey,item);
        }else{
          const title=r[0].text,designation=r[1].text,edition=r[2].text,status=r[3].text,publicationDate=month(r[4].text);
          if(!title||title.length>2000||!designation||!edition||!status||!publicationDate)throw Error('Incomplete catalog publication');
          if(!['formal','beta','retired','deprecated','withdrawn','superseded'].includes(status.toLowerCase()))throw Error('Unreviewed status');
          const item={...identity,title,designation,edition,status,publicationDate};
          const existing=records.get(identity.sourceKey);if(existing&&JSON.stringify(existing)!==JSON.stringify(item))throw Error('Conflicting catalog row');records.set(identity.sourceKey,item);
        }
        counts.accepted++;
      }catch(e){rejected.push({table:kind,row:counts.rows,reason:e.message});}
    }
    if(counts.declaredTotal!==null&&counts.declaredTotal!==counts.rows)rejected.push({table:kind,row:0,reason:'Declared total '+counts.declaredTotal+' differs from parsed rows '+counts.rows});
    tables.push(counts);
  }
  if(!indexTables||!records.size)throw Error('No recognized OMG catalog table');
  return {schemaVersion:1,sourceId:'omg-specifications',provenance:{url:CATALOG,acquiredAt,sha256:sourceDigest},records:[...records.values()],isoAdoptions:[...adoptions.values()],coverage:{indexTables,adoptionTables,rejected,tables,complete:rejected.length===0&&adoptionTables>0,scope:'catalog-listed publications; not all historical editions'},distribution:'private-only'};
}
 return Object.freeze({CATALOG,POLICY,LIMIT,versionIdentity,metadataIdentity,allowedUrl,parseOmgCatalog,parseOmgHistory,familyUrl});
 })();
 let omgEntry=null,omgGeneration=0,omgRequest=0;
 const OMG_CACHE_KEY='omg-specifications-private';
 let omgWrites=Promise.resolve();
 function queueOmgWrite(fn){const task=omgWrites.then(fn);omgWrites=task.catch(()=>{});return task;}
 async function deleteOmgCache(){const db=await database();if(!db)return false;return new Promise(resolve=>{try{const tx=db.transaction('snapshots','readwrite');tx.objectStore('snapshots').delete(OMG_CACHE_KEY);tx.oncomplete=()=>resolve(true);tx.onerror=tx.onabort=()=>resolve(false);}catch(_){resolve(false);}});}
 function clearOmg(){requireAuthor();omgRequest++;omgEntry=null;return queueOmgWrite(deleteOmgCache);}
 function validateOmgSnapshot(snapshot){
   if(snapshot?.schemaVersion!==1||snapshot.sourceId!=='omg-specifications'||snapshot.distribution!=='private-only'||snapshot.provenance?.url!==omg.CATALOG||!Array.isArray(snapshot.records)||!snapshot.records.length||snapshot.records.length>MAX_ROWS||!Array.isArray(snapshot.isoAdoptions)||snapshot.isoAdoptions.length>MAX_ROWS)throw Error('Invalid private OMG snapshot');
   const acquiredAt=snapshot.provenance.acquiredAt;
   if(acquiredAt!==null&&!validTime(acquiredAt))throw Error('Invalid OMG acquisition date');
   const sha256=snapshot.provenance.sha256;
   if(sha256!==null&&!/^[a-f0-9]{64}$/.test(sha256))throw Error('Invalid OMG digest');
   function identity(record){const id=omg.versionIdentity(record?.url);if(record.sourceId!==id.sourceId||record.sourceKey!==id.sourceKey||record.acronym!==id.acronym||record.version!==id.version||record.variant!==id.variant||record.url!==id.url)throw Error('Inconsistent OMG identity');return id;}
   const rows=unique(snapshot.records.map(record=>{const id=identity(record),status=clean(record.status,100),edition=clean(record.edition,100),publicationDate=clean(record.publicationDate,7);if(!/^(formal|beta|retired|deprecated|withdrawn|superseded)$/i.test(status)||!/^\d{4}-(0[1-9]|1[0-2])$/.test(publicationDate))throw Error('Invalid OMG publication');return {...id,key:id.sourceKey,title:clean(record.title,2000),designation:clean(record.designation,200),edition,status,publicationDate,issuer:'OMG'};}));
   const relations=new Map(),adoptionRows=[];for(const r of snapshot.isoAdoptions){const id=identity(r.subject);if(r.relationType!=='omg-reports-iso-adoption'||relations.has(id.sourceKey)||!Array.isArray(r.isoDesignations)||!r.isoDesignations.length||r.isoDesignations.length>100||r.isoDesignations.some(x=>typeof x!=='string'||!/^\d{3,7}(?:-\d+)*:\d{4}$/.test(x)))throw Error('Invalid OMG adoption relation');const fileIds=r.omgFileIds??[];if(!Array.isArray(fileIds)||fileIds.length>100||fileIds.some(x=>typeof x!=='string'||!/^(?:formal|ptc|dtc|ad)\/\d\d-\d\d-\d\d$/i.test(x)))throw Error('Invalid OMG file identifiers');const targets=[...new Set(r.isoDesignations)];relations.set(id.sourceKey,targets);const indexed=rows.find(row=>row.key===id.sourceKey);adoptionRows.push({...id,key:id.sourceKey,designation:indexed?.designation||id.acronym,title:r.title?clean(r.title,2000):indexed?.title||id.acronym,edition:indexed?.edition||[id.version,id.variant].filter(Boolean).join(' '),status:indexed?.status||null,publicationDate:indexed?.publicationDate||null,issuer:'OMG',isoAdoptions:targets,omgFileIds:[...new Set(fileIds)]});}
   const c=snapshot.coverage;if(!c||typeof c.complete!=='boolean'||!Number.isInteger(c.indexTables)||c.indexTables<1||!Number.isInteger(c.adoptionTables)||c.adoptionTables<0||!Array.isArray(c.rejected)||c.rejected.length>MAX_ROWS)throw Error('Invalid OMG coverage');
   const tables=Array.isArray(c.tables)?c.tables.map(t=>{
     if(!['index','adoptions'].includes(t.kind)||!Number.isInteger(t.rows)||t.rows<0||t.rows>MAX_ROWS||!Number.isInteger(t.accepted)||t.accepted<0||t.accepted>t.rows||(t.declaredTotal!==null&&(!Number.isInteger(t.declaredTotal)||t.declaredTotal<0||t.declaredTotal>MAX_ROWS)))throw Error('Invalid OMG table coverage');
     return {kind:t.kind,rows:t.rows,accepted:t.accepted,declaredTotal:t.declaredTotal};
   }):[];
   if(tables.length>100)throw Error('Invalid OMG table count');
   return {rows:rows.map(row=>({...row,isoAdoptions:relations.get(row.key)||[]})),adoptionRows,acquiredAt,sha256,coverage:{complete:c.complete&&c.rejected.length===0&&c.adoptionTables>0,rejected:c.rejected.length,indexTables:c.indexTables,adoptionTables:c.adoptionTables,tables}};
 }
 // R4: histories are separately cached; index import never erases a historical edition.
 const omgHistories=new Map();let omgHistoryGeneration=0;
 function validateOmgHistory(snapshot,family){
   const url=omg.familyUrl(family);
   if(snapshot?.schemaVersion!==1||snapshot.sourceId!=='omg-formal-history'||snapshot.family!==family||snapshot.distribution!=='private-only'||snapshot.provenance?.url!==url||!validTime(snapshot.provenance?.acquiredAt)||!Array.isArray(snapshot.records)||snapshot.records.length<1||snapshot.records.length>5000||snapshot.coverage?.complete!==true||snapshot.coverage?.historyTables!==1||snapshot.coverage?.formalVersions!==snapshot.records.length||!/^[a-f0-9]{64}$/.test(snapshot.provenance?.sha256||''))throw Error('Invalid OMG family history');
   const rows=unique(snapshot.records.map(r=>{
     const id=omg.versionIdentity(r.url);
     if(id.acronym!==family||id.variant||id.sourceKey!==r.sourceKey||r.key!==id.sourceKey||r.version!==id.version||r.status!=='formal'||r.historyEvidence!==url||r.historyRelation!=='formal-version-reported'||!/^\d{4}-(0[1-9]|1[0-2])$/.test(r.publicationDate))throw Error('Invalid OMG history version');
     return {...id,key:id.sourceKey,designation:family,title:clean(r.title,2000),edition:id.version,status:'formal',publicationDate:r.publicationDate,issuer:'OMG',historyEvidence:url,historyRelation:'formal-version-reported',isoAdoptions:[]};
   }));
   return {family,rows,acquiredAt:snapshot.provenance.acquiredAt,sha256:snapshot.provenance.sha256,coverage:copy(snapshot.coverage)};
 }
 function omgHistoryStatus(family){requireAuthor();const h=omgHistories.get(family);return h?{family,count:h.rows.length,generation:h.generation,acquiredAt:h.acquiredAt,origin:h.origin,storage:h.storage,coverage:copy(h.coverage)}:null;}
 function searchOmgHistory(family,query='',offset=0){requireAuthor();if(!Number.isSafeInteger(offset)||offset<0)throw Error('Invalid offset');const h=omgHistories.get(family);if(!h)return {generation:null,total:0,rows:[]};const q=norm(query),rows=h.rows.map(r=>({...r,isoAdoptions:omgEntry?.adoptionRows.find(a=>a.key===r.key)?.isoAdoptions||[]})).filter(r=>!q||norm([r.designation,r.title,r.edition,r.status,r.publicationDate,...r.isoAdoptions].join(' ')).includes(q));return {generation:h.generation,total:rows.length,rows:copy(rows.slice(offset,offset+100))};}
 async function restoreOmgHistory(family){requireAuthor();omg.familyUrl(family);if(omgHistories.has(family))return omgHistoryStatus(family);const snapshot=await cached('omg-history:'+family);if(!snapshot)return null;const entry=validateOmgHistory(snapshot,family);entry.snapshot=copy(snapshot);entry.generation=++omgHistoryGeneration;entry.origin='browser-cache';entry.storage='browser-cache';omgHistories.set(family,entry);return omgHistoryStatus(family);}
 async function readOmgHistory(family,{fetcher=root.fetch?.bind(root)}={}){
   requireAuthor();const url=omg.familyUrl(family);if(typeof fetcher!=='function')throw Error('OMG history fetch unavailable');
   const response=await fetcher(url,{method:'GET',mode:'cors',redirect:'error',credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(30000),headers:{Accept:'text/html'}});
   if(!response.ok||response.url&&response.url!==url||!/^text\/html(?:\s*;|$)/i.test(response.headers?.get?.('content-type')||''))throw Error('Unexpected OMG family history response');
   const bytes=await boundedOmgBytes(response,omg.LIMIT),html=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
   return omg.parseOmgHistory(html,family,{acquiredAt:now(),sourceDigest:await digestBytes(bytes)});
 }
 async function loadOmgHistory(family,{fetcher=root.fetch?.bind(root),refresh=false}={}){
   requireAuthor();omg.familyUrl(family);
   if(!refresh){const previous=await restoreOmgHistory(family);if(previous)return previous;}
   let snapshot;
   // Local development server offers one tightly scoped family URL. Static Pages
   // may use direct CORS only; never silently downgrade to a different domain.
   const relay=omgRelayUrl('history/'+encodeURIComponent(family));
   if(relay){
    const response=await fetcher(relay,{method:'POST',redirect:'error',credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(40000),headers:{Accept:'application/json','X-Radar-Documentary':'omg-index-v1'}});
    if(response.url&&response.url!==relay)throw Error('Unexpected OMG history relay redirect');
    if(response.ok&&/^application\/json(?:\s*;|$)/i.test(response.headers?.get?.('content-type')||'')){
      const payload=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(await boundedOmgBytes(response,omg.LIMIT)));
      if(payload.operation!=='S16-OMG-LOCAL-RELAY'||payload.ok!==true)throw Error('Invalid OMG history relay payload');
      snapshot=payload.snapshot;
    }else if(response.status!==404&&response.status!==405)throw Error('OMG history relay HTTP '+response.status);
   }
   if(!snapshot)snapshot=await readOmgHistory(family,{fetcher});
   const entry=validateOmgHistory(snapshot,family);const saved=await cached('omg-history:'+family,snapshot);
   entry.snapshot=copy(snapshot);entry.generation=++omgHistoryGeneration;entry.origin='official-fetch';entry.storage=saved?'browser-cache':'session-only';omgHistories.set(family,entry);return omgHistoryStatus(family);
 }
 // C2: portable, explicit private history exchange across browser origins.
 // A prepared current index is NOT a formal-version history.
 async function importOmgHistory(value){
   requireAuthor();
   if(typeof value!=='string'||new TextEncoder().encode(value).byteLength>omg.LIMIT)throw Error('OMG history file exceeds size limit');
   const snapshot=JSON.parse(value);
   const family=snapshot?.family;
   const entry=validateOmgHistory(snapshot,family);
   // Verify the complete snapshot before any IndexedDB or in-memory mutation.
   const saved=await cached('omg-history:'+family,snapshot);
   entry.snapshot=copy(snapshot);
   entry.generation=++omgHistoryGeneration;
   entry.origin='explicit-file';entry.storage=saved?'browser-cache':'session-only';
   omgHistories.set(family,entry);
   return omgHistoryStatus(family);
 }
 async function exportOmgHistory(family){
   requireAuthor();omg.familyUrl(family);
   const existing=await restoreOmgHistory(family);
   if(!existing)throw Error('No acquired OMG history for '+family);
   const entry=omgHistories.get(family);
   const snapshot=entry.snapshot||await cached('omg-history:'+family);
   if(!snapshot)throw Error('No exportable OMG history snapshot');
   validateOmgHistory(snapshot,family);
   return JSON.stringify(snapshot,null,2)+'\n';
 }
 function selectedOmgHistory(family,key,generation){requireAuthor();const h=omgHistories.get(family);if(!h||h.generation!==generation)throw Error('Stale OMG edition selection');const row=h.rows.find(x=>x.key===key);if(!row)throw Error('Missing OMG edition');return {schemaVersion:1,sourceId:'omg-specifications',key:row.key,title:row.title,designation:row.designation,edition:row.edition,status:row.status,url:row.url,issuer:'OMG',publicationDate:row.publicationDate,historyEvidence:row.historyEvidence,isoAdoptions:copy(omgEntry?.adoptionRows.find(a=>a.key===row.key)?.isoAdoptions||[]),sourceEvidence:{url:row.historyEvidence,sha256:h.sha256,acquiredAt:h.acquiredAt},verification:'source-verified'};}
 function selectedOmgCurrent(key,generation){requireAuthor();if(!omgEntry||omgEntry.generation!==generation)throw Error('Stale OMG catalog selection');const row=omgEntry.rows.find(x=>x.key===key);if(!row)throw Error('Missing OMG publication');return {schemaVersion:1,sourceId:'omg-specifications',key:row.key,title:row.title,designation:row.designation,edition:row.edition,status:row.status,url:row.url,issuer:'OMG',publicationDate:row.publicationDate,isoAdoptions:copy(row.isoAdoptions),sourceEvidence:{url:omg.CATALOG,sha256:omgEntry.sha256,acquiredAt:omgEntry.acquiredAt},verification:['official-fetch','local-relay','local-prepared'].includes(omgEntry.origin)?'source-verified':'unverified'};}
 const OMG_ORIGINS=['local-unverified','official-fetch','local-relay','local-prepared'];
 const OMG_RELAY_PATH='/__radar-omg/catalog/';
 function commitOmg(entry,storage,origin='local-unverified'){omgEntry={...entry,origin,storage,generation:++omgGeneration};return omgStatus();}
 function omgStatus(){requireAuthor();return omgEntry?{generation:omgEntry.generation,count:omgEntry.rows.length,adoptionCount:omgEntry.adoptionRows.length,acquiredAt:omgEntry.acquiredAt,sha256:omgEntry.sha256,coverage:copy(omgEntry.coverage),origin:omgEntry.origin,storage:omgEntry.storage,distribution:'private-only'}:null;}
 async function digestBytes(bytes){if(!root.crypto?.subtle)return null;const digest=await root.crypto.subtle.digest('SHA-256',bytes);return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');}
 async function digestText(value){return digestBytes(new TextEncoder().encode(value));}
 // Reject partial online replacements: the public catalog currently contains the
 // recent and full index tables plus the ISO adoption table. Local imports may be partial.
 function validateOmgOnlineSnapshot(snapshot){const entry=validateOmgSnapshot(snapshot);
   const c=entry.coverage,largest=Math.max(0,...c.tables.filter(t=>t.kind==='index').map(t=>t.rows));
   if(!entry.acquiredAt||!c.complete||c.indexTables<2||c.adoptionTables<1||!entry.adoptionRows.length||c.tables.filter(t=>t.kind==='index').length!==c.indexTables||c.tables.filter(t=>t.kind==='adoptions').length!==c.adoptionTables||c.tables.some(t=>t.rows!==t.accepted||(t.declaredTotal!==null&&t.rows!==t.declaredTotal))||!largest||entry.rows.length<largest){
     const reasons=(snapshot.coverage?.rejected||[]).slice(0,5).map(x=>x.reason).filter(Boolean).join('; ');
     throw Error('OMG catalog coverage incomplete (publications '+entry.rows.length+', ISO adoption rows '+entry.adoptionRows.length+', index tables '+c.indexTables+', rejected '+c.rejected+')'+(reasons?' — '+reasons:''));
   }return entry;
 }
 async function boundedOmgBytes(response,limit){
   const length=Number(response.headers?.get?.('content-length'));if(length>limit)throw Error('OMG response exceeds size limit');
   if(response.body?.getReader){const reader=response.body.getReader(),chunks=[];let size=0;try{for(;;){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>limit)throw Error('OMG response exceeds size limit');chunks.push(value);}const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}return bytes;}finally{try{await reader.cancel();}catch(_){}}}
   const bytes=new Uint8Array(await response.arrayBuffer());if(bytes.byteLength>limit)throw Error('OMG response exceeds size limit');return bytes;
 }
 // A single public bibliographic index request, no discovery crawl, no credentials,
 // no remote scripts or linked assets. Does not grant metadata redistribution rights.
 async function readOmgPublicCatalog({fetcher=root.fetch?.bind(root),signal}={}){
   requireAuthor();if(typeof fetcher!=='function')throw Error('OMG fetch unavailable');
   const response=await fetcher(omg.CATALOG,{method:'GET',mode:'cors',redirect:'error',credentials:'omit',cache:'no-store',signal:signal||AbortSignal.timeout(30000),headers:{Accept:'text/html'}});
   if(!response.ok)throw Error('OMG HTTP '+response.status);if(response.url&&response.url!==omg.CATALOG)throw Error('Unexpected OMG redirect');
   if(!/^text\/html(?:\s*;|$)/i.test(response.headers?.get?.('content-type')||''))throw Error('Unexpected OMG catalog content type');
   const bytes=await boundedOmgBytes(response,omg.LIMIT),body=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
   const snapshot=omg.parseOmgCatalog(body,{acquiredAt:now(),sourceDigest:await digestBytes(bytes)});validateOmgOnlineSnapshot(snapshot);return snapshot;
 }
 function omgRelayUrl(action){try{const u=new URL(root.location?.href);if(!['http:','https:'].includes(u.protocol)||!['127.0.0.1','localhost','[::1]'].includes(u.hostname)||u.pathname.startsWith('/StandardisationRadarChart/'))return null;return new URL(OMG_RELAY_PATH+action,u.origin).href;}catch(_){return null;}}
 function omgHasLocalRelay(){return !!omgRelayUrl('current');}
 async function requestOmgRelay(action,fetcher){
   const url=omgRelayUrl(action);if(!url)return null;let response;
   try{response=await fetcher(url,{method:'POST',redirect:'error',credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(40000),headers:{Accept:'application/json','X-Radar-Documentary':'omg-index-v1'}});}catch(e){throw Error('Local OMG relay unavailable: '+String(e.message||e));}
   if(response.url&&response.url!==url)throw Error('Unexpected local OMG relay redirect');
   const type=response.headers?.get?.('content-type')||'';
   if(!/^application\/json(?:\s*;|$)/i.test(type)){
     if([200,404,405,501].includes(response.status))return null;throw Error('Local OMG relay HTTP '+response.status);
   }
   const bytes=await boundedOmgBytes(response,omg.LIMIT),result=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
   if(result?.operation!=='S16-OMG-LOCAL-RELAY'){
     if([200,404,405,501].includes(response.status))return null;throw Error('Unexpected local OMG relay response');
   }
   if(!response.ok||result.ok!==true)throw Error(result.error||('Local OMG relay HTTP '+response.status));
   validateOmgOnlineSnapshot(result.snapshot);return result.snapshot;
 }
 function persistOmgSnapshot(snapshot,token,origin,online=false){return queueOmgWrite(async()=>{
   if(token!==omgRequest)throw Error('OMG update superseded');const entry=online?validateOmgOnlineSnapshot(snapshot):validateOmgSnapshot(snapshot);
   // Keep only validated bibliographic metadata. Imported files cannot claim an
   // online origin; this access marker is assigned by the local service itself.
   const normalized={schemaVersion:1,sourceId:'omg-specifications',provenance:{url:omg.CATALOG,acquiredAt:entry.acquiredAt,sha256:entry.sha256,localOrigin:origin},records:entry.rows.map(({sourceId,sourceKey,acronym,version,variant,url,title,designation,edition,status,publicationDate})=>({sourceId,sourceKey,acronym,version,variant,url,title,designation,edition,status,publicationDate})),isoAdoptions:entry.adoptionRows.map(({sourceId,sourceKey,acronym,version,variant,url,title,isoAdoptions,omgFileIds})=>({subject:{sourceId,sourceKey,acronym,version,variant,url},title,relationType:'omg-reports-iso-adoption',isoDesignations:isoAdoptions,omgFileIds})),coverage:{...entry.coverage,rejected:Array.from({length:entry.coverage.rejected},()=>({reason:'Rejected source row'}))},distribution:'private-only'};
   const saved=await cached(OMG_CACHE_KEY,normalized);if(token!==omgRequest)throw Error('OMG update superseded');return commitOmg(entry,saved?'browser-cache':'session-only',origin);
 });}
 async function importOmg(value,{format='json'}={}){
   requireAuthor();const token=++omgRequest;if(typeof value!=='string'||new TextEncoder().encode(value).byteLength>omg.LIMIT)throw Error('OMG input exceeds size limit');
   const snapshot=format==='html'?omg.parseOmgCatalog(value,{acquiredAt:null,sourceDigest:await digestText(value)}):format==='json'?JSON.parse(value):null;
   return persistOmgSnapshot(snapshot,token,'local-unverified');
 }
 async function loadOmgOnline({fetcher=root.fetch?.bind(root)}={}){
   requireAuthor();const token=++omgRequest;if(typeof fetcher!=='function')throw Error('OMG fetch unavailable');
   // The same-origin relay is a fixed single-index endpoint, not a general proxy.
   // An absent relay falls back to direct CORS; an actual upstream failure does not retry.
   let snapshot=await requestOmgRelay('refresh',fetcher),origin='local-relay';
   if(token!==omgRequest)throw Error('OMG update superseded');
   if(!snapshot){snapshot=await readOmgPublicCatalog({fetcher});origin='official-fetch';}
   return persistOmgSnapshot(snapshot,token,origin,true);
 }
 async function loadOmgPrepared({fetcher=root.fetch?.bind(root)}={}){
   requireAuthor();const token=++omgRequest;if(typeof fetcher!=='function')throw Error('OMG fetch unavailable');
   const snapshot=await requestOmgRelay('current',fetcher);if(!snapshot)throw Error('Prepared OMG corpus relay unavailable — start the local Creator server or import a prepared file');
   return persistOmgSnapshot(snapshot,token,'local-prepared',true);
 }
 async function restoreOmg(){requireAuthor();const token=omgRequest;return queueOmgWrite(async()=>{if(token!==omgRequest||omgEntry)return omgStatus();const snapshot=await cached(OMG_CACHE_KEY);if(token!==omgRequest)return omgStatus();if(!snapshot)return null;const entry=validateOmgSnapshot(snapshot);const origin=OMG_ORIGINS.includes(snapshot.provenance.localOrigin)?snapshot.provenance.localOrigin:'local-unverified';return commitOmg(entry,'browser-cache',origin);});}
 function searchOmg(query='',offset=0,adoptions=false){requireAuthor();if(!omgEntry)return {generation:null,total:0,rows:[]};if(!Number.isSafeInteger(offset)||offset<0)throw Error('Invalid offset');const q=norm(query);const rows=(adoptions?omgEntry.adoptionRows:omgEntry.rows).filter(r=>!q||norm([r.designation,r.title,r.edition,r.status,r.publicationDate,...r.isoAdoptions].join(' ')).includes(q));return {generation:omgEntry.generation,total:rows.length,rows:copy(rows.slice(offset,offset+100))};}
 root.__radarStandardSources=Object.freeze({omg,loadOmgHistory,restoreOmgHistory,importOmgHistory,exportOmgHistory,searchOmgHistory,omgHistoryStatus,selectedOmgHistory,selectedOmgCurrent,readOmgHistory,validateOmgHistory,importOmg,restoreOmg,searchOmg,omgStatus,clearOmg,readOmgPublicCatalog,validateOmgOnlineSnapshot,loadOmgOnline,loadOmgPrepared,omgHasLocalRelay,descriptors,knowledgeConcepts,listResources,getResource,describeNativeReference,readRfcContext,normalizeRfcContext,RFC,W3C,rfcRecord,countRfcEntries,parseRfcIndex,w3cLink,w3cRecord,acquireIndex,acquireVersions,validateIndex,validateVersions,load,loadVersions,search,selected,status});
})(typeof window!=='undefined'?window:globalThis);
