import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import { randomUUID } from 'node:crypto';

const source = name => readFileSync(new URL('../js/'+name+'.js', import.meta.url), 'utf8');
const plain = value => JSON.parse(JSON.stringify(value));
const modules = ['radar-application-profile','radar-publication-model','radar-publication-projection',
  'radar-catalog-persistence','radar-standard-registry','radar-catalog-creation',
  'radar-catalog-create-form','radar-standards-panel','radar-iso-toolbar'];
const manualFields = {name:'Example protocol',issuer:'IETF',designation:'RFC 9999',editionDesignation:'1',sourceName:'Example source',sourceUrl:'https://internal.example/reference'};
const isoItem = {id:'62085',type:'deliverables',generation:'g1',reference:'ISO 9001:2015',title:'Quality management',titleI18n:{en:'Quality management'},scopeI18n:{en:'Requirements'},edition:5,icsCodes:['03.120.10'],ownerCommittee:'ISO/TC 176'};
const revision = (revisionId,status,radarId='rad') => ({schemaVersion:'1.0.0',revisionId,radarId,status,ownerOrganizationId:'o',portfolioId:'p',title:radarId,version:'1.0.0',blips:[]});
const catalog = (standards=[{standardId:'legacy',name:'Legacy reference'}],viewer=false) => ({schemaVersion:'1.0.0',title:'Example',organizations:[{organizationId:'o',name:'Org'}],portfolios:[{portfolioId:'p',ownerOrganizationId:'o',name:'Portfolio'}],standards,assessments:[],radarRevisions:[revision('pub','published'),...(viewer?[]:[revision('draft','draft')])]});
const config = {name:'Public example',description:'',audience:{label:'Public',organizationIds:[]},scope:{selection:'explicit',revisionIds:['pub'],radarIds:[],organizationIds:[],portfolioIds:[]},capabilities:['catalog.open','radar.navigate','radar.consult'],presentation:{title:'Public example',language:'en',references:true},packaging:{modes:['standalone'],data:'embedded'},dataPolicy:{isoDocument:true,assessments:false,extensions:'allowlist'}};

// Browser contract doubles: execute the actual panel, toolbar, form and service handlers.
const nodes = n => [n,...n.children.flatMap(nodes)];
const dataKey = s => s.replace(/-([a-z])/g,(_,c)=>c.toUpperCase());
class Element {
  constructor(tag){this.tag=tag;this.children=[];this.parent=null;this.style={};this.dataset={};this.attrs={};this.events={};this.value='';this._text='';this.disabled=false;}
  get parentElement(){return this.parent;}
  get nextSibling(){return this.parent?.children[this.parent.children.indexOf(this)+1]||null;}
  get isConnected(){return this.tag==='body'||!!this.parent?.isConnected;}
  get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}
  set textContent(v){this._text=String(v);this.replaceChildren();}
  appendChild(n){n.remove();this.children.push(n);n.parent=this;return n;}
  append(...items){for(const n of items)this.appendChild(n);}
  insertBefore(n,before){n.remove();const i=this.children.indexOf(before);if(i<0)return this.appendChild(n);this.children.splice(i,0,n);n.parent=this;return n;}
  replaceChildren(...items){for(const n of this.children)n.parent=null;this.children=[];this.append(...items);}
  remove(){if(this.parent){this.parent.children=this.parent.children.filter(n=>n!==this);this.parent=null;}}
  setAttribute(k,v){this.attrs[k]=String(v);if(k.startsWith('data-'))this.dataset[dataKey(k.slice(5))]=String(v);}
  getAttribute(k){return k.startsWith('data-')?this.dataset[dataKey(k.slice(5))]??null:this.attrs[k]??null;}
  matches(sel){if(sel.startsWith('#'))return this.id===sel.slice(1);const m=/^([a-z-]+)?(?:\[([^=\]]+)(?:="([^"]*)")?\])?$/.exec(sel);if(!m)return false;const [,tag,key,value]=m;if(tag&&this.tag!==tag)return false;if(!key)return !!tag;const v=key.startsWith('data-')?this.dataset[dataKey(key.slice(5))]:this.attrs[key]??this[key];return value===undefined?v!==undefined&&v!==null:String(v)===value;}
  closest(sel){return this.matches(sel)?this:this.parent?.closest(sel)||null;}
  querySelectorAll(sel){return this.children.flatMap(nodes).filter(n=>n.matches(sel));}
  querySelector(sel){return this.querySelectorAll(sel)[0]||null;}
  addEventListener(type,fn){(this.events[type]??=[]).push(fn);}
  removeEventListener(type,fn){this.events[type]=(this.events[type]||[]).filter(x=>x!==fn);}
  emit(type,event={}){const e={target:this,preventDefault(){},...event};for(const fn of [...(this.events[type]||[])])fn(e);if(type==='click')this.parent?.emit(type,e);}
  click(){if(!this.disabled)this.emit('click');}
  focus(){}
  showModal(){this.open=true;}
  close(){this.open=false;this.emit('close');}
  reset(){for(const n of nodes(this))if(['input','select'].includes(n.tag))n.value='';}
}
function environment({viewer=false,published=false,initial=null,activeGroup='g1'}={}){
  const body=new Element('body'),mount=new Element('div'),forms=[],alerts=[],reads={iso:0,fetch:0};body.appendChild(mount);mount.id='standard-references-panel';
  const document={body,documentElement:body,createElement:tag=>new Element(tag),getElementById:id=>nodes(body).find(n=>n.id===id)||null,querySelector:sel=>body.querySelector(sel),addEventListener:(...a)=>body.addEventListener(...a),removeEventListener:(...a)=>body.removeEventListener(...a)};
  const listeners=new Map();const i18next={language:'fr',addResourceBundle(){},t(key,opts){return opts?.defaultValue||key;},on(name,fn){const a=listeners.get(name)||[];a.push(fn);listeners.set(name,a);},off(name,fn){listeners.set(name,(listeners.get(name)||[]).filter(x=>x!==fn));},switch(lang){this.language=lang;for(const fn of [...(listeners.get('languageChanged')||[])])fn(lang);}};
  let grid,group=activeGroup,model=initial||catalog(undefined,viewer);const graphNodes=[];
  const graph={extent:()=>({x1:0,x2:800,y1:0,y2:800}),nodes:()=>graphNodes.map(n=>({position:()=>n.position})),add(n){graphNodes.push(plain(n));},$id(id){return graphNodes.filter(n=>n.data.id===id);},remove(ns){for(const n of ns)graphNodes.splice(graphNodes.indexOf(n),1);}};
  const root={location:{search:viewer?'?profile=viewer'+(published?'&publicationPreview=1':''):'',href:'https://example.test/radar.html'},URLSearchParams,crypto:{randomUUID},document,i18next,console,
    w2grid:function(o){Object.assign(this,o);grid=this;this.clear=()=>{this.records=[];};this.refresh=()=>{};this.render=()=>{};this.select=id=>{this.selection=id;};},
    w2form:function(o){forms.push(o);this.render=()=>{};this.destroy=()=>{};},w2alert:m=>alerts.push(m),
    w2ui:{mainLayout:{show(){},sizeTo(){}}},
    __radarRevisionSession:{status:()=>({activeGroup:group}),exportGroup:()=>null},
    __radarCatalogAdapter:{getRevision:g=>model.radarRevisions[Number(String(g).slice(1))]},
    __radarIsoWindowed:{async current(){reads.iso++;return {generation:'g1',summary:{release:'2026-11-09',datasets:{deliverables:{count:1}}}};},async page(){reads.iso++;return {records:[],next:null};},async get(){reads.iso++;return plain(isoItem);}},
    fetch:async()=>{reads.fetch++;return {ok:false};},setTimeout,clearTimeout};
  const ctx=createContext({window:root,URL,console,setTimeout,clearTimeout});
  for(const name of modules)runInContext(source(name),ctx,{filename:name+'.js'});
  const store=root.__radarCatalogPersistence,registry=root.__radarStandardRegistry,panel=root.__radarStandardsPanel;
  function open(data){model=data;store.remember(data,{revisions:data.radarRevisions.map((r,i)=>({group:'g'+i,revisionId:r.revisionId}))});}
  if(published)root.__radarApplicationProfile.initializePublication(()=>open(model));else open(model);
  function selectGroup(g){group=g;panel.refresh();}
  async function initialize(){panel.initialize(mount,()=>graph);await new Promise(resolve=>setImmediate(resolve));if(!viewer)panel.openReferences();}
  function query(sel){const n=body.querySelector(sel);assert.ok(n,'missing '+sel);return n;}
  function detail(id){const btn=new Element('button');btn.dataset.nativeIsoDetail=id;query('#standard-references-grid').emit('click',{target:btn});return forms.at(-1);}
  return {root,ctx,store,registry,panel,body,mount,graph,graphNodes,forms,alerts,reads,open,selectGroup,initialize,query,detail,get grid(){return grid;}};
}
function fillDeclaration(x,values=manualFields){const dialog=x.query('#standard-reference-register');for(const [k,v] of Object.entries(values))dialog.querySelectorAll('input').find(n=>n.name===k).value=v;return dialog;}
function ids(grid){return Array.from(grid.records,r=>r.standardId);}

test('S15-A local declaration: provenance, opaque identity, exact duplicate refusal and distinct editions',()=>{
  const x=environment(),before=plain(x.store.build(null).radarRevisions),a=x.registry.declare(manualFields);
  assert.match(a.standardId,/^standard_/);assert.equal(a.verification,'unverified');
  const rec=x.store.listReferenceRecords().find(r=>r.standardId===a.standardId);assert.equal(rec.issuer,'IETF');assert.equal(rec.sourceUrl,manualFields.sourceUrl);assert.equal(rec.origin,'manual');
  assert.throws(()=>x.registry.declare({...manualFields,name:'Changed',issuer:' ietf ',designation:'ｒｆｃ  9999',sourceName:'Other'}),/reference already declared/);
  const b=x.registry.declare({...manualFields,editionDesignation:'2'});assert.notEqual(b.standardId,a.standardId);
  assert.doesNotThrow(()=>x.registry.declare({...manualFields,issuer:'Other issuer'}));
  assert.deepEqual(plain(x.store.build(null).radarRevisions),before);assert.equal(x.store.listReferenceRecords().length,4);
});
test('S15-A prevents manual duplicate of a stored ISO edition without promoting manual declarations',async()=>{
  const x=environment(),a=await x.store.importIsoReference('62085'),before=plain(x.store.build(null));
  assert.throws(()=>x.registry.declare({name:'Alternative',issuer:'iso',designation:' iso 9001:2015 '}),/reference already declared/);
  assert.equal((await x.store.importIsoReference('62085')).standardId,a.standardId);assert.deepEqual(plain(x.store.build(null)),before);
  const y=environment();const b=y.registry.declare({name:'Unverified',issuer:'ISO',designation:'ISO 9001:2015'});await assert.rejects(y.store.importIsoReference('62085'),/reconcile/);assert.equal(y.store.listReferenceRecords().find(r=>r.standardId===b.standardId).verification,'unverified');
});
test('S15-A Creator native reference grid: actual declaration command, one form, selection, existing blip engine',async()=>{
  const x=environment();await x.initialize();const original=ids(x.grid);assert.deepEqual(original,['legacy']);
  const button=x.query('[data-native-declare]');assert.equal(button.disabled,false);button.click();const dialog=fillDeclaration(x);
  assert.equal(dialog.querySelector('input[type="search"]'),null);assert.match(dialog.textContent,/Déclarer une référence locale non vérifiée/);
  dialog.querySelector('form').emit('submit');assert.equal(x.root.document.getElementById('standard-reference-register'),null);
  const id=x.store.listReferenceRecords().find(r=>r.origin==='manual').standardId;
  assert.deepEqual(ids(x.grid),['legacy',id]);assert.equal(x.query('input[type="search"]').value,'');assert.equal(x.grid.selection,id);assert.match(x.mount.querySelectorAll('[role="status"]').at(-1).textContent,/non vérifiée/);
  x.query('[data-iso-translation="add"]').click();const create=x.query('#catalog-create-dialog');
  assert.equal(create.querySelectorAll('select').find(n=>n.name==='standardId').value,id);
  create.querySelectorAll('input').find(n=>n.name==='label').value='Manual blip';
  create.querySelectorAll('select').find(n=>n.name==='ring').value='Adopted';
  create.querySelectorAll('select').find(n=>n.name==='quadrant').value='Available';
  create.querySelector('form').emit('submit');
  assert.equal(x.graphNodes.length,1);const data=x.store.build(x.graph);assert.equal(data.standards.length,2);assert.equal(data.radarRevisions[1].blips[0].standardId,id);assert.equal(data.radarRevisions[0].blips.length,0);
});
test('S15-A duplicate form error is localized, preserves typed fields, and leaves model unchanged',async()=>{
  const x=environment();x.registry.declare(manualFields);await x.initialize();x.query('[data-native-declare]').click();const dialog=fillDeclaration(x);const before=plain(x.store.build(null));
  dialog.querySelector('form').emit('submit');assert.match(dialog.querySelector('[role="alert"]').textContent,/existe déjà/);assert.equal(dialog.querySelectorAll('input').find(n=>n.name==='designation').value,manualFields.designation);assert.deepEqual(plain(x.store.build(null)),before);
  x.root.i18next.switch('en');assert.match(dialog.querySelector('[role="alert"]').textContent,/already exists/);assert.equal(dialog.querySelectorAll('input').find(n=>n.name==='sourceName').value,manualFields.sourceName);
});
test('S15-A filter and search combine origins with issuer, edition and source URL; reset restores all',async()=>{
  const x=environment();const a=x.registry.declare(manualFields),b=await x.store.importIsoReference('62085');await x.initialize();
  const filter=x.query('[data-native-origin-filter]'),search=x.query('input[type="search"]');
  filter.value='manual';filter.emit('change');assert.deepEqual(ids(x.grid),[a.standardId]);
  search.value='internal.example';x.panel.refresh();assert.deepEqual(ids(x.grid),[a.standardId]);
  search.value='ISO';x.panel.refresh();assert.deepEqual(ids(x.grid),[]);
  filter.value='iso-open-data';filter.emit('change');assert.deepEqual(ids(x.grid),[b.standardId]);
  search.value='03.120.10';x.panel.refresh();assert.deepEqual(ids(x.grid),[b.standardId]);
  search.value='';filter.value='legacy';filter.emit('change');assert.deepEqual(ids(x.grid),['legacy']);
  x.root.i18next.switch('en');assert.equal(filter.children[0].textContent,'All origins');assert.equal(filter.value,'legacy');
  x.panel.resetWorkspace();assert.equal(filter.value,'all');assert.equal(x.grid.records.length,3);
});
test('S15-A native detail uses shared read-only W2Form for manual and legacy; ISO retains rich snapshot',async()=>{
  const x=environment();const a=x.registry.declare(manualFields),b=await x.store.importIsoReference('62085');await x.initialize();
  const manual=x.detail(a.standardId);assert.equal(manual.record.nativeIssuer,'IETF');assert.equal(manual.record.nativeSource,manualFields.sourceName);assert.equal(manual.record.nativeUrl,manualFields.sourceUrl);assert.equal(manual.record.edition,'1');assert.equal(manual.record.colProvenance,'Non vérifiée');assert.deepEqual(plain(manual.actions),{});assert.ok(manual.fields.every(f=>f.html.attr.includes('readonly')));
  x.root.i18next.switch('en');assert.equal(x.forms.at(-1).record.colProvenance,'Unverified');x.root.i18next.switch('fr');assert.equal(x.forms.at(-1).record.colProvenance,'Non vérifiée');
  const legacy=x.detail('legacy');assert.equal(legacy.record.nativeOrigin,'Historique');assert.equal(legacy.record.colProvenance,'Inconnu');assert.equal(legacy.record.nativeIssuer,'');
  const iso=x.detail(b.standardId);assert.equal(iso.record.titleEn,'Quality management');assert.equal(iso.tabs[1].text,'Métadonnées conservées');assert.equal(JSON.parse(iso.record.sourceData).release,'2026-11-09');
});
test('S15-A published and generic Viewer native grid: no author commands, no ISO access, no out-of-scope detail',async()=>{
  const creator=environment(),a=creator.registry.declare(manualFields),b=await creator.store.importIsoReference('62085'),data=plain(creator.store.build(null));
  data.radarRevisions=data.radarRevisions.filter(r=>r.status==='published');data.radarRevisions[0].blips=[{blipId:'b',standardId:a.standardId,label:'Manual',ring:'Adopted',quadrant:'Available',position:{x:1,y:2}}];
  const x=environment({viewer:true,initial:data,activeGroup:'g0'});await x.initialize();assert.deepEqual(ids(x.grid),['legacy',a.standardId,b.standardId]);
  assert.equal(x.body.querySelector('[data-native-declare]'),null);assert.equal(x.body.querySelector('[data-iso-manage-sources]'),null);assert.equal(x.reads.iso,0);assert.equal(x.reads.fetch,0);
  assert.equal(x.detail(a.standardId).record.nativeIssuer,'IETF');assert.throws(()=>x.registry.open(x.graph,{declaration:true}),/capability denied/);assert.throws(()=>x.registry.declare(manualFields),/capability denied/);
  // A published profile is bootstrapped by the existing publication payload contract.
  const p=environment({viewer:true,published:true,initial:data,activeGroup:'g0'});await p.initialize();assert.deepEqual(ids(p.grid),[a.standardId]);
  p.detail(b.standardId);assert.equal(p.forms.length,0);p.query('[data-native-origin-filter]').value='iso-open-data';p.query('[data-native-origin-filter]').emit('change');assert.deepEqual(ids(p.grid),[]);assert.equal(p.reads.iso,0);
});
test('S15-A native declaration remains available on a published radar, but creating its blip requires a draft',async()=>{
  const x=environment({activeGroup:'g0'});await x.initialize();x.query('[data-native-declare]').click();fillDeclaration(x).querySelector('form').emit('submit');x.query('[data-iso-translation="add"]').click();assert.match(x.mount.querySelectorAll('[role="status"]').at(-1).textContent,/brouillon/);assert.equal(x.root.document.getElementById('catalog-create-dialog'),null);assert.equal(x.graphNodes.length,0);assert.equal(x.store.build(null).radarRevisions[0].blips.length,0);
});
test('S15-A workspace reset closes stale declaration and clears the origin filter',async()=>{
  const x=environment();await x.initialize();x.query('[data-native-declare]').click();const dialog=fillDeclaration(x);x.panel.resetWorkspace();assert.equal(x.root.document.getElementById('standard-reference-register'),null);x.store.closeCatalog();x.open(catalog());assert.equal(x.store.listReferenceRecords().length,1);assert.equal(x.query('[data-native-origin-filter]').value,'all');assert.equal(dialog.parent,null);dialog.querySelector('form').emit('submit');assert.equal(x.store.listReferenceRecords().length,1);
});
test('S15-A non-ISO reference round-trip and publication: source URL retained in authoring only, closure preserved',()=>{
  const x=environment(),a=x.registry.declare(manualFields),data=plain(x.store.build(null));data.radarRevisions[0].blips=[{blipId:'b',standardId:a.standardId,label:'Protocol',ring:'Adopted',quadrant:'Available',position:{x:8,y:12}}];
  const y=environment({initial:JSON.parse(JSON.stringify(data))});assert.equal(y.store.listReferenceRecords().find(r=>r.standardId===a.standardId).sourceUrl,manualFields.sourceUrl);
  const p=plain(x.root.__radarPublicationProjection.project(data,config));assert.deepEqual(p.catalog.standards.map(s=>s.standardId),[a.standardId]);const ref=p.catalog.standards[0].extensions.referenceDeclaration;assert.equal(ref.issuer,'IETF');assert.equal(ref.sourceName,manualFields.sourceName);assert.equal(ref.origin,'manual');assert.equal(ref.verification,'unverified');assert.equal(ref.sourceUrl,undefined);assert.equal(ref.declaredAt,undefined);assert.equal(p.catalog.radarRevisions[0].blips[0].standardId,a.standardId);
});
test('S15-A reuses a single ISO sources manager and returns to native references without a second store',async()=>{
  const x=environment();await x.initialize();runInContext(source('radar-s14-z-sources'),x.ctx,{filename:'radar-s14-z-sources.js'});assert.equal(x.body.querySelectorAll('[data-s14-z-manage]').length,1);const button=x.query('[data-s14-z-manage]');assert.equal(button.textContent,'Sources ISO');
  x.root.__radarS14Z.decorate();assert.equal(x.body.querySelectorAll('[data-s14-z-manage]').length,1);button.click();const ref=x.body.querySelectorAll('button').find(n=>n.textContent==='Voir les références du catalogue métier');assert.ok(ref);ref.click();assert.equal(x.body.querySelector('[role="dialog"]'),null);assert.deepEqual(ids(x.grid),['legacy']);
  x.root.i18next.switch('en');assert.equal(button.textContent,'ISO sources');assert.equal(x.body.querySelectorAll('[data-s14-z-manage]').length,1);
});

 test('S15-A-R1 compact origin filter and read-only sortable columns retain complete catalog',async()=>{
  const x=environment();x.registry.declare(manualFields);await x.initialize();
  const filter=x.query('[data-native-origin-filter]');assert.match(filter.style.cssText,/height:30px;min-height:30px;max-height:30px/);assert.match(filter.style.cssText,/margin:0/);assert.equal(filter.size,1);
  assert.equal(x.query('[data-catalog-mode="references"]').textContent,'Références du catalogue');
  assert.equal(x.query('[data-iso-translation="advancedSearch"]').style.display,'none');
  assert.equal(x.query('[data-iso-more-filters]').style.display,'none');
  assert.match(x.query('input[type="search"]').placeholder,/organisme, source/);
  for(const col of x.grid.columns.filter(c=>c.sortable))assert.deepEqual(plain(col.editable),{});
  assert.equal(x.grid.records.length,2);x.root.i18next.switch('en');assert.equal(x.query('[data-catalog-mode="references"]').textContent,'Catalog references');
  assert.match(x.query('input[type="search"]').placeholder,/issuer, source/);
  assert.equal(x.query('[data-iso-translation="advancedSearch"]').textContent,'Advanced search…');
  x.query('[data-catalog-mode="rss"]').click();assert.equal(x.query('[data-iso-translation="advancedSearch"]').style.display,'');
 });
