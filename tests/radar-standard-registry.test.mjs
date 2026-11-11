import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const scripts=['radar-catalog-persistence.js','radar-standard-registry.js'];
function setup(){
 const win={crypto:{randomUUID:()=> 'id-unique'}};win.window=win;
 const ctx=vm.createContext({window:win,Set,Map,JSON,Date,Error,String,Number,Object,Array});
 for(const file of scripts)vm.runInContext(fs.readFileSync(new URL('../js/'+file,import.meta.url),'utf8'),ctx);
 win.__radarRevisionSession={exportGroup:()=>null};
 const p=win.__radarCatalogPersistence,r=win.__radarStandardRegistry;
 const catalog={schemaVersion:'1.0.0',organizations:[{organizationId:'org'}],portfolios:[{portfolioId:'portfolio'}],
   standards:[{standardId:'legacy',name:'Existing standard'}],assessments:[],
   radarRevisions:[{schemaVersion:'1.0.0',revisionId:'rev',radarId:'rad',ownerOrganizationId:'org',portfolioId:'portfolio',status:'published',blips:[]}]};
 p.remember(catalog,{revisions:[{revisionId:'rev',group:'CATALOG_REVISION_0'}]});
 return {p,r,catalog};
}
test('registry reads imported records and does not mistake legacy for ISO verified',()=>{
 const {r}=setup();const rec=r.records('existing');assert.equal(rec.length,1);
 assert.equal(rec[0].standardId,'legacy');assert.equal(rec[0].verification,'unknown');
 assert.equal(r.records('iso non-existent').length,0);
});
test('manual declaration has explicit unverified origin and never changes published revision',()=>{
 const {p,r}=setup();const before=p.listReferenceRecords();
 const x=r.declare({name:'Test reference',issuer:'ISO',designation:'ISO 00000',sourceUrl:'https://example.invalid/ref'});
 assert.equal(x.declared,true);assert.equal(x.verification,'unverified');
 const records=p.listReferenceRecords();assert.equal(records.length,before.length+1);
 assert.equal(records.at(-1).origin,'manual');assert.equal(records.at(-1).verification,'unverified');
 assert.equal(records.at(-1).issuer,'ISO');
 // With no session snapshots build() retains the original immutable revision.
 assert.equal(p.build({}).radarRevisions[0].status,'published');
 assert.equal(p.build({}).radarRevisions[0].blips.length,0);
});
test('catalog is the only store; returned listing is defensive',()=>{
 const {p,r}=setup();r.declare({name:'Declared',issuer:'IEC',designation:'IEC 001'});
 const item=p.listReferenceRecords().at(-1);item.name='tampered';
 assert.equal(p.listReferenceRecords().at(-1).name,'Declared');
 assert.equal(p.build({}).standards.length,2);
});
test('incomplete declaration and unsafe URLs are rejected before commit',()=>{
 const {p,r}=setup();const n=p.listReferenceRecords().length;
 assert.throws(()=>r.declare({name:'Test',issuer:'ISO'}),/required/);
 assert.throws(()=>r.declare({name:'Test',issuer:'ISO',designation:'ISO X',sourceUrl:'javascript:alert(1)'}),/HTTPS/);
 assert.equal(p.listReferenceRecords().length,n);
});
test('search includes declared designation and issuer',()=>{
 const {r}=setup();r.declare({name:'Example',issuer:'IEC',designation:'IEC 5555'});
 assert.equal(r.records('5555')[0].issuer,'IEC');
 assert.equal(r.records('IEC')[0].name,'Example');
});
test('registry requires an actual imported catalog',()=>{
 const win={};win.window=win;const ctx=vm.createContext({window:win,JSON,Date,Error,String,Number,Object,Array});
 vm.runInContext(fs.readFileSync(new URL('../js/radar-standard-registry.js',import.meta.url),'utf8'),ctx);
 assert.throws(()=>win.__radarStandardRegistry.records(''),/unavailable/);
});
