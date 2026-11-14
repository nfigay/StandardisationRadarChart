import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const text=f=>readFileSync(new URL('../js/'+f,import.meta.url),'utf8');
const baseRecord={id:'62085',type:'deliverables',generation:'g1',reference:'ISO 9001:2015',title:'Quality management systems',titleI18n:{en:'Quality management systems'},scopeI18n:{en:'Requirements for quality management'},scope:'Requirements for quality management',icsCodes:['03.120.10','03.100.70','03.120.10'],ownerCommittee:'ISO/TC 176/SC 2',currentStage:'60.60',edition:5,publicationDate:'2015-09-01',deliverableType:'IS',languages:['en','fr'],pages:29,replaces:['100'],replacedBy:[],sourceData:{privateUnmappedField:'do not copy'}};
function fixture(standards=[]){return {schemaVersion:'1.0.0',title:'Demo',organizations:[{organizationId:'o'}],portfolios:[{portfolioId:'p'}],standards,assessments:[],radarRevisions:[{schemaVersion:'1.0.0',revisionId:'rev',radarId:'rad',ownerOrganizationId:'o',portfolioId:'p',status:'published',title:'Radar',version:'1.0.0',blips:[]},{schemaVersion:'1.0.0',revisionId:'draft',radarId:'rad',ownerOrganizationId:'o',portfolioId:'p',status:'draft',title:'Radar',version:'2.0.0',blips:[]}]};}
function setup({standards=[],viewer=false,opened=true}={}){
  let active={generation:'g1',summary:{release:'2026-11-09',datasets:{deliverables:{count:81768}}}},record=structuredClone(baseRecord),reads=0;
  const root={__radarApplicationProfile:{viewer,allows:c=>!viewer||c==='radar.consult'||c==='catalog.open',require(c){if(!this.allows(c))throw Error('Forbidden '+c);},assertCatalog(){}},crypto:{randomUUID:()=> 'uuid'},__radarRevisionSession:{exportGroup:()=>null},__radarArtifactIntegrity:{async wrap(data){return {artifact:{data},proof:{digest:'test'}};}},__radarIsoWindowed:{async current(){reads++;return structuredClone(active);},async get({id,type}){reads++;assert.equal(type,'deliverables');return record&&String(record.id)===id?structuredClone(record):null;}}};
  const context=vm.createContext({window:root});vm.runInContext(text('radar-catalog-persistence.js'),context);
  const store=root.__radarCatalogPersistence,graph={};
  function open(data=fixture(standards)){store.remember(data,{revisions:data.radarRevisions.map((r,i)=>({group:'g'+i,revisionId:r.revisionId}))},{catalogId:'catalog',artifactId:'artifact'});}
  if(opened)open();
  return {root,store,graph,open,reads:()=>reads,setRecord:r=>{record=r;},setActive:a=>{active=a;}};
}
const plain=x=>JSON.parse(JSON.stringify(x));
const add=x=>x.store.importIsoReference('62085');
test('ISO snapshot retains normalized metadata, source release and identity without raw source payload',async()=>{const x=setup();const result=await add(x);assert.equal(result.action,'imported');assert.equal(result.standardId,'iso-deliverable:62085');const s=x.store.build(x.graph).standards[0];assert.equal(s.extensions.referenceDeclaration.verification,'source-verified');assert.equal(s.extensions.referenceDeclaration.origin,'iso-open-data');const d=s.extensions.isoDocument;assert.equal(d.release,'2026-11-09');assert.equal(d.id,'62085');assert.equal(d.title,baseRecord.titleI18n.en);assert.equal(d.edition,'5');assert.deepEqual(plain(d.icsCodes),['03.120.10','03.100.70']);assert.equal(d.ownerCommittee,baseRecord.ownerCommittee);assert.equal(d.sourceData,undefined);assert.equal(d.titleI18n.fr,undefined);assert.equal(d.generation,undefined);});
test('ISO import marks workspace dirty, leaves published and draft revisions unchanged',async()=>{const x=setup();const before=x.store.build(x.graph).radarRevisions;assert.equal(x.store.isDirty(x.graph),false);await add(x);assert.equal(x.store.isDirty(x.graph),true);assert.deepEqual(x.store.build(x.graph).radarRevisions,before);});
test('repeated ISO identity is reused without changing stored snapshot',async()=>{const x=setup();await add(x);const before=x.store.build(x.graph);x.setRecord({...baseRecord,titleI18n:{en:'Changed title'}});x.setActive({generation:'g1',summary:{release:'2026-12-01',datasets:{deliverables:{count:81768}}}});assert.equal((await add(x)).action,'existing');assert.deepEqual(x.store.build(x.graph),before);});
test('concurrent selection of same ISO id creates only one standard',async()=>{const x=setup();const a=await Promise.all([add(x),add(x)]);assert.deepEqual(a.map(r=>r.action).sort(),['existing','imported']);assert.equal(x.store.build(x.graph).standards.length,1);});
test('manual exact designation collision is not silently upgraded',async()=>{const manual={standardId:'manual',name:'Manual declaration',extensions:{referenceDeclaration:{designation:' iso 9001:2015 ',issuer:'ISO',origin:'manual',verification:'unverified'}}};const x=setup({standards:[manual]});await assert.rejects(add(x),/same designation already exists/);assert.deepEqual(plain(x.store.build(x.graph).standards),[manual]);assert.equal(x.store.isDirty(x.graph),false);});
test('legacy name and reserved ID collisions are rejected',async()=>{for(const s of [{standardId:'legacy',name:'ISO 9001:2015'},{standardId:'iso-deliverable:62085',name:'Different'}]){const x=setup({standards:[s]});await assert.rejects(add(x),/collision|same designation/);assert.equal(x.store.isDirty(x.graph),false);}});
test('distinct ISO edition with distinct identifier is a separate standard',async()=>{const x=setup();await add(x);x.setRecord({...baseRecord,id:'70001',reference:'ISO 9001:2030'});assert.equal((await x.store.importIsoReference('70001')).action,'imported');assert.equal(x.store.build(x.graph).standards.length,2);});
test('missing catalogue or invalid identifier fails before reading global database',async()=>{const x=setup({opened:false});await assert.rejects(add(x),/exactly one/);assert.equal(x.reads(),0);x.open();await assert.rejects(x.store.importIsoReference('../bad'),/invalid ISO/);assert.equal(x.reads(),0);});
test('Viewer cannot import ISO references or access global database',async()=>{const x=setup({viewer:true});await assert.rejects(add(x),/Viewer cannot/);assert.equal(x.reads(),0);});
test('missing, wrong generation, wrong type and malformed source fail closed',async()=>{for(const r of [null,{...baseRecord,generation:'g2'},{...baseRecord,type:'committees'},{...baseRecord,reference:''}]){const x=setup();x.setRecord(r);await assert.rejects(add(x),/not found|no reference/);assert.equal(x.store.isDirty(x.graph),false);}});
test('generation switch during lookup prevents import',async()=>{const x=setup();const original=x.root.__radarIsoWindowed.get;x.root.__radarIsoWindowed.get=async q=>{const r=await original(q);x.setActive({generation:'g2',summary:{release:'2026-12-01',datasets:{deliverables:{count:1}}}});return r;};await assert.rejects(add(x),/catalogue changed/);assert.equal(x.store.build(x.graph).standards.length,0);});
test('workspace close and replacement during asynchronous lookup prevents cross-catalog mutation',async()=>{const x=setup();const original=x.root.__radarIsoWindowed.get;x.root.__radarIsoWindowed.get=async q=>{const r=await original(q);x.store.closeCatalog();x.open();return r;};await assert.rejects(add(x),/workspace changed/);assert.equal(x.store.build(x.graph).standards.length,0);});
test('snapshot survives portable JSON export and Viewer reimport without IndexedDB',async()=>{const x=setup();await add(x);const artifact=await x.store.buildArtifact(x.graph);const data=plain(artifact.artifact.data);data.radarRevisions=data.radarRevisions.filter(r=>r.status==='published');const y=setup({viewer:true,opened:false});y.open(data);delete y.root.__radarIsoWindowed;const list=y.store.listReferenceRecords();assert.equal(list[0].isoDocument.release,'2026-11-09');assert.equal(list[0].isoDocument.title,baseRecord.titleI18n.en);list[0].isoDocument.title='mutated copy';assert.equal(y.store.listReferenceRecords()[0].isoDocument.title,baseRecord.titleI18n.en);});
test('imported standard can be used by existing draft creation contract without duplicate standard',async()=>{const x=setup();const {standardId}=await add(x);const request={group:'g1',revisionId:'draft',standard:null,blip:{blipId:'new-blip',standardId,label:'ISO 9001',ring:'Adopted',quadrant:'Available',position:{x:200,y:300}}};x.store.validateCreation(request);x.store.commitCreation(request);const data=x.store.build(x.graph);assert.equal(data.standards.length,1);assert.equal(data.radarRevisions[1].blips[0].standardId,standardId);assert.equal(data.radarRevisions[0].blips.length,0);});
function query(root){const panel=text('radar-standards-panel.js'),start=panel.indexOf('function referenceRows(term)'),end=panel.indexOf('function updateModeButtons()',start);const ctx=vm.createContext({root,norm:v=>String(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()});vm.runInContext(panel.slice(start,end)+'\nthis.query=referenceRows;',ctx);return ctx.query;}
test('Creator and Viewer native query consult the same snapshot, including ICS and committee, without fallback',async()=>{const x=setup();await add(x);x.root.__radarStandardRegistry={records(){throw Error('Unexpected legacy fallback');}};const q=query(x.root);assert.equal(q('quality management').length,1);assert.equal(q('03.120.10').length,1);assert.equal(q('TC 176').length,1);assert.equal(q('no match').length,0);x.root.__radarApplicationProfile.viewer=true;assert.equal(q('quality management').length,1);x.store.closeCatalog();assert.equal(q('').length,0);});
test('published and global ISO details use distinct translated labels and source scopes',()=>{
  const panel=text('radar-standards-panel.js');
  const start=panel.indexOf('function showDetail(record)'),end=panel.indexOf('const str=',start);
  assert.ok(start>=0&&end>start);
  const created=[],forms=[];
  function elem(tag){const e={tag,children:[],style:{},attrs:{},appendChild(x){this.children.push(x);},setAttribute(k,v){this.attrs[k]=v;},addEventListener(){},showModal(){},remove(){}};created.push(e);return e;}
  const root={document:{createElement:elem,getElementById:()=>null,body:elem('body')},__radarApplicationProfile:{viewer:true,allows:()=>false},w2form:function(o){forms.push(o);this.render=()=>{};},i18next:{language:'en'}};
  // Reuse actual translation definitions and resolver, not hardcoded test labels.
  const i18nStart=panel.indexOf('const isoStrings='),i18nEnd=panel.indexOf('registerI18n();',i18nStart);
  assert.ok(i18nStart>=0&&i18nEnd>i18nStart);
  let lookups=0;
  const ctx=vm.createContext({root,activeDetailRecord:null,status:null,windowedActive:true,findDeliverable(){lookups++;if(root.__radarApplicationProfile.viewer)throw Error('Unexpected global lookup');return {reference:'ISO previous'};},findCommittee(){throw Error('Unexpected global lookup');}});
  vm.runInContext(panel.slice(i18nStart,i18nEnd)+panel.slice(start,end)+'\nthis.show=showDetail;',ctx);
  for(const language of ['en','fr']){
    root.i18next.language=language;
    root.__radarApplicationProfile.viewer=true;
    const {sourceData,generation,...snapshot}=baseRecord;
    ctx.show({kind:'standard',isoId:'62085',nativeReference:true,isoItem:{...snapshot,source:'ISO Open Data',release:'2026-11-09'}});
    const native=forms.at(-1);
    assert.equal(native.record.titleFr,'');assert.equal(native.record.titleEn,baseRecord.titleI18n.en);
    assert.equal(native.record.replaces,'100');
    assert.equal(native.tabs[1].text,language==='en'?'Stored metadata':'Métadonnées conservées');
    assert.equal(native.fields.find(f=>f.field==='sourceData').html.label,language==='en'?'Stored document snapshot':'Copie documentaire conservée');
    assert.equal(JSON.parse(native.record.sourceData).sourceData,undefined);
    assert.equal(lookups,0);assert.ok(!created.some(e=>['Add to catalog','Ajouter au catalogue'].includes(e.textContent)));
    assert.deepEqual(plain(native.actions),{});
    root.__radarApplicationProfile.viewer=false;
    ctx.show({kind:'standard',isoId:'62085',isoItem:baseRecord});
    const global=forms.at(-1);
    assert.equal(global.tabs[1].text,language==='en'?'Original metadata':'Métadonnées originales');
    assert.equal(global.record.replaces,'ISO previous');
    assert.deepEqual(JSON.parse(global.record.sourceData),baseRecord.sourceData);
    assert.deepEqual(plain(global.actions),{});
    lookups=0;
  }
});
