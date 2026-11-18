import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import { randomUUID } from 'node:crypto';

const source = name => readFileSync(new URL('../js/'+name+'.js', import.meta.url), 'utf8');
const plain = value => JSON.parse(JSON.stringify(value));
const modules = ['radar-application-profile','radar-publication-model','radar-publication-projection',
  'radar-catalog-persistence','radar-standard-registry','radar-catalog-creation',
  'radar-catalog-create-form','radar-standard-sources','radar-standard-source-dialog','radar-standards-panel','radar-iso-toolbar'];
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
function environment({viewer=false,published=false,initial=null,activeGroup='g1',withToolbar=false}={}){
  const body=new Element('body'),mount=new Element('div'),forms=[],alerts=[],reads={iso:0,fetch:0};body.appendChild(mount);mount.id='standard-references-panel';
  const document={body,documentElement:body,createElement:tag=>new Element(tag),getElementById:id=>nodes(body).find(n=>n.id===id)||null,querySelector:sel=>body.querySelector(sel),addEventListener:(...a)=>body.addEventListener(...a),removeEventListener:(...a)=>body.removeEventListener(...a)};
  const listeners=new Map();const i18next={language:'fr',addResourceBundle(){},t(key,opts){return opts?.defaultValue||key;},on(name,fn){const a=listeners.get(name)||[];a.push(fn);listeners.set(name,a);},off(name,fn){listeners.set(name,(listeners.get(name)||[]).filter(x=>x!==fn));},switch(lang){this.language=lang;for(const fn of [...(listeners.get('languageChanged')||[])])fn(lang);}};
  let grid,group=activeGroup,model=initial||catalog(undefined,viewer);const graphNodes=[];
  const graph={extent:()=>({x1:0,x2:800,y1:0,y2:800}),nodes:()=>graphNodes.map(n=>({position:()=>n.position})),add(n){graphNodes.push(plain(n));},$id(id){return graphNodes.filter(n=>n.data.id===id);},remove(ns){for(const n of ns)graphNodes.splice(graphNodes.indexOf(n),1);}};
  const root={location:{search:viewer?'?profile=viewer'+(published?'&publicationPreview=1':''):'',href:'https://example.test/radar.html'},URLSearchParams,crypto:{randomUUID},document,i18next,console,
    w2grid:function(o){Object.assign(this,o);grid=this;this.clear=()=>{this.records=[];if(withToolbar)this.selection=null;};this.refresh=()=>{};this.render=()=>{};this.select=id=>{this.selection=id;};if(withToolbar)this.getSelection=()=>this.selection?[this.selection]:[];},
    w2form:function(o){forms.push(o);if(withToolbar){Object.assign(this,o);(root.__testFormInstances??=[]).push(this);}this.render=()=>{};this.destroy=()=>{};},w2alert:m=>alerts.push(m),
    w2ui:{mainLayout:{show(){},sizeTo(){}}},
    __radarRevisionSession:{status:()=>({activeGroup:group}),exportGroup:()=>null},
    __radarCatalogAdapter:{getRevision:g=>model.radarRevisions[Number(String(g).slice(1))]},
    __radarIsoWindowed:{async current(){reads.iso++;return {generation:'g1',summary:{release:'2026-11-09',datasets:{deliverables:{count:1}}}};},async page(){reads.iso++;return {records:[],next:null};},async get(){reads.iso++;return plain(isoItem);}},
    fetch:async()=>{reads.fetch++;return {ok:false};},setTimeout,clearTimeout};
  root.w2popup={
    open(o){
      if(this.options)this.close();
      this.options=o;
      const id=o.body.match(/id="([^"]+)"/)?.[1];
      if(id){this.host=new Element('div');this.host.id=id;body.appendChild(this.host);}
      const event={};o.onOpen?.(event);event.onComplete?.();
    },
    close(){
      const options=this.options;this.options=null;
      const event={};options?.onClose?.(event);
      this.host?.remove();this.host=null;
      event.onComplete?.();
    }
  };
  if(withToolbar){
    root.w2toolbar=function(o){Object.assign(this,o);this.render=()=>{};this.set=(id,patch)=>{const item=this.items.find(r=>r.id===id);assert.ok(item,'unknown toolbar item '+id);Object.assign(item,patch);};this.destroy=()=>{};root.w2ui[o.name]=this;};
    root.confirm=()=>true;root.open=(url)=>{root.lastOpened=url;};
  }
  const ctx=createContext({window:root,URL,console,setTimeout,clearTimeout,AbortSignal,TextDecoder,TextEncoder});
  for(const name of modules)runInContext(source(name),ctx,{filename:name+'.js'});
  const store=root.__radarCatalogPersistence,registry=root.__radarStandardRegistry,panel=root.__radarStandardsPanel;
  function open(data){model=data;store.remember(data,{revisions:data.radarRevisions.map((r,i)=>({group:'g'+i,revisionId:r.revisionId}))});}
  if(published)root.__radarApplicationProfile.initializePublication(()=>open(model));else open(model);
  function selectGroup(g){group=g;panel.refresh();}
  async function initialize(){panel.initialize(mount,()=>graph);await new Promise(resolve=>setImmediate(resolve));if(!viewer)panel.openReferences();}
  function query(sel){const n=body.querySelector(sel);assert.ok(n,'missing '+sel);return n;}
  async function detail(id){
    if(root.__radarApplicationProfile?.viewer){grid.onDblClick({recid:id});}
    else {
      assert.ok(root.w2ui.standardsToolbar,'missing Creator documentary toolbar');
      grid.select(id);grid.onClick({recid:id});
      root.w2ui.standardsToolbar.onClick({target:'details'});
    }
    await new Promise(resolve=>setImmediate(resolve));
    return forms.at(-1);
  }
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
  const x=environment({withToolbar:true});const a=x.registry.declare(manualFields),b=await x.store.importIsoReference('62085');await x.initialize();
  const manual=await x.detail(a.standardId);assert.equal(manual.record.nativeIssuer,'IETF');assert.equal(manual.record.nativeSource,manualFields.sourceName);assert.equal(manual.record.nativeUrl,manualFields.sourceUrl);assert.equal(manual.record.edition,'1');assert.equal(manual.record.colProvenance,'Non vérifiée');assert.deepEqual(plain(manual.actions),{});assert.ok(manual.fields.every(f=>f.html.attr.includes('readonly')));
  x.root.i18next.switch('en');assert.equal(x.forms.at(-1).record.colProvenance,'Unverified');x.root.i18next.switch('fr');assert.equal(x.forms.at(-1).record.colProvenance,'Non vérifiée');
  const legacy=await x.detail('legacy');assert.equal(legacy.record.nativeOrigin,'Historique');assert.equal(legacy.record.colProvenance,'Inconnu');assert.equal(legacy.record.nativeIssuer,'');
  const iso=await x.detail(b.standardId);assert.equal(iso.record.titleEn,'Quality management');assert.equal(iso.tabs[1].text,'Métadonnées conservées');assert.equal(JSON.parse(iso.record.sourceData).release,'2026-11-09');
});
test('S15-A published and generic Viewer native grid: no author commands, no ISO access, no out-of-scope detail',async()=>{
  const creator=environment(),a=creator.registry.declare(manualFields),b=await creator.store.importIsoReference('62085'),data=plain(creator.store.build(null));
  data.radarRevisions=data.radarRevisions.filter(r=>r.status==='published');data.radarRevisions[0].blips=[{blipId:'b',standardId:a.standardId,label:'Manual',ring:'Adopted',quadrant:'Available',position:{x:1,y:2}}];
  const x=environment({viewer:true,initial:data,activeGroup:'g0'});await x.initialize();assert.deepEqual(ids(x.grid),['legacy',a.standardId,b.standardId]);
  assert.equal(x.body.querySelector('[data-native-declare]'),null);assert.equal(x.body.querySelector('[data-iso-manage-sources]'),null);assert.equal(x.reads.iso,0);assert.equal(x.reads.fetch,0);
  assert.equal((await x.detail(a.standardId)).record.nativeIssuer,'IETF');assert.throws(()=>x.registry.open(x.graph,{declaration:true}),/capability denied/);assert.throws(()=>x.registry.declare(manualFields),/capability denied/);
  // A published profile is bootstrapped by the existing publication payload contract.
  const p=environment({viewer:true,published:true,initial:data,activeGroup:'g0'});await p.initialize();assert.deepEqual(ids(p.grid),[a.standardId]);
  await p.detail(b.standardId);assert.equal(p.forms.length,0);p.query('[data-native-origin-filter]').value='iso-open-data';p.query('[data-native-origin-filter]').emit('change');assert.deepEqual(ids(p.grid),[]);assert.equal(p.reads.iso,0);
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

test('S15-B Creator source dialog, dated W3C selection, i18n and existing blip engine',async()=>{
  const x=environment();await x.initialize();const base='https://api.w3.org/specifications',stamp='2026-11-15T00:00:00.000Z';
  const api=x.root.__radarStandardSources,link=api.w3cLink({href:base+'/json-ld11',title:'JSON-LD 1.1'}),version=api.w3cRecord({uri:'https://www.w3.org/TR/2020/REC-json-ld11-20200716/',date:'2020-07-16',title:'JSON-LD 1.1',status:'Recommendation'},'json-ld11');
  x.root.fetch=async url=>new Response(JSON.stringify({schemaVersion:1,sourceId:'w3c',acquiredAt:stamp,...(url.endsWith('w3c-json-ld11.json')?{shortname:'json-ld11',payload:[version]}:{payload:[link]})}));
  x.query('[data-standard-sources]').click();const d=x.query('#standard-source-dialog'),sel=d.querySelector('[data-source-picker]');sel.value='w3c';sel.emit('change');d.querySelector('[data-source-load]').click();
  await new Promise(r=>setImmediate(r));d.querySelector('[data-source-result="json-ld11"]').click();await new Promise(r=>setImmediate(r));
  d.querySelector('[data-source-result="json-ld11:20200716"]').click();assert.ok(d.querySelector('[data-source-integrate]'));
  x.root.i18next.switch('en');assert.match(d.textContent,/Standardization sources/);assert.equal(d.querySelector('[data-source-integrate]').textContent,'Add to catalog');
  d.querySelector('[data-source-integrate]').click();assert.equal(x.root.document.getElementById('standard-source-dialog'),null);const id='w3c-tr:json-ld11:20200716';assert.ok(ids(x.grid).includes(id));assert.equal(x.grid.selection,id);
  x.query('[data-iso-translation="add"]').click();const form=x.query('#catalog-create-dialog');assert.equal(form.querySelectorAll('select').find(n=>n.name==='standardId').value,id);
  form.querySelectorAll('input').find(n=>n.name==='label').value='W3C blip';form.querySelectorAll('select').find(n=>n.name==='ring').value='Adopted';form.querySelectorAll('select').find(n=>n.name==='quadrant').value='Available';form.querySelector('form').emit('submit');
  const data=x.store.build(x.graph);assert.equal(data.radarRevisions[1].blips[0].standardId,id);assert.equal(data.radarRevisions[0].blips.length,0);
  x.query('[data-standard-sources]').click();x.panel.resetWorkspace();x.open(catalog());assert.equal(x.root.document.getElementById('standard-source-dialog'),null);
});


// S16-A: the same source dialogue is reachable directly from every Creator mode.
test('S16-A direct RFC and W3C shortcuts preserve source selection and explicit acquisition',async()=>{
  const x=environment();await x.initialize();
  // The unrelated ISO projection is isolated; the panel and source services are real.
  x.root.__radarIsoFullGrid={project:()=>[]};
  x.query('[data-catalog-mode="iso-list"]').click();
  const rfc=x.query('[data-standard-source-shortcut="rfc-editor"]'),w3c=x.query('[data-standard-source-shortcut="w3c"]');
  assert.equal(rfc.disabled,false);assert.equal(w3c.disabled,false);
  const before=plain(x.store.build(null));
  let acquisitions=0;
  x.root.fetch=async()=>{acquisitions++;throw Error('Unexpected source acquisition');};
  rfc.click();let d=x.query('#standard-source-dialog');
  assert.equal(d.querySelector('[data-source-picker]').value,'rfc-editor');
  assert.equal(x.query('[data-catalog-mode="iso-list"]').getAttribute('aria-pressed'),'true');
  w3c.click();d=x.query('#standard-source-dialog');
  assert.equal(d.querySelector('[data-source-picker]').value,'w3c');
  assert.equal(x.body.querySelectorAll('#standard-source-dialog').length,1);
  x.root.i18next.switch('en');assert.equal(d.querySelector('[data-source-picker]').value,'w3c');
  assert.equal(acquisitions,0);assert.deepEqual(plain(x.store.build(null)),before);
  x.panel.resetWorkspace();assert.equal(x.body.querySelector('#standard-source-dialog'),null);
  x.store.closeCatalog();x.panel.refresh();assert.equal(rfc.disabled,true);assert.equal(w3c.disabled,true);
  w3c.emit('click');assert.equal(x.body.querySelector('#standard-source-dialog'),null);
});
test('S16-A W3C shortcut integrates a dated publication through the existing service and selects the native reference',async()=>{
  const x=environment();await x.initialize();x.root.__radarIsoFullGrid={project:()=>[]};x.query('[data-catalog-mode="iso-list"]').click();
  const api=x.root.__radarStandardSources,stamp='2026-11-15T00:00:00.000Z';
  const link=api.w3cLink({href:'https://api.w3.org/specifications/shacl',title:'Shapes Constraint Language'});
  const version=api.w3cRecord({uri:'https://www.w3.org/TR/2017/REC-shacl-20170720/',date:'2017-07-20',title:'Shapes Constraint Language',status:'Recommendation'},'shacl');
  x.root.fetch=async url=>new Response(JSON.stringify({schemaVersion:1,sourceId:'w3c',acquiredAt:stamp,...(url.endsWith('w3c-shacl.json')?{shortname:'shacl',payload:[version]}:{payload:[link]})}));
  x.query('[data-standard-source-shortcut="w3c"]').click();const d=x.query('#standard-source-dialog');
  d.querySelector('[data-source-load]').click();await new Promise(r=>setImmediate(r));
  d.querySelector('[data-source-result="shacl"]').click();await new Promise(r=>setImmediate(r));
  d.querySelector('[data-source-result="shacl:20170720"]').click();
  d.querySelector('[data-source-integrate]').click();
  const id='w3c-tr:shacl:20170720';
  assert.equal(x.grid.selection,id);assert.ok(ids(x.grid).includes(id));
  assert.equal(x.query('[data-catalog-mode="references"]').getAttribute('aria-pressed'),'true');
  assert.equal(x.store.build(null).radarRevisions[0].blips.length,0);
});
test('S16-A generic and published Viewers expose neither external source shortcut',async()=>{
  for(const published of [false,true]){
    const x=environment({viewer:true,published,activeGroup:'g0'});await x.initialize();
    assert.equal(x.body.querySelectorAll('[data-standard-source-shortcut]').length,0);
    assert.equal(x.body.querySelector('[data-standard-sources]'),null);
    assert.equal(x.reads.iso,0);assert.equal(x.reads.fetch,0);
    assert.throws(()=>x.root.__radarStandardSourceDialog.open({sourceId:'w3c'}),/denied/i);
  }
});


// S16-A-R2: exercise real navigation/action handlers through W2UI contract doubles.
// The separate browser recipe exercises the actual W2UI implementation.
const tick=()=>new Promise(r=>setImmediate(r));
function toolbar(x){return x.root.w2ui.standardsToolbar;}
function toolItem(x,id){return toolbar(x).items.find(r=>r.id===id);}
async function toolClick(x,target){toolbar(x).onClick({target});await tick();await tick();}
async function selectRow(x,id){x.grid.select(id);x.grid.onClick({recid:id});await tick();}
const r2stamp='2026-11-16T00:00:00.000Z';
function w3cFixture(x,n=1){const api=x.root.__radarStandardSources;const series=Array.from({length:n},(_,i)=>api.w3cLink({href:api.W3C+'/spec'+i,title:'Specification '+i}));const version=api.w3cRecord({uri:'https://www.w3.org/TR/2020/REC-spec0-20200716/',date:'2020-07-16',title:'Specification 0',status:'Recommendation'},'spec0');x.root.fetch=async url=>new Response(JSON.stringify({schemaVersion:1,sourceId:'w3c',acquiredAt:r2stamp,...(String(url).endsWith('w3c-spec0.json')?{shortname:'spec0',payload:[version]}:{payload:series})}));}
const omgHtml='<table><tr><th>Name</th><th>Acronym</th><th>Version</th><th>Status</th><th>Publication Date</th></tr><tr><td>Example Model</td><td>EXAMPLE</td><td><a href="/spec/EXAMPLE/1.0">1.0</a></td><td>formal</td><td>August 2020</td></tr><tr><td>Example Model</td><td>EXAMPLE</td><td><a href="/spec/EXAMPLE/1.1/Beta1">1.1 Beta1</a></td><td>beta</td><td>August 2021</td></tr></table><table><tr><th>Specification Title</th><th>Version</th><th>ISO Number</th><th>OMG File ID</th></tr><tr><td>Example Model</td><td><a href="/spec/EXAMPLE/1.0">1.0</a></td><td>12345:2020</td><td>formal/20-01-01</td></tr></table>';

test('S16-R2 W2UI source selector and contextual menu replace visible shortcuts; inventory is registry-backed',async()=>{
 const x=environment({withToolbar:true});await x.initialize();
 assert.equal(toolItem(x,'source').type,'menu-radio');assert.deepEqual(Array.from(toolItem(x,'source').items,r=>r.id),['iso-open-data','rfc-editor','w3c','omg-specifications','references','resources']);
 assert.equal(x.query('[data-standard-source-shortcut="w3c"]').style.display,'none');
 assert.equal(x.query('[data-catalog-mode="references"]').style.display,'none');
 assert.equal(x.query('[data-native-declare]').style.display,'none');
 const before=plain(x.store.build(null));const calls=x.reads.fetch;
 await toolClick(x,'source:resources');assert.equal(x.grid.records.length,29);assert.ok(x.grid.records.some(r=>r.recid==='omg-specifications'));assert.equal(toolItem(x,'isoView').hidden,true);assert.equal(toolItem(x,'acquisition').hidden,true);assert.equal(x.reads.fetch,calls);assert.deepEqual(plain(x.store.build(null)),before);
 await selectRow(x,'omg-specifications');await toolClick(x,'details');assert.ok(x.forms.at(-1).fields.length>10);await toolClick(x,'openSource');assert.equal(x.root.lastOpened,'https://www.omg.org/spec/');
 x.root.__radarIsoFullGrid={project:()=>[]};await toolClick(x,'source:iso-open-data');assert.equal(toolItem(x,'isoView').hidden,false);assert.equal(toolItem(x,'isoView').selected,'iso-list');assert.equal(toolItem(x,'acquisition').hidden,false);assert.equal(toolItem(x,'integrate').hidden,true);
});
test('S16-R2 W3C consultation without a catalog, dated publication integration only after opening catalog',async()=>{
 const x=environment({withToolbar:true});await x.initialize();x.store.closeCatalog();x.panel.refresh();w3cFixture(x);
 await toolClick(x,'source:w3c');assert.equal(x.grid.records.length,0);assert.equal(toolItem(x,'isoView').hidden,true);
 await toolClick(x,'acquisition:load');assert.equal(x.grid.records[0].recid,'spec0');assert.equal(toolItem(x,'integrate').hidden,true);
 await selectRow(x,'spec0');await toolClick(x,'versions');assert.equal(x.grid.records[0].recid,'spec0:20200716');await selectRow(x,'spec0:20200716');assert.equal(toolItem(x,'integrate').disabled,true);
 await toolClick(x,'integrate');assert.equal(x.store.status().importedCatalogs,0);
 x.open(catalog());x.panel.refresh();await selectRow(x,'spec0:20200716');assert.equal(toolItem(x,'integrate').disabled,false);
 const before=plain(x.store.build(null));await toolClick(x,'integrate');const after=plain(x.store.build(null));assert.equal(toolItem(x,'source').selected,'references');assert.equal(x.grid.selection,'w3c-tr:spec0:20200716');assert.ok(after.standards.some(r=>r.standardId==='w3c-tr:spec0:20200716'));for(const k of ['organizations','portfolios','assessments','radarRevisions'])assert.deepEqual(after[k],before[k]);
});
test('S16-R2 bounded external paging and search in common grid',async()=>{
 const x=environment({withToolbar:true});await x.initialize();w3cFixture(x,205);await toolClick(x,'source:w3c');await toolClick(x,'acquisition:load');assert.equal(x.grid.records.length,100);assert.equal(toolItem(x,'next').disabled,false);await toolClick(x,'next');assert.equal(x.grid.records[0].recid,'spec100');await toolClick(x,'next');assert.equal(x.grid.records.length,5);assert.equal(toolItem(x,'next').disabled,true);
 const search=x.query('input[type="search"]');search.value='Specification 4';search.emit('input');await new Promise(r=>setTimeout(r,220));assert.equal(x.grid.records[0].recid,'spec4');assert.equal(toolItem(x,'previous').disabled,true);await x.root.i18next.switch('en');assert.equal(toolItem(x,'source').selected,'w3c');assert.match(toolItem(x,'source').text,/Documentary source/);
});
test('S16-R2 stale external acquisition cannot replace another source view',async()=>{
 const x=environment({withToolbar:true});await x.initialize();const api=x.root.__radarStandardSources;let release;const pending=new Promise(r=>release=r);x.root.fetch=async()=>pending;
 await toolClick(x,'source:w3c');await toolClick(x,'acquisition:load');await toolClick(x,'source:resources');release(new Response(JSON.stringify({schemaVersion:1,sourceId:'w3c',acquiredAt:r2stamp,payload:[api.w3cLink({href:api.W3C+'/test',title:'Test'})]})));await tick();await tick();assert.equal(x.grid.records.length,29);assert.equal(toolItem(x,'source').selected,'resources');
});
test('S16-R2 OMG HTML imported from browser, private and non-mutating, clear preserves native catalog',async()=>{
 const x=environment({withToolbar:true});await x.initialize();const before=plain(x.store.build(null));await toolClick(x,'source:omg-specifications');assert.equal(x.grid.records.length,0);assert.equal(toolItem(x,'integrate').hidden,false);assert.equal(toolItem(x,'integrate').disabled,true);const input=x.query('[data-omg-file]');input.files=[{name:'catalog.html',size:omgHtml.length,text:async()=>omgHtml}];input.emit('change');await tick();await tick();assert.equal(x.grid.records.length,2);assert.equal(x.grid.records[0].recid,'EXAMPLE/1.0');assert.equal(x.grid.records[0].isoAdoptionsText,'12345:2020');assert.equal(x.grid.records[1].recid,'EXAMPLE/1.1/Beta1');await toolClick(x,'omgView:adoptions');assert.equal(x.grid.records.length,1);assert.equal(x.grid.records[0].recid,'EXAMPLE/1.0');assert.equal(toolItem(x,'omgView').selected,'adoptions');await toolClick(x,'omgView:specifications');assert.equal(x.grid.records.length,2);assert.equal(x.root.__radarStandardSources.omgStatus().distribution,'private-only');assert.equal(x.root.__radarStandardSources.omgStatus().origin,'local-unverified');assert.deepEqual(plain(x.store.build(null)),before);
 await selectRow(x,'EXAMPLE/1.0');await toolClick(x,'openSource');assert.equal(x.root.lastOpened,'https://www.omg.org/spec/EXAMPLE/1.0');await toolClick(x,'details');assert.ok(x.forms.at(-1).record);await toolClick(x,'acquisition:omgClear');assert.equal(x.grid.records.length,0);assert.deepEqual(plain(x.store.build(null)),before);
});
test('S16-R3 OMG import and restore have no authorization prompt or implicit network acquisition',async()=>{
 const x=environment({withToolbar:true});await x.initialize();await toolClick(x,'source:omg-specifications');const api=x.root.__radarStandardSources;assert.equal(api.loadOmg,undefined);assert.equal(toolItem(x,'acquisition').items.some(r=>r.id==='omgRights'),false);assert.ok(toolItem(x,'acquisition').items.some(r=>r.id==='omgRestore'));x.root.confirm=()=>{throw Error('No authorization prompt');};const calls=x.reads.fetch;const input=x.query('[data-omg-file]');input.files=[{name:'catalog.html',size:omgHtml.length,text:async()=>omgHtml}];input.emit('change');await tick();await tick();assert.equal(x.grid.records.length,2);await toolClick(x,'acquisition:omgRestore');assert.equal(x.grid.records.length,2);assert.equal(x.reads.fetch,calls);assert.equal(toolItem(x,'integrate').hidden,false);assert.equal(toolItem(x,'integrate').disabled,true);
});
test('S16-R2 Viewer cannot mount source toolbar or import OMG',async()=>{
 for(const published of [false,true]){const x=environment({viewer:true,published,withToolbar:true,activeGroup:'g0'});await x.initialize();assert.equal(toolbar(x),undefined);assert.equal(x.body.querySelector('[data-omg-file]'),null);assert.equal(x.reads.fetch,0);await assert.rejects(x.root.__radarStandardSources.importOmg(omgHtml,{format:'html'}),/denied/);}
});


test('S16-R2 RFC uses same grid and integrates exact number, with optional Datatracker context',async()=>{
 const x=environment({withToolbar:true});await x.initialize();const api=x.root.__radarStandardSources;
 // Minimal DOM fixture double only for the already qualified RFC XML boundary.
 const node=(localName,textContent='',children=[])=>({localName,textContent,children});const entry=node('rfc-entry','',[node('doc-id','RFC9110'),node('title','HTTP Semantics'),node('date','',[node('month','June'),node('year','2022')]),node('stream','IETF'),node('current-status','INTERNET STANDARD')]);x.root.DOMParser=class{parseFromString(){return {documentElement:node('rfc-index','',[entry]),getElementsByTagName:()=>[]};}};
 let contextCalls=0;x.root.fetch=async url=>{if(String(url).includes('datatracker.ietf.org')){contextCalls++;return new Response(JSON.stringify({name:'rfc9110',title:'HTTP Semantics',group:{acronym:'httpbis',name:'HTTP',type:'WG'}}));}return new Response(JSON.stringify({schemaVersion:1,sourceId:'rfc-editor',acquiredAt:r2stamp,payload:'<rfc-index><rfc-entry/></rfc-index>'}));};
 await toolClick(x,'source:rfc-editor');assert.equal(contextCalls,0);await toolClick(x,'acquisition:load');assert.equal(x.grid.records[0].recid,'9110');assert.equal(toolItem(x,'versions').hidden,true);await selectRow(x,'9110');await toolClick(x,'context');assert.equal(contextCalls,1);assert.ok(Object.values(x.forms.at(-1).record).some(v=>v.includes('httpbis')));const before=plain(x.store.build(null));await toolClick(x,'integrate');const after=plain(x.store.build(null));assert.ok(after.standards.some(r=>r.standardId==='rfc:9110'));assert.equal(x.grid.selection,'rfc:9110');assert.deepEqual(after.organizations,before.organizations);assert.deepEqual(after.radarRevisions,before.radarRevisions);
});

// S16-R3.1: the actual W2UI action delegates to the bounded source service.
test('S16-R31 OMG online command is available in local Creator, preserves the index on relay failure, and stays hidden on static Pages',async()=>{
 // Static GitHub Pages cannot offer a command backed by the local Vite relay.
 const pages=environment({withToolbar:true});
 pages.root.location.href='http://127.0.0.1:5189/StandardisationRadarChart/radar.html';
 await pages.initialize();await toolClick(pages,'source:omg-specifications');
 assert.equal(pages.root.__radarStandardSources.omgHasLocalRelay(),false);
 assert.equal(toolItem(pages,'acquisition').items.some(r=>r.id==='omgOnline'),false);
 assert.ok(toolItem(pages,'acquisition').items.some(r=>r.id==='omgImport'));
 assert.ok(toolItem(pages,'acquisition').items.some(r=>r.id==='omgHistoryImport'));
 // The local Creator exposes the command. An absent relay may fall back to
 // the official URL; a real relay failure must not silently replace the index.
 const x=environment({withToolbar:true});
 x.root.location.href='http://127.0.0.1:5174/radar.html';
 await x.initialize();x.store.closeCatalog();x.panel.refresh();
 const api=x.root.__radarStandardSources;let calls=[];
 const html=omgHtml+omgHtml.slice(0,omgHtml.indexOf('</table>')+8);
 x.root.fetch=async url=>{
   calls.push(String(url));
   if(String(url)==='http://127.0.0.1:5174/__radar-omg/catalog/refresh')return new Response('Not Found',{status:404});
   assert.equal(String(url),'https://www.omg.org/spec/');
   return new Response(html,{headers:{'Content-Type':'text/html'}});
 };
 await toolClick(x,'source:omg-specifications');
 assert.equal(calls.length,0);
 assert.equal(api.omgHasLocalRelay(),true);
 assert.ok(toolItem(x,'acquisition').items.some(r=>r.id==='omgOnline'));
 await toolClick(x,'acquisition:omgOnline');
 assert.deepEqual(calls,['http://127.0.0.1:5174/__radar-omg/catalog/refresh','https://www.omg.org/spec/']);
 assert.equal(x.grid.records.length,2);
 assert.equal(api.omgStatus().origin,'official-fetch');
 assert.equal(x.store.status().importedCatalogs,0);
 assert.equal(toolItem(x,'integrate').hidden,false);
 assert.equal(toolItem(x,'integrate').disabled,true);
 x.root.fetch=async url=>{
   assert.equal(String(url),'http://127.0.0.1:5174/__radar-omg/catalog/refresh');
   return new Response(JSON.stringify({operation:'S16-OMG-LOCAL-RELAY',ok:false,error:'upstream unavailable'}),{status:503,headers:{'Content-Type':'application/json'}});
 };
 await toolClick(x,'acquisition:omgOnline');
 assert.equal(x.grid.records.length,2);
 assert.equal(api.omgStatus().origin,'official-fetch');
});
test('S16-R31 prepared local corpus is available through the source menu without changing native data',async()=>{
 const x=environment({withToolbar:true});x.root.location.href='http://127.0.0.1:5174/radar.html';await x.initialize();const api=x.root.__radarStandardSources,before=plain(x.store.build(null));
 const html=omgHtml+omgHtml.slice(0,omgHtml.indexOf('</table>')+8),snapshot=api.omg.parseOmgCatalog(html,{acquiredAt:r2stamp,sha256:'a'.repeat(64)});
 x.root.fetch=async url=>{assert.match(String(url),/\/__radar-omg\/catalog\/current$/);return new Response(JSON.stringify({operation:'S16-OMG-LOCAL-RELAY',ok:true,snapshot}),{headers:{'Content-Type':'application/json'}});};
 await toolClick(x,'source:omg-specifications');assert.ok(toolItem(x,'acquisition').items.some(r=>r.id==='omgPrepared'));await toolClick(x,'acquisition:omgPrepared');assert.equal(x.grid.records.length,2);assert.equal(api.omgStatus().origin,'local-prepared');assert.deepEqual(plain(x.store.build(null)),before);
});

test('S17-R4 ISO popup: close cleans up read-only form without changing native catalog',async()=>{
  const x=environment({withToolbar:true});
  const a=x.registry.declare(manualFields),before=plain(x.store.build(null));
  await x.initialize();
  const form=await x.detail(a.standardId);
  assert.equal(form.record.nativeIssuer,'IETF');
  assert.match(x.root.w2popup.options.body,/iso-standard-detail-popup-body/);
  assert.ok(x.query('#iso-standard-detail-popup-body'));
  x.root.w2popup.close();
  assert.equal(x.body.querySelector('#iso-standard-detail-popup-body'),null);
  assert.deepEqual(plain(x.store.build(null)),before);
  const next=await x.detail('legacy');
  assert.equal(next.record.nativeOrigin,'Historique');
  x.panel.resetWorkspace();
  assert.equal(x.root.w2popup.options,null);
});
