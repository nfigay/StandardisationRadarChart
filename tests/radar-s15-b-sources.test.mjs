import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {randomUUID} from 'node:crypto';
import '../js/radar-standard-sources.js';
const core=globalThis.__radarStandardSources;
const src=n=>readFileSync(new URL('../js/'+n+'.js',import.meta.url),'utf8');
const plain=x=>JSON.parse(JSON.stringify(x));
const w3cBase='https://api.w3.org/specifications';
const series={href:w3cBase+'/json-ld11',title:'JSON-LD 1.1'};
const second={href:w3cBase+'/rdf11-concepts',title:'RDF 1.1 Concepts'};
const version=(date='2020-07-16',status='Recommendation')=>({title:'JSON-LD 1.1',date,status,uri:'https://www.w3.org/TR/'+date.slice(0,4)+'/REC-json-ld11-'+date.replace(/-/g,'')+'/',_links:{self:{href:w3cBase+'/json-ld11/versions/'+date.replace(/-/g,'')}}});
const rfcRaw={docId:'RFC9110',title:'HTTP Semantics',month:'June',year:'2022',stream:'IETF',status:'INTERNET STANDARD'};
const xml='<rfc-index xmlns="https://www.rfc-editor.org/rfc-index"><rfc-entry><doc-id>RFC9110</doc-id><title>HTTP Semantics</title><date><month>June</month><year>2022</year></date><stream>IETF</stream><current-status>INTERNET STANDARD</current-status></rfc-entry></rfc-index>';
const stamp='2026-11-15T00:00:00.000Z';
const response=x=>new Response(typeof x==='string'?x:JSON.stringify(x));
const w3cIndex={schemaVersion:1,sourceId:'w3c',acquiredAt:stamp,payload:[core.w3cLink(series),core.w3cLink(second)]};
const w3cVersions={schemaVersion:1,sourceId:'w3c',shortname:'json-ld11',acquiredAt:stamp,payload:[core.w3cRecord(version(),'json-ld11'),core.w3cRecord(version('2018-12-18','Working Draft'),'json-ld11')]};
// The real XML DOMParser is covered by the isolated Chrome fixture. Node uses
// the pure RFC normalization and official response boundary, without a fake XML parser.
function model(standards=[]){return {schemaVersion:'1.0.0',title:'Test',organizations:[{organizationId:'org',name:'Org'}],portfolios:[{portfolioId:'port',ownerOrganizationId:'org',name:'Port'}],standards,assessments:[],radarRevisions:[{schemaVersion:'1.0.0',revisionId:'draft',radarId:'rad',ownerOrganizationId:'org',portfolioId:'port',status:'draft',blips:[]},{schemaVersion:'1.0.0',revisionId:'pub',radarId:'rad',ownerOrganizationId:'org',portfolioId:'port',status:'published',blips:[]}]};}
function environment({viewer=false,standards=[],fetcher}={}){
 const calls=[];
 const root={location:{href:'http://localhost/radar.html',search:viewer?'?profile=viewer':''},URLSearchParams,crypto:{randomUUID},console,__radarRevisionSession:{exportGroup:()=>null,status:()=>({activeGroup:'g0'})},fetch:async url=>{calls.push(url);if(fetcher)return fetcher(url);if(url.endsWith('standard-source-cache/w3c.json'))return response(w3cIndex);if(url.endsWith('standard-source-cache/w3c-json-ld11.json'))return response(w3cVersions);throw Error('network disabled');}};
 const context=vm.createContext({window:root,URL,URLSearchParams,AbortSignal,TextDecoder,console});
 for(const name of ['radar-application-profile','radar-publication-model','radar-publication-projection','radar-standard-sources','radar-catalog-persistence','radar-standard-registry','radar-catalog-creation'])vm.runInContext(src(name),context,{filename:name+'.js'});
 const store=root.__radarCatalogPersistence,api=root.__radarStandardSources;
 const data=model(standards);if(viewer)data.radarRevisions.shift();
 store.remember(data,{revisions:viewer?[{group:'g1',revisionId:'pub'}]:[{group:'g0',revisionId:'draft'},{group:'g1',revisionId:'pub'}]});
 return {root,store,api,calls,context};
}
const config={name:'Test',description:'',audience:{label:'Test',organizationIds:[]},scope:{selection:'explicit',revisionIds:['pub'],radarIds:[],organizationIds:[],portfolioIds:[]},capabilities:['catalog.open','radar.navigate','radar.consult'],presentation:{title:'Test',language:'en',references:true},packaging:{modes:['standalone'],data:'embedded'},dataPolicy:{isoDocument:true,assessments:false,extensions:'allowlist'}};
test('S15-B RFC normalization preserves publication identity, date, status and non-IETF streams',()=>{
 const r=core.rfcRecord(rfcRaw);assert.equal(r.key,'9110');assert.equal(r.designation,'RFC 9110');assert.equal(r.edition,'2022-06');assert.equal(r.issuer,'IETF');assert.equal(r.url,'https://www.rfc-editor.org/rfc/rfc9110');assert.equal(r.status,'INTERNET STANDARD');
 assert.equal(core.rfcRecord({...rfcRaw,docId:'RFC0001',stream:''}).issuer,'RFC Series');assert.equal(core.rfcRecord({...rfcRaw,stream:'Independent Submission',status:'INFORMATIONAL'}).issuer,'Independent Submission');assert.throws(()=>core.rfcRecord({...rfcRaw,docId:'STD1'}),/RFC identifier/);
});
test('S15-B official RFC index acquisition enforces expected XML and rejects entity declarations',async()=>{
 const s=await core.acquireIndex('rfc-editor',async url=>{assert.equal(url,core.RFC);return response(xml);});assert.equal(s.payload,xml);assert.equal(s.sourceId,'rfc-editor');
 await assert.rejects(core.acquireIndex('rfc-editor',async()=>response('<!DOCTYPE rfc-index><rfc-index><rfc-entry/></rfc-index>')),/Invalid RFC XML/);await assert.rejects(core.acquireIndex('rfc-editor',async()=>response('<html>bad</html>')),/Invalid RFC XML/);
});
test('S15-B W3C catalogue follows all HAL pages, rejects duplicates and foreign links',async()=>{
 const calls=[];const result=await core.acquireIndex('w3c',async url=>{calls.push(url);return response(calls.length===1?{page:1,pages:2,_links:{specifications:[series],next:{href:w3cBase+'?page=2&items=1000'}}}:{page:2,pages:2,_links:{specifications:[second]}});});
 assert.equal(calls.length,2);assert.equal(result.payload.length,2);assert.equal(result.payload[0].key,'json-ld11');
 await assert.rejects(core.acquireIndex('w3c',async()=>response({_links:{specifications:[series,series]}})),/Duplicate source identity/);
 await assert.rejects(core.acquireIndex('w3c',async()=>response({_links:{specifications:[series],next:{href:'https://other.example/specifications'}}})),/Invalid W3C pagination/);
 await assert.rejects(core.acquireIndex('w3c',async()=>response({page:1,pages:2,_links:{specifications:[series]}})),/Incomplete W3C pagination/);
 assert.throws(()=>core.w3cLink({href:'https://evil.example/specifications/test',title:'X'}),/Invalid W3C/);
});
test('S15-B W3C versions are dated, retain source status and reject mutable or foreign URLs',async()=>{
 const v=version(),r=core.w3cRecord(v,'json-ld11');assert.equal(r.key,'json-ld11:20200716');assert.equal(r.edition,'2020-07-16');assert.equal(r.status,'Recommendation');
 assert.equal(core.w3cRecord({...v,uri:v.uri.replace('https:','http:')},'json-ld11').url,v.uri);
 for(const uri of ['https://www.w3.org/TR/json-ld11/','https://evil.example/TR/2020/REC-json-ld11-20200716/','https://www.w3.org/TR/2020/REC-json-ld11-20200715/'])assert.throws(()=>core.w3cRecord({...v,uri},'json-ld11'),/dated TR URI/);
 assert.throws(()=>core.w3cRecord({...v,date:'2020-02-31'},'json-ld11'),/version date/);
 const out=await core.acquireVersions('json-ld11',async()=>response({_embedded:{'version-history':[v,version('2018-12-18','Working Draft'),{...v,uri:'https://www.w3.org/TR/json-ld11/'}]}}));assert.equal(out.payload.length,2);assert.equal(out.unsupported,1);
});
test('S15-B W3C version acquisition resolves link-only HAL responses on the official endpoint',async()=>{
 const v=version(),calls=[];const out=await core.acquireVersions('json-ld11',async url=>{calls.push(url);return response(calls.length===1?{_links:{'version-history':[{href:v._links.self.href,title:v.status}]}}:v);});assert.equal(out.payload[0].key,'json-ld11:20200716');assert.equal(calls[1],v._links.self.href);
 await assert.rejects(core.acquireVersions('json-ld11',async()=>response({_links:{'version-history':[{href:'https://evil.example/20200716'}]}})),/Invalid W3C version link/);
});
test('S15-B optional local cache loads without remote requests, bounded search and selection generation',async()=>{
 const x=environment();assert.equal(x.calls.length,0);const s=await x.api.load('w3c');assert.equal(s.storage,'local-cache');assert.equal(s.count,2);assert.equal(x.api.search('w3c','rdf').rows[0].key,'rdf11-concepts');
 assert.throws(()=>x.api.selected('w3c','json-ld11',s.generation),/stale/);await x.api.loadVersions('json-ld11');const result=x.api.search('w3c','','json-ld11');assert.equal(result.rows.length,2);const pick=x.api.selected('w3c',result.rows[0].key,result.generation);assert.equal(pick.acquiredAt,stamp);assert.equal(pick.status,'Recommendation');pick.title='altered';assert.notEqual(x.api.selected('w3c',pick.key,result.generation).title,'altered');
 assert.equal(x.calls.length,2);assert.ok(x.calls.every(u=>u.includes('standard-source-cache')));
});
test('S15-B integration preserves native ownership, stable IDs, idempotency and portable data',async()=>{
 const x=environment();await x.api.load('w3c');await x.api.loadVersions('json-ld11');const rows=x.api.search('w3c','','json-ld11');const before=plain(x.store.build(null).radarRevisions);const a=x.store.importSourceReference('w3c',rows.rows[0].key,rows.generation);assert.equal(a.standardId,'w3c-tr:json-ld11:20200716');assert.equal(a.action,'imported');assert.equal(x.store.importSourceReference('w3c',rows.rows[0].key,rows.generation).action,'existing');
 const b=x.store.importSourceReference('w3c',rows.rows[1].key,rows.generation);assert.notEqual(a.standardId,b.standardId);const all=plain(x.store.listReferenceRecords());assert.equal(all.length,2);assert.equal(all[0].verification,'source-verified');assert.equal(all[0].origin,'w3c');assert.equal(all[0].sourceUrl,version().uri);assert.equal(all[0].externalDocument.status,'Recommendation');assert.deepEqual(plain(x.store.build(null).radarRevisions),before);
 const exported=plain(x.store.build(null));x.store.closeCatalog();x.store.remember(exported,{revisions:[{group:'g0',revisionId:'draft'},{group:'g1',revisionId:'pub'}]});assert.deepEqual(plain(x.store.listReferenceRecords()),all);
});
test('S15-B source integration refuses manual conflicts and never silently promotes a declaration',async()=>{
 const x=environment();x.root.__radarStandardRegistry.declare({name:'JSON LD',issuer:'W3C',designation:'json-ld11'});await x.api.load('w3c');await x.api.loadVersions('json-ld11');const r=x.api.search('w3c','','json-ld11');assert.throws(()=>x.store.importSourceReference('w3c',r.rows[0].key,r.generation),/reconcile/);assert.equal(x.store.listReferenceRecords()[0].verification,'unverified');assert.equal(x.store.listReferenceRecords().length,1);
 const y=environment();await y.api.load('w3c');await y.api.loadVersions('json-ld11');const q=y.api.search('w3c','','json-ld11');y.store.importSourceReference('w3c',q.rows[0].key,q.generation);assert.throws(()=>y.root.__radarStandardRegistry.declare({name:'JSON LD',issuer:'W3C',designation:'json-ld11'}),/already declared/);assert.doesNotThrow(()=>y.root.__radarStandardRegistry.declare({name:'JSON LD',issuer:'W3C',designation:'json-ld11',editionDesignation:'2018-12-18'}));
});
test('S15-B RFC number conflicts across declared year formatting without modifying existing references',()=>{
 const x=environment();const record={schemaVersion:1,...core.rfcRecord(rfcRaw),acquiredAt:stamp};x.root.__radarStandardSources={selected:()=>record};const first=x.store.importSourceReference('rfc-editor','9110',1);assert.equal(first.standardId,'rfc:9110');assert.throws(()=>x.root.__radarStandardRegistry.declare({name:'HTTP',issuer:'IETF',designation:'RFC9110',editionDesignation:'2022'}),/already declared/);
 const y=environment();y.root.__radarStandardRegistry.declare({name:'HTTP',issuer:'IETF',designation:'RFC 9110',editionDesignation:'2022'});y.root.__radarStandardSources={selected:()=>record};assert.throws(()=>y.store.importSourceReference('rfc-editor','9110',1),/reconcile/);assert.equal(y.store.listReferenceRecords()[0].origin,'manual');
});
test('S15-B source refresh failure preserves active snapshot; stale generations cannot be integrated',async()=>{
 let allow=false;const x=environment({fetcher:async url=>{if(url.endsWith('standard-source-cache/w3c.json'))return response(w3cIndex);if(url.endsWith('standard-source-cache/w3c-json-ld11.json'))return response(w3cVersions);if(allow&&url.startsWith(w3cBase+'/json-ld11/versions?'))return response({_embedded:{'version-history':[version()]}});throw Error('offline');}});
 await x.api.load('w3c');await x.api.loadVersions('json-ld11');const r=x.api.search('w3c','','json-ld11');await assert.rejects(x.api.loadVersions('json-ld11',{refresh:true}),/offline/);assert.equal(x.api.search('w3c','','json-ld11').generation,r.generation);
 allow=true;await x.api.loadVersions('json-ld11',{refresh:true});assert.throws(()=>x.store.importSourceReference('w3c',r.rows[0].key,r.generation),/stale/);assert.equal(x.store.listReferenceRecords().length,0);
});
test('S15-B Viewer cannot acquire or integrate sources and performs no network request at startup',async()=>{
 const x=environment({viewer:true});await assert.rejects(x.api.load('w3c'),/denied/i);assert.throws(()=>x.api.search('w3c'),/denied/i);assert.throws(()=>x.store.importSourceReference('w3c','json-ld11:20200716',1),/Viewer/);assert.equal(x.calls.length,0);
});
test('S15-B published projection preserves source provenance, omits new raw snapshot and unrelated records',async()=>{
 const x=environment();await x.api.load('w3c');await x.api.loadVersions('json-ld11');const q=x.api.search('w3c','','json-ld11');const a=x.store.importSourceReference('w3c',q.rows[0].key,q.generation);x.store.importSourceReference('w3c',q.rows[1].key,q.generation);
 const data=plain(x.store.build(null));data.radarRevisions[1].blips.push({blipId:'b',standardId:a.standardId,label:'JSON LD',ring:'Track',quadrant:'Developed',position:{x:1,y:2}});const projection=x.root.__radarPublicationProjection.project(data,config);assert.equal(projection.catalog.standards.length,1);const standard=projection.catalog.standards[0];assert.equal(standard.standardId,a.standardId);assert.equal(standard.extensions.referenceDeclaration.origin,'w3c');assert.equal(standard.extensions.referenceDeclaration.verification,'source-verified');assert.equal(standard.extensions.referenceDeclaration.sourceUrl,undefined);assert.equal(standard.extensions.externalDocument,undefined);
});

// Index fixture: five actual entries from W3C HAL response of 2026-11-15.
// Descriptions intentionally omitted; version fixture uses the official dated TR URI and Note status, not a live API response.
const historicalSeries=[
  {
    "shortname": "daml+oil-axioms",
    "title": "An Axiomatic Semantics for RDF, RDF-S, and DAML+OIL (March 2001)",
    "_links": {
      "self": {
        "href": "https://api.w3.org/specifications/daml+oil-axioms"
      },
      "version-history": {
        "href": "https://api.w3.org/specifications/daml+oil-axioms/versions"
      },
      "first-version": {
        "href": "https://api.w3.org/specifications/daml+oil-axioms/versions/20011218",
        "title": "Note"
      },
      "latest-version": {
        "href": "https://api.w3.org/specifications/daml+oil-axioms/versions/20011218",
        "title": "Note"
      },
      "series": {
        "href": "https://api.w3.org/specification-series/daml+oil-axioms"
      }
    }
  },
  {
    "shortname": "daml+oil-model",
    "title": "A Model-Theoretic Semantics for DAML+OIL (March 2001)",
    "_links": {
      "self": {
        "href": "https://api.w3.org/specifications/daml+oil-model"
      },
      "version-history": {
        "href": "https://api.w3.org/specifications/daml+oil-model/versions"
      },
      "first-version": {
        "href": "https://api.w3.org/specifications/daml+oil-model/versions/20011218",
        "title": "Note"
      },
      "latest-version": {
        "href": "https://api.w3.org/specifications/daml+oil-model/versions/20011218",
        "title": "Note"
      },
      "series": {
        "href": "https://api.w3.org/specification-series/daml+oil-model"
      }
    }
  },
  {
    "shortname": "daml+oil-reference",
    "title": "DAML+OIL (March 2001) Reference Description",
    "_links": {
      "self": {
        "href": "https://api.w3.org/specifications/daml+oil-reference"
      },
      "version-history": {
        "href": "https://api.w3.org/specifications/daml+oil-reference/versions"
      },
      "first-version": {
        "href": "https://api.w3.org/specifications/daml+oil-reference/versions/20011218",
        "title": "Note"
      },
      "latest-version": {
        "href": "https://api.w3.org/specifications/daml+oil-reference/versions/20011218",
        "title": "Note"
      },
      "series": {
        "href": "https://api.w3.org/specification-series/daml+oil-reference"
      }
    }
  },
  {
    "shortname": "daml+oil-walkthru",
    "title": "Annotated DAML+OIL Ontology Markup",
    "_links": {
      "self": {
        "href": "https://api.w3.org/specifications/daml+oil-walkthru"
      },
      "version-history": {
        "href": "https://api.w3.org/specifications/daml+oil-walkthru/versions"
      },
      "first-version": {
        "href": "https://api.w3.org/specifications/daml+oil-walkthru/versions/20011218",
        "title": "Note"
      },
      "latest-version": {
        "href": "https://api.w3.org/specifications/daml+oil-walkthru/versions/20011218",
        "title": "Note"
      },
      "series": {
        "href": "https://api.w3.org/specification-series/daml+oil-walkthru"
      }
    }
  },
  {
    "shortname": "xhtml+voice",
    "title": "XHTML+Voice Profile 1.0",
    "_links": {
      "self": {
        "href": "https://api.w3.org/specifications/xhtml+voice"
      },
      "version-history": {
        "href": "https://api.w3.org/specifications/xhtml+voice/versions"
      },
      "first-version": {
        "href": "https://api.w3.org/specifications/xhtml+voice/versions/20011221",
        "title": "Note"
      },
      "latest-version": {
        "href": "https://api.w3.org/specifications/xhtml+voice/versions/20011221",
        "title": "Note"
      },
      "series": {
        "href": "https://api.w3.org/specification-series/xhtml+voice"
      }
    }
  }
];
const historicalShort='daml+oil-axioms';
const historicalVersion={title:historicalSeries[0].title,date:'2001-12-18',status:'Note',uri:'http://www.w3.org/TR/2001/NOTE-daml+oil-axioms-20011218',_links:{self:{href:w3cBase+'/'+historicalShort+'/versions/20011218'}}};
test('S15-B-R1 all five official plus shortnames survive paginated index and cache; foreign or unsafe paths remain rejected',async()=>{
 const snap=await core.acquireIndex('w3c',async url=>response(url.includes('page=2')?{page:2,pages:2,_embedded:{specifications:historicalSeries}}:{page:1,pages:2,_embedded:{specifications:[series]},_links:{next:{href:w3cBase+'?page=2&items=1000'}}}));
 assert.equal(snap.payload.length,6);assert.deepEqual(core.validateIndex(snap).slice(1).map(r=>r.key),historicalSeries.map(r=>r.shortname));
 for(const suffix of ['../evil','a/b','a%2Fb','a?b','a#b','a%2Bb'])assert.throws(()=>core.w3cLink({href:w3cBase+'/'+suffix,title:'X'}),/Invalid W3C/);
 assert.throws(()=>core.w3cLink({href:'https://evil.example/specifications/daml+oil-axioms',title:'X'}),/Invalid W3C/);
});
test('S15-B-R1 plus shortname version acquisition, cache, native identity, JSON roundtrip and schema contract',async()=>{
 const snap=await core.acquireVersions(historicalShort,async url=>{assert.equal(url,w3cBase+'/'+historicalShort+'/versions?items=1000&embed=1');return response({_embedded:{'version-history':[historicalVersion]}});});
 assert.equal(core.validateVersions(snap,historicalShort)[0].key,historicalShort+':20011218');
 assert.throws(()=>core.w3cRecord({...historicalVersion,_links:{self:{href:w3cBase+'/other/versions/20011218'}}},historicalShort),/identity mismatch/);
 assert.throws(()=>core.w3cRecord({...historicalVersion,uri:'https://www.w3.org/TR/daml+oil-axioms/'},historicalShort),/dated TR URI/);
 const x=environment({fetcher:async url=>{if(url.endsWith('standard-source-cache/w3c.json'))return response({schemaVersion:1,sourceId:'w3c',acquiredAt:stamp,payload:historicalSeries.map(core.w3cLink)});if(url.endsWith('standard-source-cache/w3c-'+historicalShort+'.json'))return response(snap);throw Error('Unexpected network '+url);}});
 await x.api.load('w3c');await x.api.loadVersions(historicalShort);const q=x.api.search('w3c','',historicalShort),key=historicalShort+':20011218';
 const a=x.store.importSourceReference('w3c',key,q.generation);assert.equal(a.standardId,'w3c-tr:'+key);assert.equal(x.store.importSourceReference('w3c',key,q.generation).action,'existing');
 const data=plain(x.store.build(null));const doc=data.standards[0].extensions.externalDocument;assert.equal(doc.status,'Note');assert.equal(doc.key,key);assert.equal(doc.url,historicalVersion.uri.replace('http:','https:'));
 const schema=JSON.parse(readFileSync(new URL('../docs/architecture/schemas/external-document-v1.schema.json',import.meta.url),'utf8'));assert.match(doc.key,new RegExp(schema.allOf[1].then.properties.key.pattern));
 x.store.closeCatalog();x.store.remember(data,{revisions:[{group:'g0',revisionId:'draft'},{group:'g1',revisionId:'pub'}]});assert.equal(x.store.listReferenceRecords()[0].standardId,a.standardId);assert.equal(x.store.listReferenceRecords()[0].externalDocument.status,'Note');
});
test('S15-B-R1 raw RFC entry count excludes XML comments and CDATA and agrees with fixture inventory',()=>{
 assert.equal(core.countRfcEntries(xml),1);
 assert.equal(core.countRfcEntries('<rfc-index><!-- <rfc-entry> --><![CDATA[<rfc-entry>]]><rfc-entry/><rfc:rfc-entry xmlns:rfc="urn:rfc"/><rfc-entry-other/></rfc-index>'),2);
 assert.throws(()=>core.countRfcEntries('<rfc-index/>'),/index size/);assert.throws(()=>core.countRfcEntries('<!DOCTYPE rfc-index><rfc-index><rfc-entry/></rfc-index>'),/Invalid RFC XML/);
});
