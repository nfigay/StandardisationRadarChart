import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {project,sourceApi,publish} from '../tools/prepare-omg-public-links.mjs';
const source=readFileSync(new URL('../js/radar-standard-sources.js',import.meta.url),'utf8');
const panel=readFileSync(new URL('../js/radar-standards-panel.js',import.meta.url),'utf8');
const api=sourceApi(source);
const isoDate='2026-11-17T07:48:15.731Z';
// Synthetic complete fixture: only canonical official identifiers, formal-version dates and URLs.
const editions=[['2.5.1','2017-12'],['2.4.1','2011-07'],['2.3','2010-05'],['2.2','2009-01'],['2.1.2','2007-10'],['2.0','2005-07'],['1.5','2003-03'],['1.4','2001-09'],['1.3','2000-02'],['1.2','1999-07'],['1.1','1997-12']];
const history={schemaVersion:1,sourceId:'omg-formal-history',family:'UML',distribution:'private-only',provenance:{url:'https://www.omg.org/spec/UML/',acquiredAt:isoDate,sha256:'0'.repeat(64)},coverage:{complete:true,historyTables:1,formalVersions:11},records:editions.map(([version,publicationDate])=>({sourceId:'omg-specifications',sourceKey:'UML/'+version,key:'UML/'+version,acronym:'UML',version,variant:null,url:'https://www.omg.org/spec/UML/'+version,status:'formal',publicationDate,historyEvidence:'https://www.omg.org/spec/UML/',historyRelation:'formal-version-reported',title:'UML '+version}))};
const publicHistory=project(history,api,{family:'UML'});
function fresh(location='https://nfigay.github.io/StandardisationRadarChart/author/radar.html'){
  const root={location:{href:location},__radarApplicationProfile:{viewer:false,require(){}},fetch:null};
  const ctx=vm.createContext({window:root,URL,TextEncoder,TextDecoder,AbortSignal,Uint8Array});
  vm.runInContext(source,ctx);
  return root.__radarStandardSources;
}
function response(obj,url){const bytes=new TextEncoder().encode(JSON.stringify(obj));return {ok:true,status:200,url,headers:{get:n=>n==='content-type'?'application/json':String(bytes.length)},arrayBuffer:async()=>bytes.buffer};}
test('published UML formal links preserve eleven distinct official edition identities without descriptions',()=>{
  assert.equal(publicHistory.records.length,11);
  assert.ok(publicHistory.records.some(x=>x.url.endsWith('/UML/2.5.1')));
  assert.deepEqual(Object.keys(publicHistory.records[0]).sort(),['publicationDate','url']);
  const s=fresh();assert.equal(s.validateOmgPublicHistory(publicHistory,'UML').rows.length,11);
});
test('OMG public index rejects invented, duplicate or off-origin references',()=>{
 const s=fresh();const payload={schemaVersion:1,sourceId:'omg-public-links',distribution:'public-links-only',provenance:{url:'https://www.omg.org/spec/',acquiredAt:isoDate},coverage:{complete:true,records:1},records:[{url:'https://www.omg.org/spec/UML/2.5.1',status:'formal',publicationDate:'2017-12'}]};
 assert.equal(s.validateOmgPublicLinks(payload).rows[0].key,'UML/2.5.1');
 for(const bad of ['https://evil.example/spec/UML/2.5.1','https://www.omg.org/spec/UML/../../secret'])assert.throws(()=>s.validateOmgPublicLinks({...payload,records:[{...payload.records[0],url:bad}]}));
 assert.throws(()=>s.validateOmgPublicLinks({...payload,records:[payload.records[0],payload.records[0]],coverage:{complete:true,records:2}}));
 assert.throws(()=>s.validateOmgPublicLinks({...payload,distribution:'private-only'}));
});
test('Pages loads same-origin public OMG references, not a private cache',async()=>{
 const s=fresh();const payload={schemaVersion:1,sourceId:'omg-public-links',distribution:'public-links-only',provenance:{url:'https://www.omg.org/spec/',acquiredAt:isoDate},coverage:{complete:true,records:1},records:[{url:'https://www.omg.org/spec/UML/2.5.1',status:'formal',publicationDate:'2017-12'}]};
 let requested;const view=await s.loadOmgPublished({fetcher:async(url,opts)=>{requested=url;assert.equal(opts.credentials,'omit');return response(payload,url);}});
 assert.ok(requested.endsWith('/StandardisationRadarChart/catalog-distribution/omg-public/index.json'));
 assert.equal(view.count,1);assert.equal(view.distribution,'public-links-only');
 assert.equal(s.searchOmg('UML').total,1);
 assert.equal(s.selectedOmgCurrent('UML/2.5.1',s.searchOmg('UML').generation).verification,'source-verified');
});
test('OMG history public page fetch does not modify catalogue and keeps separate versions',async()=>{
 const s=fresh('https://nfigay.github.io/StandardisationRadarChart/radar.html');
 let url;const status=await s.loadOmgPublishedHistory('UML',{fetcher:async(u)=>{url=u;return response(publicHistory,u);}});
 assert.equal(status.count,11);assert.equal(s.searchOmgHistory('UML').total,11);
 assert.ok(url.endsWith('/StandardisationRadarChart/catalog-distribution/omg-public/histories/UML.json'));
 assert.throws(()=>s.validateOmgPublicHistory({...publicHistory,family:'other'},'UML'));
});
test('Viewer is forbidden to acquire public OMG references',async()=>{
 const root={location:{href:'https://example.org/radar.html'},__radarApplicationProfile:{viewer:true,require(){}}};
 const ctx=vm.createContext({window:root,URL,TextEncoder,TextDecoder,AbortSignal,Uint8Array});vm.runInContext(source,ctx);
 await assert.rejects(root.__radarStandardSources.loadOmgPublished(),/denied/);
});
test('UI offers same-origin OMG load even without local relay and preserves JSON fallback',()=>{
 assert.match(panel,/omgPublished','resourceOmgPublished/);
 assert.match(panel,/loadOmgPublishedHistory\(row\.acronym\)/);
 assert.match(panel,/\['omgImport','resourceImport'\]/);
 assert.doesNotMatch(panel,/api\.importOmgReference\(row\.key,[^\n]*omgPublished/);
});

test('OMG links projection is minimal and rejects incomplete sources',()=>{
 const catalog={schemaVersion:1,sourceId:'omg-specifications',distribution:'private-only',provenance:{url:'https://www.omg.org/spec/',acquiredAt:isoDate,sha256:'0'.repeat(64)},coverage:{complete:true,indexTables:2,adoptionTables:1,rejected:[],tables:[{kind:'index',rows:1,accepted:1,declaredTotal:1},{kind:'index',rows:1,accepted:1,declaredTotal:1},{kind:'adoptions',rows:1,accepted:1,declaredTotal:1}]},records:[{sourceId:'omg-specifications',sourceKey:'UML/2.5.1',acronym:'UML',version:'2.5.1',variant:null,url:'https://www.omg.org/spec/UML/2.5.1',title:'Source title must never be published',designation:'UML',edition:'2.5.1',status:'formal',publicationDate:'2017-12'}],isoAdoptions:[{subject:{sourceId:'omg-specifications',sourceKey:'UML/2.5.1',acronym:'UML',version:'2.5.1',variant:null,url:'https://www.omg.org/spec/UML/2.5.1'},title:'Secret source title',relationType:'omg-reports-iso-adoption',isoDesignations:['19505:2012'],omgFileIds:[]}]};
 const projected=project(catalog,api);assert.equal(projected.records.length,1);assert.equal(JSON.stringify(projected).includes('Source title'),false);assert.equal(JSON.stringify(projected).includes('19505'),false);

 assert.throws(()=>project({...catalog,coverage:{...catalog.coverage,complete:false}},api),/Incomplete/);
});
