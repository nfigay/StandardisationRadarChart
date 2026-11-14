import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const modules=['radar-revision-session.js','radar-catalog-adapter.js','radar-catalog-persistence.js','radar-catalog-ui.js','radar-workspace-explorer.js'];
const fixture=(id='one',status='draft')=>({schemaVersion:'1.0.0',title:'Catalog '+id,
  organizations:[{organizationId:'o',name:'Organization'}],portfolios:[{portfolioId:'p',ownerOrganizationId:'o',name:'Portfolio'}],
  standards:[{standardId:'s',name:'ISO 9001:2015'}],assessments:[],radarRevisions:[{schemaVersion:'1.0.0',revisionId:'revision-'+id,radarId:'radar-'+id,ownerOrganizationId:'o',portfolioId:'p',status,title:'Radar '+id,version:'1.0.0',blips:[{blipId:'blip-'+id,standardId:'s',label:'ISO 9001',ring:'Adopt',quadrant:'Quality',position:{x:200,y:300}}]}]});
function setup(viewer=false){
  let elements=[],downloaded=0,pendingFile=null;
  const alerts=[];
  const graph={elements(){return {jsons:()=>structuredClone(elements),remove:()=>{elements=[];}};},nodes(){return {jsons:()=>structuredClone(elements),grabify(){},ungrabify(){}};},add(nodes){elements.push(...structuredClone(nodes));}};
  const toolbar={entries:[],selected:null,get(id){if(id==='item2')return {items:this.entries,selected:this.selected};if(id==='item4')return {selected:'grabon'};},set(id,value){if(id!=='item2')return;if(value.items)this.entries=value.items;if('selected' in value)this.selected=value.selected;},refresh(){}};
  const profile={viewer,allows(c){return !viewer||['catalog.open','radar.navigate','radar.consult'].includes(c);},require(c){if(!this.allows(c))throw Error('Forbidden '+c);},assertRevision(r){if(viewer&&r?.status!=='published')throw Error('Published revisions only');},assertCatalog(c){for(const r of c.radarRevisions)this.assertRevision(r);}};
  const doc={body:{appendChild(){}},createElement(tag){if(tag==='input'){const picker={style:{},files:[],addEventListener(type,fn){if(type==='change')pendingFile={picker,fn};},remove(){},click(){}};return picker;}return {click(){downloaded++;},remove(){}};}};
  const window={console,structuredClone,__radarApplicationProfile:profile,crypto:{randomUUID:()=> 'test-id'},w2ui:{toolbar},w2alert:m=>alerts.push(m),confirm:()=>true,w2sidebar:function(o){this.nodes=o.nodes;this.selected=null;this.add=nodes=>{this.nodes=nodes;};this.refresh=()=>{};this.get=()=>null;this.select=id=>{this.selected=id;};this.unselect=()=>{this.selected=null;};},__radarRevisionDialogs:{openPicker(){}},__radarArtifactIntegrity:{async wrap(data,manifest){return {artifact:{data,manifest},proof:{digest:'test-digest'}};},async inspect(catalog){profile.assertCatalog(catalog);return {catalog,manifest:{catalogId:'catalog-'+catalog.title,artifactId:'artifact-'+catalog.title},digest:'digest-'+catalog.title};}}};
  window.window=window;
  const context=vm.createContext({window,console,document:doc,structuredClone,Blob,URL:{createObjectURL:()=> 'blob:test',revokeObjectURL(){}},setTimeout:fn=>fn()});
  for(const f of modules)vm.runInContext(readFileSync(new URL('../js/'+f,import.meta.url),'utf8'),context,{filename:f});
  const api=window.__radarCatalogUI,store=window.__radarCatalogPersistence,adapter=window.__radarCatalogAdapter,session=window.__radarRevisionSession,explorer=window.__radarWorkspaceExplorer;
  function select(group){session.select(graph,group,()=>{graph.elements().remove();graph.add(adapter.project(group).nodes);});api.afterSelect(group,graph);}
  explorer.initialize({mount:{addEventListener(){}},graph:()=>graph,select});
  function open(catalog){const summary=api.load(catalog,toolbar);store.remember(catalog,summary,{catalogId:'test-catalog',artifactId:'test-artifact'});explorer.addCatalog(catalog,summary);explorer.activate(summary.revisions[0].group);return summary.revisions[0].group;}
  async function chooseFile(catalog){api.openFile({replace:true});assert.ok(pendingFile);pendingFile.picker.files=[{size:1024,text:async()=>JSON.stringify(catalog)}];await pendingFile.fn();}
  return {window,api,store,adapter,session,explorer,toolbar,graph,open,chooseFile,alerts,move(x){elements[0].position.x=x;},downloaded:()=>downloaded};
}
test('A8.2 navigation does not modify imported catalog',()=>{const x=setup();x.open(fixture());assert.equal(x.store.isDirty(x.graph),false);assert.equal(x.api.workspaceStatus(x.graph).opened,true);});
test('A8.2 graph edits are dirty; export establishes exact baseline',async()=>{const x=setup();x.open(fixture());x.move(450);assert.equal(x.store.isDirty(x.graph),true);await x.store.download(x.graph);assert.equal(x.downloaded(),1);assert.equal(x.store.isDirty(x.graph),false);x.move(451);assert.equal(x.store.isDirty(x.graph),true);});
test('A8.2 rename changes business state',()=>{const x=setup();x.open(fixture());x.store.renameRevisionLabel('revision-one','Review 2');assert.equal(x.store.isDirty(x.graph),true);});
test('A8.2 newly created native catalog is dirty',()=>{const x=setup();x.api.createNewCatalog({catalogTitle:'New',organizationName:'Org',portfolioName:'Portfolio',radarTitle:'Radar'},x.toolbar,x.graph,g=>x.explorer.activate(g));assert.equal(x.store.isDirty(x.graph),true);});
test('A8.2 dirty close requires explicit decision',async()=>{const x=setup();x.open(fixture());x.move(450);await assert.rejects(x.api.closeCatalog(x.graph,'close'),/unsaved modifications/);assert.equal(x.store.status().importedCatalogs,1);assert.equal(x.graph.elements().jsons().length,1);});
test('A8.2 cancel preserves model, graph and explorer',async()=>{const x=setup(),g=x.open(fixture());x.move(450);assert.equal((await x.api.closeCatalog(x.graph,'cancel')).action,'cancelled');assert.equal(x.store.isDirty(x.graph),true);assert.equal(x.session.status().activeGroup,g);assert.equal(x.adapter.status().length,1);assert.equal(x.api.status().count,1);assert.equal(x.explorer.status().sources.length,1);});
test('A8.2 discard releases native workspace; ISO untouched',async()=>{const x=setup();let isoCalls=0;x.window.__radarIsoWindowed={current(){isoCalls++;}};const g=x.open(fixture());x.move(450);assert.equal((await x.api.closeCatalog(x.graph,'discard')).action,'closed');assert.equal(x.store.status().importedCatalogs,0);assert.equal(x.adapter.status().length,0);assert.equal(x.session.status().groups.length,0);assert.equal(x.session.status().activeGroup,null);assert.equal(x.explorer.status().sources.length,0);assert.equal(x.api.status().count,0);assert.equal(x.toolbar.entries.length,0);assert.equal(x.graph.elements().jsons().length,0);assert.equal(isoCalls,0);const next=x.open(fixture('two'));assert.notEqual(g,next);assert.equal(x.adapter.getRevision(next).revisionId,'revision-two');});
test('A8.2 save and close needs positive export confirmation',async()=>{const x=setup();x.open(fixture());x.move(450);assert.equal((await x.api.closeCatalog(x.graph,'save',()=>false)).action,'cancelled');assert.equal(x.store.status().importedCatalogs,1);assert.equal(x.store.isDirty(x.graph),true);assert.equal((await x.api.closeCatalog(x.graph,'save',()=>true)).action,'closed');assert.equal(x.downloaded(),2);});
test('A8.2 failed export does not release current workspace',async()=>{const x=setup();const g=x.open(fixture());x.move(450);x.window.__radarArtifactIntegrity.wrap=async()=>{throw Error('Export failure');};await assert.rejects(x.api.closeCatalog(x.graph,'save',()=>true),/Export failure/);assert.equal(x.session.status().activeGroup,g);assert.equal(x.store.isDirty(x.graph),true);});
test('A8.2 replacement validates before closing existing catalog',async()=>{const x=setup(),g=x.open(fixture());const bad=fixture('bad');bad.radarRevisions[0].blips[0].standardId='missing';await x.chooseFile(bad);assert.equal(x.alerts.length,1);assert.equal(x.session.status().activeGroup,g);await x.chooseFile(fixture('two'));assert.equal(x.store.status().importedCatalogs,1);assert.equal(x.adapter.status().length,1);assert.notEqual(x.adapter.status()[0],g);assert.equal(x.adapter.getRevision(x.adapter.status()[0]).revisionId,'revision-two');});
test('A8.2 viewer closes/reopens without export or mutation rights',async()=>{const x=setup(true);x.open(fixture('one','published'));assert.equal(x.store.isDirty(x.graph),false);assert.throws(()=>x.store.build(x.graph),/Forbidden catalog.export/);assert.equal((await x.api.closeCatalog(x.graph,'close')).action,'closed');x.open(fixture('two','published'));assert.equal(x.store.status().importedCatalogs,1);assert.equal(x.downloaded(),0);});
test('A8.2 viewer draft rejection preserves published workspace',async()=>{const x=setup(true),g=x.open(fixture('one','published'));await x.chooseFile(fixture('two','draft'));assert.equal(x.alerts.length,1);assert.equal(x.session.status().activeGroup,g);assert.equal(x.adapter.status().length,1);});
test('A8.2 viewer native reference query uses published data only, never registry fallback',()=>{
  const x=setup(true);x.open(fixture('one','published'));
  const text=readFileSync(new URL('../js/radar-standards-panel.js',import.meta.url),'utf8');
  const start=text.indexOf('function referenceRows(term)'),end=text.indexOf('function updateModeButtons()',start);assert.ok(start>=0&&end>start);
  const context=vm.createContext({root:x.window,norm:v=>String(v).toLowerCase()});
  x.window.__radarStandardRegistry={records(){throw Error('Forbidden global access');}};
  vm.runInContext(text.slice(start,end)+'\nthis.query=referenceRows;',context);
  assert.equal(context.query('9001').length,1);assert.equal(context.query('missing').length,0);assert.equal(context.query('')[0].standardId,'s');
});
test('A8.2 Viewer panel returns before global source startup',()=>{const text=readFileSync(new URL('../js/radar-standards-panel.js',import.meta.url),'utf8');const start=text.indexOf('function initialize(node,getGraph)'),end=text.indexOf('void loadIcs();',start);assert.ok(start>=0&&end>start);const code=text.slice(start,end);assert.match(code,/nativeOnly/);assert.match(code,/bar\.replaceChildren\(label,search\);\s*return true;/);
  const creatorStart=text.indexOf('bindLocale();updateStaticLabels();refresh();',start);
  const viewerReturn=text.indexOf('return true; // no global ISO',start);
  assert.ok(viewerReturn>=0&&creatorStart>viewerReturn&&creatorStart<end);
  const creatorEnd=text.indexOf('return true;',creatorStart);
  assert.ok(creatorEnd>creatorStart);
  assert.match(text.slice(creatorStart,creatorEnd),/loadRssCache\(\)/);
  assert.match(text.slice(start,viewerReturn),/preparePublishedReferences\(\)/);
  assert.match(text,/function preparePublishedReferences\(\)\s*\{\s*bindLocale\(\);\s*updateStaticLabels\(\);\s*refresh\(\);\s*\}/);
});
