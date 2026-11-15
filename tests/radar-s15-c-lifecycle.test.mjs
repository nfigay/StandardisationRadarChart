import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {randomUUID} from 'node:crypto';
const src=n=>readFileSync(new URL('../js/'+n+'.js',import.meta.url),'utf8');
const plain=x=>JSON.parse(JSON.stringify(x));
const doc=(overrides={})=>({schemaVersion:1,sourceId:'w3c',key:'json-ld11:20200716',issuer:'W3C',designation:'json-ld11',title:'JSON-LD 1.1',edition:'2020-07-16',status:'Recommendation',stream:null,url:'https://www.w3.org/TR/2020/REC-json-ld11-20200716/',acquiredAt:'2026-11-15T00:00:00.000Z',...overrides});
const manual=(id='local',edition='2020-07-16')=>({standardId:id,name:'Local JSON-LD',extensions:{referenceDeclaration:{issuer:'W3C',designation:'json-ld11',editionDesignation:edition,sourceName:'Manual entry',origin:'manual',verification:'unverified',declaredAt:'2026-11-15T00:00:00.000Z'}}});
const blip=(standardId,id='b')=>({blipId:id,standardId,label:'B',ring:'Track',quadrant:'Developed',position:{x:1,y:2}});
const nativeNode=(standardId,id='live')=>({data:{id,label:'Live',ring:'Track',quadrant:'Developed',working_group:'g0',type:'business-object',radarchart:{blipId:id,standardId,revisionId:'draft',radarId:'rad',ownerOrganizationId:'org',portfolioId:'port'}},position:{x:1,y:2}});
function env({standards=[manual()],draft=[],published=[],assessments=[],extensions,viewer=false}={}){
 let current=doc(),generation=1,snapshot=null,unavailable=false;
 const root={URLSearchParams,location:{search:viewer?'?profile=viewer':''},crypto:{randomUUID},console,__radarRevisionSession:{exportGroup:(_graph,group)=>{if(unavailable)throw Error('snapshot unavailable');return group==='g0'?snapshot:null;}},__radarStandardSources:{selected:(s,k,g)=>{if(g!==generation||s!==current.sourceId||k!==current.key)throw Error('Source selection is stale');return plain(current);}}};
 const context=vm.createContext({window:root,URL,URLSearchParams,console});
 for(const name of ['radar-application-profile','radar-publication-model','radar-publication-projection','radar-catalog-persistence'])vm.runInContext(src(name),context,{filename:name+'.js'});
 const make=(id,status,blips)=>({schemaVersion:'1.0.0',revisionId:id,radarId:'rad',ownerOrganizationId:'org',portfolioId:'port',status,blips});
 const revisions=viewer?[make('pub','published',published)]:[make('draft','draft',draft),make('pub','published',published)];
 const data={schemaVersion:'1.0.0',title:'Test',organizations:[{organizationId:'org',name:'Org'}],portfolios:[{portfolioId:'port',ownerOrganizationId:'org',name:'Port'}],standards,assessments,radarRevisions:revisions,...(extensions?{extensions}:{})};
 const store=root.__radarCatalogPersistence;store.remember(data,{revisions:revisions.map(r=>({revisionId:r.revisionId,group:r.revisionId==='draft'?'g0':'g1'}))});
 const plan=()=>store.sourceLifecyclePlan(null,current.sourceId,current.key,generation);
 const apply=(p=plan())=>store.applySourceLifecycle(null,{sourceId:current.sourceId,key:current.key,generation,action:p.action,standardId:p.standardId,token:p.token});
 return {store,plan,apply,setDoc:d=>{current=d;generation++;},setSnapshot:s=>{snapshot=s;},unavailable:()=>{unavailable=true;},root};
}
test('S15-C removal is explicit, changes only the native register and dirties the catalog',()=>{
 const x=env({standards:[manual(),{standardId:'other',name:'Other'}]});const original=plain(x.store.build(null));const p=x.store.referenceImpact(null,'local');assert.equal(p.unused,true);assert.equal(p.dependencies.length,0);assert.throws(()=>x.store.removeUnusedReference(null,'local','stale'),/changed/);assert.equal(x.store.listReferenceRecords().length,2);assert.equal(x.store.removeUnusedReference(null,'local',p.token).action,'removed');const result=plain(x.store.build(null));assert.deepEqual(result.radarRevisions,original.radarRevisions);assert.deepEqual(result.standards,[original.standards[1]]);assert.equal(x.store.isDirty(null),true);
});
test('S15-C all stored revisions and current graph blips block deletion; no cascade',()=>{
 const x=env({draft:[blip('local','stored')],published:[blip('local','published')]});x.setSnapshot({nodes:[nativeNode('local','live')],edges:[]});const p=x.store.referenceImpact(null,'local');assert.equal(p.unused,false);assert.deepEqual(plain(p.dependencies.map(d=>d.blipId)).sort(),['live','published','stored']);assert.throws(()=>x.store.removeUnusedReference(null,'local',p.token),/still in use/);assert.equal(x.store.listReferenceRecords().length,1);
});
test('S15-C unsaved newly created dependency is rechecked before mutation',()=>{
 const x=env();const p=x.store.referenceImpact(null,'local');assert.equal(p.unused,true);x.setSnapshot({nodes:[nativeNode('local')],edges:[]});assert.throws(()=>x.store.removeUnusedReference(null,'local',p.token),/still in use/);assert.equal(x.store.listReferenceRecords().length,1);
});
test('S15-C assessments and explicit extension references protect records',()=>{
 const x=env({assessments:[{assessmentId:'a',standardId:'local'}],extensions:{custom:{standardIds:['local']}}});const p=x.store.referenceImpact(null,'local');assert.deepEqual(plain(p.dependencies.map(d=>d.kind)).sort(),['assessment','other']);assert.throws(()=>x.store.removeUnusedReference(null,'local',p.token),/still in use/);
});
test('S15-C missing or invalid workspace snapshot fails closed',()=>{
 const x=env();const p=x.store.referenceImpact(null,'local');x.unavailable();assert.throws(()=>x.store.removeUnusedReference(null,'local',p.token),/snapshot unavailable/);assert.equal(x.store.listReferenceRecords().length,1);
});
test('S15-C exact unused local declaration reconciles in place with original provenance and stable id',()=>{
 const x=env();const p=x.plan();assert.equal(p.action,'reconcile');assert.equal(p.canApply,true);assert.ok(p.differences.some(d=>d.field==='title'));assert.equal(x.store.listReferenceRecords()[0].verification,'unverified');const result=x.apply(p);assert.equal(result.standardId,'local');const s=plain(x.store.build(null)).standards[0];assert.equal(s.name,'JSON-LD 1.1');assert.equal(s.extensions.referenceDeclaration.verification,'source-verified');assert.equal(s.extensions.referenceReconciliation.previousName,'Local JSON-LD');assert.equal(s.extensions.referenceReconciliation.previousDeclaration.verification,'unverified');assert.equal(s.extensions.externalDocument.key,doc().key);assert.equal(x.store.importSourceReference('w3c',doc().key,1).standardId,'local');assert.equal(x.plan().action,'existing');assert.equal(x.store.listReferenceRecords().length,1);
});
test('S15-C unknown or different edition never auto-reconciles; known different edition remains independent',()=>{
 const unknown=env({standards:[manual('local',null)]});assert.equal(unknown.plan().action,'conflict');assert.equal(unknown.plan().canApply,false);const other=env({standards:[manual('local','2018-12-18')]});assert.equal(other.plan().action,'new');const created=other.store.importSourceReference('w3c',doc().key,1);assert.equal(created.standardId,'w3c-tr:json-ld11:20200716');assert.equal(other.store.listReferenceRecords().length,2);
});
test('S15-C ambiguous exact declarations, source identity collision and used local notice block reconciliation',()=>{
 const ambiguous=env({standards:[manual('a'),manual('b')]});assert.equal(ambiguous.plan().action,'conflict');const collision=env({standards:[manual(),{standardId:'w3c-tr:json-ld11:20200716',name:'Other'}]});assert.equal(collision.plan().canApply,false);const used=env({published:[blip('local')]});const p=used.plan();assert.equal(p.action,'reconcile');assert.equal(p.canApply,false);assert.equal(p.reason,'in-use');assert.throws(()=>used.apply(p),/changed or reference is in use/);assert.equal(used.store.listReferenceRecords()[0].verification,'unverified');
});
test('S15-C source refresh compares metadata and never silently updates; explicit update only when unused',()=>{
 const x=env({standards:[]});const initial=x.store.importSourceReference('w3c',doc().key,1);x.setDoc(doc({title:'Corrected title',status:'Superseded Recommendation',acquiredAt:'2026-11-16T00:00:00.000Z'}));assert.equal(x.store.importSourceReference('w3c',doc().key,2).action,'existing');assert.equal(x.store.listReferenceRecords()[0].name,'JSON-LD 1.1');const plan=x.plan();assert.equal(plan.action,'refresh');assert.equal(plan.canApply,true);assert.deepEqual(plain(plan.differences.map(d=>d.field)).sort(),['status','title']);assert.equal(x.apply(plan).standardId,initial.standardId);assert.equal(x.store.listReferenceRecords()[0].externalDocument.status,'Superseded Recommendation');assert.equal(x.plan().action,'existing');
});
test('S15-C acquisition timestamp alone is not a business change; identity drift cannot be applied',()=>{
 const x=env({standards:[]});x.store.importSourceReference('w3c',doc().key,1);x.setDoc(doc({acquiredAt:'2026-11-16T00:00:00.000Z'}));assert.equal(x.plan().action,'existing');x.setDoc(doc({issuer:'Different issuer'}));const p=x.plan();assert.equal(p.action,'refresh');assert.equal(p.canApply,false);assert.equal(p.reason,'identity');assert.throws(()=>x.apply(p),/changed or reference is in use/);
});
test('S15-C used official records cannot be refreshed even if source status changes',()=>{
 const x=env({standards:[]});const id=x.store.importSourceReference('w3c',doc().key,1).standardId;x.setSnapshot({nodes:[nativeNode(id)],edges:[]});x.setDoc(doc({status:'Retired'}));const p=x.plan();assert.equal(p.reason,'in-use');assert.equal(p.canApply,false);assert.throws(()=>x.apply(p),/changed or reference is in use/);assert.equal(x.store.listReferenceRecords()[0].externalDocument.status,'Recommendation');
});
test('S15-C stale source generation and stale catalog token rejected without mutation',()=>{
 const x=env();const p=x.plan();x.setDoc(doc({title:'Corrected title'}));assert.throws(()=>x.store.applySourceLifecycle(null,{sourceId:'w3c',key:doc().key,generation:1,action:p.action,standardId:p.standardId,token:p.token}),/stale/);assert.throws(()=>x.apply({...x.plan(),token:'stale'}),/changed/);assert.equal(x.store.listReferenceRecords()[0].verification,'unverified');
});
test('S15-C Viewer rejects all lifecycle services',()=>{
 const x=env({viewer:true});for(const fn of [()=>x.store.referenceImpact(null,'local'),()=>x.store.removeUnusedReference(null,'local','x'),()=>x.plan(),()=>x.store.applySourceLifecycle(null,{})])assert.throws(fn,/Viewer/);
});

test('S15-C previous declaration remains private and a later published projection retains only approved provenance',()=>{
 const x=env();x.apply();const data=plain(x.store.build(null));data.radarRevisions[1].blips.push(blip('local'));const config={name:'Test',description:'',audience:{label:'Test',organizationIds:[]},scope:{selection:'explicit',revisionIds:['pub'],radarIds:[],organizationIds:[],portfolioIds:[]},capabilities:['catalog.open','radar.navigate','radar.consult'],presentation:{title:'Test',language:'en',references:true},packaging:{modes:['standalone'],data:'embedded'},dataPolicy:{isoDocument:true,assessments:false,extensions:'allowlist'}};const projected=x.root.__radarPublicationProjection.project(data,config).catalog.standards[0];assert.equal(projected.standardId,'local');assert.equal(projected.extensions.referenceDeclaration.origin,'w3c');assert.equal(projected.extensions.referenceDeclaration.verification,'source-verified');assert.equal(projected.extensions.referenceReconciliation,undefined);assert.equal(projected.extensions.externalDocument,undefined);
});
