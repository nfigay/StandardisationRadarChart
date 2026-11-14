import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const src=f=>readFileSync(new URL('../'+f,import.meta.url),'utf8');
// Use the exact i18next version shipped in lib/, not a reimplemented dictionary.
async function locale(){
 const module={exports:{}};vm.runInNewContext(src('lib/i18next.min.js'),{module,exports:module.exports,setTimeout,clearTimeout,console});
 const i18next=module.exports.createInstance();await i18next.init({lng:'fr',fallbackLng:'en',resources:{fr:{translation:{menu:{existing:'Conservé'}}},en:{translation:{menu:{existing:'Preserved'}}}}});return i18next;
}
class Node {
 constructor(tag){this.tag=tag;this.children=[];this.parent=null;this.style={};this.attributes={};this.events={};this._text='';this.value='';}
 get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}
 set textContent(value){this._text=String(value);this.replaceChildren();}
 appendChild(node){this.children.push(node);node.parent=this;return node;}
 replaceChildren(...nodes){for(const c of this.children)c.parent=null;this.children=[];for(const c of nodes)this.appendChild(c);}
 remove(){if(this.parent){this.parent.children=this.parent.children.filter(n=>n!==this);this.parent=null;}}
 setAttribute(name,value){this.attributes[name]=String(value);}
 addEventListener(name,fn){(this.events[name]??=[]).push(fn);}
 emit(name){for(const fn of this.events[name]||[])fn({preventDefault(){}});}
 focus(){}
 reset(){for(const n of all(this))if(n.tag==='input'||n.tag==='select')n.value='';}
}
function all(node){return [node,...node.children.flatMap(all)];}
function find(node,predicate){const result=all(node).find(predicate);assert.ok(result,'Expected DOM node');return result;}
const named=(node,name)=>find(node,n=>n.name===name);
const tag=(node,name)=>find(node,n=>n.tag===name);
const button=(node,text)=>find(node,n=>n.tag==='button'&&n.textContent===text);
async function fixture(){
 const i18next=await locale(),body=new Node('body'),calls=[],alerts=[];
 const root={i18next,document:{body,createElement:tag=>new Node(tag),getElementById:id=>all(body).find(n=>n.id===id)},
  __radarRevisionSession:{status:()=>({activeGroup:'g'})},__radarCatalogAdapter:{getRevision:()=>({status:'draft',revisionId:'rev'})},
  __radarCatalogPersistence:{status:()=>({importedCatalogs:1}),ownsRevision:()=>true,listStandardsForDraft:()=>[{standardId:'std1',name:'ISO 9001'},{standardId:'std2',name:'ISO 14001'}],listReferenceRecords:()=>[{standardId:'std1',name:'ISO 9001',designation:'ISO 9001',verification:'unverified'}]},
  __radarCatalogCreation:{addBlipToActiveDraft:(_,r)=>{calls.push(r);return {blipId:'blip-1'};},addStandardBlipToActiveDraft:(_,r)=>{calls.push(r);return {blipId:'blip-2'};}},w2alert:m=>alerts.push(m)};
 for(const file of ['radar-catalog-create-form.js','radar-standard-registry.js','radar-radar-admin.js','radar-revision-dialogs.js'])vm.runInNewContext(src('js/'+file),{window:root});
 return {root,i18next,body,calls,alerts,graph:{extent:()=>({x1:0,x2:300,y1:0,y2:300}),nodes:()=>[]},form:root.__radarCatalogCreateForm};
}
test('existing blip form uses real i18next and updates every label without replacing controls',async()=>{
 const {root,i18next,body,form,graph}=await fixture();const panel=form.open(graph,'existing','std2');
 assert.equal(tag(panel,'h2').textContent,'Ajouter un blip');assert.equal(named(panel,'standardSearch').placeholder,'Nom ou identifiant (catalogue importé)');assert.equal(named(panel,'standardId').value,'std2');
 const label=named(panel,'label'),ring=named(panel,'ring'),quadrant=named(panel,'quadrant'),select=named(panel,'standardId');
 label.value='Test & <blip>';ring.value='Track';quadrant.value='Participated';
 assert.equal(ring.children.find(n=>n.value==='Track').textContent,'À suivre');
 assert.equal(quadrant.children.find(n=>n.value==='Participated').textContent,'Participation');
 assert.match(select.children[0].textContent,/2 résultat/);assert.ok(button(panel,'Annuler'));assert.ok(button(panel,'Créer'));
 await i18next.changeLanguage('en');
 assert.equal(tag(panel,'h2').textContent,'Add blip');assert.equal(named(panel,'standardSearch').placeholder,'Name or identifier (imported catalog)');assert.match(panel.textContent,/Selected standard/);assert.match(panel.textContent,/Blip ring/);assert.match(panel.textContent,/Blip quadrant/);assert.match(panel.textContent,/Initial position/);assert.match(select.children[0].textContent,/2 result/);
 assert.equal(ring.children.find(n=>n.value==='Track').textContent,'Track');assert.equal(quadrant.children.find(n=>n.value==='Participated').textContent,'Participated');
 assert.equal(named(panel,'label'),label);assert.equal(label.value,'Test & <blip>');assert.equal(select.value,'std2');assert.equal(ring.value,'Track');assert.equal(quadrant.value,'Participated');
 assert.equal(i18next.t('menu.existing'),'Preserved');assert.equal(i18next.t('menu.blipForm.title'),'Add blip');
 await i18next.changeLanguage('fr');assert.equal(tag(panel,'h2').textContent,'Ajouter un blip');button(panel,'Annuler').emit('click');assert.equal(body.children.length,0);await i18next.changeLanguage('en');assert.equal(tag(panel,'h2').textContent,'Ajouter un blip','closed dialog no longer listens');
});
test('new standard form localizes all text, preserves technical errors and submits unchanged machine values',async()=>{
 const {i18next,form,graph,calls,alerts,body}=await fixture();const panel=form.open(graph,'new');
 assert.equal(tag(panel,'h2').textContent,'Créer un standard et son blip');assert.match(panel.textContent,/Nom du standard de référence/);assert.match(panel.textContent,/Création manuelle/);
 named(panel,'label').value='Blip';named(panel,'ring').value='Candidate';named(panel,'quadrant').value='Developed';
 tag(panel,'form').emit('submit');const error=find(panel,n=>n.attributes.role==='alert');assert.equal(error.textContent,'Le nom du standard est obligatoire.');assert.equal(calls.length,0);
 assert.throws(()=>form.submit(graph,'new',{label:'Blip',ring:'Candidate',quadrant:'Developed',standardName:''}),/Standard name is required/);
 await i18next.changeLanguage('en');assert.equal(error.textContent,'Standard name is required.');assert.match(panel.textContent,/Reference standard name/);assert.match(panel.textContent,/Manual creation/);
 named(panel,'standardName').value='New ISO ref';tag(panel,'form').emit('submit');assert.equal(calls.length,1);assert.equal(calls[0].ring,'Candidate');assert.equal(calls[0].quadrant,'Developed');assert.equal(calls[0].standard.name,'New ISO ref');assert.equal(alerts[0],'Blip created: blip-2');assert.equal(body.children.length,0);
});
test('registry translates declaration fields, search, status and selection without losing entered values',async()=>{
 const {root,i18next,graph,body}=await fixture();const panel=root.__radarStandardRegistry.open(graph);
 assert.equal(tag(panel,'h2').textContent,'Références normatives');assert.match(panel.textContent,/Titre déclaré/);assert.match(panel.textContent,/Organisme déclaré/);assert.match(panel.textContent,/Non vérifiée/);
 find(panel,n=>n.tag==='button'&&n.textContent.includes('ISO 9001')).emit('click');named(panel,'name').value='Draft reference';named(panel,'issuer').value='ISO';
 tag(panel,'form').emit('submit');assert.match(panel.textContent,/Renseignez le titre/);
 await i18next.changeLanguage('en');assert.equal(tag(panel,'h2').textContent,'Standard references');assert.match(panel.textContent,/Declared title/);assert.match(panel.textContent,/Declared issuer/);assert.match(panel.textContent,/Designation/);assert.match(panel.textContent,/Unverified/);assert.match(panel.textContent,/Selection: ISO 9001/);assert.match(panel.textContent,/Enter the title/);assert.equal(named(panel,'name').value,'Draft reference');assert.equal(named(panel,'issuer').value,'ISO');
 assert.equal(find(panel,n=>n.type==='search').attributes['aria-label'],'Search references');assert.ok(button(panel,'Save local declaration'));await i18next.changeLanguage('fr');button(panel,'Fermer').emit('click');assert.equal(body.children.length,0);
});
test('revision and radar administration resolve their existing dictionaries through shared i18next',async()=>{
 const {root,i18next}=await fixture();assert.equal(root.__radarRevisionDialogs.t('select'),'Sélectionner une révision');assert.equal(root.__radarRadarAdmin.t('rename'),'Renommer le radar');
 assert.equal(i18next.t('menu.revisionDialogs.select'),'Sélectionner une révision');assert.equal(i18next.t('menu.radarAdmin.rename'),'Renommer le radar');
 await i18next.changeLanguage('en');assert.equal(root.__radarRevisionDialogs.t('select'),'Select revision');assert.equal(root.__radarRadarAdmin.t('rename'),'Rename radar');assert.equal(i18next.t('menu.existing'),'Preserved');
});
test('new catalog prompts and confirmation of protected revisions use the actual HTML i18next resources',async()=>{
 const i18next=await locale(),html=src('radar.html');
 const resourceStart=html.indexOf('const resources = {'),resourceEnd=html.indexOf('\n        };',resourceStart);assert.ok(resourceStart>=0&&resourceEnd>resourceStart);
 const bundle=vm.runInNewContext(html.slice(resourceStart,resourceEnd+11)+'\nresources;');
 for(const lang of ['fr','en'])i18next.addResourceBundle(lang,'translation',bundle[lang].translation,true,true);
 const start=html.indexOf('function handleNewCatalog() {'),end=html.indexOf('function initializeToolbar()',start);const startOffer=html.indexOf('function offerDraftForReadOnlyAction() {'),endOffer=html.indexOf('function handleMenuAction(event)',startOffer);
 const prompts=[],alerts=[],confirms=[],created=[];let answers=['Catalog','Org','Portfolio','Radar'];
 const window={__radarApplicationProfile:{allows:()=>true},__radarCatalogUI:{createNewCatalog(fields){created.push(fields);return {catalogTitle:fields.catalogTitle};}},__radarRevisionSession:{status:()=>({activeGroup:'g'})},__radarCatalogAdapter:{getRevision:()=>({status:'published'})},prompt(label){prompts.push(label);return answers.shift();},confirm(message){confirms.push(message);return false;}};
 const ctx={window,i18next,w2ui:{toolbar:{}},cy:{},drawSelectedWorkgroup(){},w2alert:m=>alerts.push(m),console:{log(){},error(){}},handleCreateOrOpenDraft(){throw Error('confirmation rejected');}};
 vm.runInNewContext(html.slice(start,end)+'\n'+html.slice(startOffer,endOffer)+'\nthis.run=handleNewCatalog;this.offer=offerDraftForReadOnlyAction;',ctx);
 ctx.run();assert.deepEqual(prompts,['Nom du catalogue','Nom de l’organisation','Nom du portefeuille','Nom du premier radar']);assert.match(alerts[0],/Catalogue créé : Catalog/);assert.equal(created.length,1);ctx.offer();assert.match(confirms[0],/Publiée/);
 await i18next.changeLanguage('en');prompts.length=0;answers=[''];ctx.run();assert.deepEqual(prompts,['Catalog name']);assert.match(alerts[1],/a value is required/);assert.equal(created.length,1);ctx.offer();assert.match(confirms[1],/Published/);
});
