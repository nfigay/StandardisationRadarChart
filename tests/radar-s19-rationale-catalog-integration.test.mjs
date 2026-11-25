import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const dir=new URL('../js/',import.meta.url);
const script=name=>readFileSync(new URL(name,dir),'utf8');
function makeRuntime(status='draft',initialExtensions=null){
 const win={__radarApplicationProfile:{require(){},assertCatalog(){},assertRevision(){}},
 __radarRevisionSession:{status(){return {groups:[]}},exportGroup(){return null}}};
 const realm={window:win,globalThis:win,console,Set,Map,JSON,Error};
 for(const file of ['radar-rationale-revision.js','radar-catalog-adapter.js','radar-catalog-persistence.js'])runInNewContext(script(file),realm,{filename:file});
 const rev={schemaVersion:'1.0.0',revisionId:'rev-a',radarId:'radar-a',ownerOrganizationId:'org-a',portfolioId:'port-a',status,blips:[{blipId:'blip-a',standardId:'std-a',label:'Alpha',ring:'Adopt',quadrant:'Tech',position:{x:1,y:2}}],extensions:initialExtensions||{radarGeometry:{rings:4},sourceRegistry:{keep:true}}};
 const catalog={organizations:[{organizationId:'org-a'}],standards:[{standardId:'std-a',name:'Alpha'}],portfolios:[{portfolioId:'port-a'}],radarRevisions:[rev]};
 const adapter=win.__radarCatalogAdapter,store=win.__radarCatalogPersistence;
 adapter.register('CATALOG_REVISION_0',rev);
 store.remember(catalog,{revisions:[{group:'CATALOG_REVISION_0',revisionId:'rev-a'}]}, {catalogId:'catalog-a',artifactId:'artifact-a',format:'StandardisationRadarChart',schemaVersion:'1.0.0'});
 const doc={rationaleId:'doc-a',standard:{id:'std-a',designation:'Alpha'},organization:{id:'org-a'},sections:{abstract:{type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'Alpha dossier'}]}]}}};
 return {win,adapter,store,rev,doc};
}
test('same dossier is written to adapter and durable catalog export',()=>{
 const {adapter,store,doc}=makeRuntime();
 assert.equal(store.isDirty({}),false);
 store.setDraftRationale('CATALOG_REVISION_0','rev-a',doc,false);
 adapter.setDraftRationale('CATALOG_REVISION_0','rev-a',doc,false);
 const stored=store.build({}).radarRevisions[0];
 assert.equal(stored.extensions.radarRationales.items[0].sections.abstract.content[0].content[0].text,'Alpha dossier');
 assert.equal(adapter.getRevision('CATALOG_REVISION_0').extensions.radarRationales.items[0].rationaleId,'doc-a');
 assert.equal(store.isDirty({}),true);
 assert.equal(stored.extensions.radarGeometry.rings,4);
 assert.equal(stored.extensions.sourceRegistry.keep,true);
});
test('edit modifies catalog revision rather than detached JSON library',()=>{
 const {adapter,store,doc}=makeRuntime();
 store.setDraftRationale('CATALOG_REVISION_0','rev-a',doc,false);adapter.setDraftRationale('CATALOG_REVISION_0','rev-a',doc,false);
 doc.sections.abstract.content[0].content[0].text='Updated';
 store.setDraftRationale('CATALOG_REVISION_0','rev-a',doc,true);adapter.setDraftRationale('CATALOG_REVISION_0','rev-a',doc,true);
 assert.equal(store.build({}).radarRevisions[0].extensions.radarRationales.items[0].sections.abstract.content[0].content[0].text,'Updated');
});
test('cannot silently replace a dossier and cannot change its owner',()=>{
 const {store,doc}=makeRuntime();
 store.setDraftRationale('CATALOG_REVISION_0','rev-a',doc,false);
 assert.throws(()=>store.setDraftRationale('CATALOG_REVISION_0','rev-a',doc,false),/replacement/);
 const different=structuredClone(doc);different.organization.id='other';
 assert.throws(()=>store.setDraftRationale('CATALOG_REVISION_0','rev-a',different,true),/rebind|owner organization/);
});
test('unknown standard is refused without changing the export',()=>{
 const {store,doc}=makeRuntime();
 doc.standard.id='std-unknown';
 const before=JSON.stringify(store.build({}));
 assert.throws(()=>store.setDraftRationale('CATALOG_REVISION_0','rev-a',doc,false),/standard not present/);
 assert.equal(JSON.stringify(store.build({})),before);
});
test('published revision remains immutable',()=>{
 const {adapter,store,doc}=makeRuntime('published');
 assert.throws(()=>store.setDraftRationale('CATALOG_REVISION_0','rev-a',doc,false),/draft/);
 assert.throws(()=>adapter.setDraftRationale('CATALOG_REVISION_0','rev-a',doc,false),/draft/);
});
test('saved catalog extensions survive a fresh import and keep foreign extensions',()=>{
 const {store,adapter,doc}=makeRuntime();
 store.setDraftRationale('CATALOG_REVISION_0','rev-a',doc,false);
 adapter.setDraftRationale('CATALOG_REVISION_0','rev-a',doc,false);
 const exported=store.build({}).radarRevisions[0];
 const reopened=makeRuntime('draft',exported.extensions);
 const loaded=reopened.adapter.getRevision('CATALOG_REVISION_0');
 assert.equal(loaded.extensions.radarRationales.items[0].rationaleId,'doc-a');
 assert.equal(reopened.store.build({}).radarRevisions[0].extensions.sourceRegistry.keep,true);
});
