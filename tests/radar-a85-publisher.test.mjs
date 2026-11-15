import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {randomUUID,webcrypto,createHash} from 'node:crypto';
const src=f=>readFileSync(new URL('../'+f,import.meta.url),'utf8');
const plain=x=>JSON.parse(JSON.stringify(x));
const flush=()=>new Promise(resolve=>setImmediate(resolve));
const fixture=()=>({schemaVersion:'1.0.0',title:'Source private',organizations:[{organizationId:'org',name:'Organisation'}],portfolios:[{portfolioId:'port',ownerOrganizationId:'org',name:'Portefeuille'}],standards:[{standardId:'std',name:'Norme synthétique',extensions:{isoDocument:{schemaVersion:1,source:'ISO Open Data',release:'synthetic-fixture',id:'synthetic-1',reference:'ISO DEMO (synthetic)',title:'Fictitious test record',titleI18n:{fr:'Notice fictive',en:'Fictitious record'},icsCodes:['35.240'],ownerCommittee:'TC DEMO'}}},{standardId:'unused',name:'PRIVATE_UNUSED_STANDARD'}],assessments:[],radarRevisions:[...['published','published','draft'].map((status,i)=>({schemaVersion:'1.0.0',revisionId:'rev'+i,radarId:i===1?'radar2':'radar1',ownerOrganizationId:'org',portfolioId:'port',status,title:'Radar '+i,version:'1.0.0',blips:[{blipId:'blip'+i,standardId:i===2?'unused':'std',label:'Ref '+i,ring:'Adopted',quadrant:'Available',position:{x:310+i,y:325}}]}))],extensions:{private:'PRIVATE_AUTHOR_DATA'}});
const configuration=()=>({name:'Internal',description:'PRIVATE_DESCRIPTION',audience:{label:'PRIVATE_AUDIENCE',organizationIds:['org']},scope:{selection:'explicit',revisionIds:['rev0','rev1'],radarIds:[],organizationIds:[],portfolioIds:[]},capabilities:['catalog.open','radar.navigate','radar.consult'],presentation:{title:'Publication épreuve </script> 🧪',language:'en',references:true},packaging:{modes:['standalone'],data:'embedded'},dataPolicy:{isoDocument:true,assessments:false,extensions:'allowlist'}});
async function locale(){const module={exports:{}};vm.runInNewContext(src('lib/i18next.min.js'),{module,exports:module.exports,setTimeout,clearTimeout,console});const i=module.exports.createInstance();await i.init({lng:'fr',fallbackLng:'en',resources:{fr:{translation:{menu:{existing:'Préservé'}}},en:{translation:{menu:{existing:'Preserved'}}}}});return i;}
class Node{
 constructor(tag){this.tag=tag;this.children=[];this.parent=null;this.style={};this.attributes={};this.dataset={};this.events={};this._text='';this.value='';this.checked=false;this.hidden=false;this.contentWindow=tag==='iframe'?{messages:[],postMessage(data,origin){this.messages.push({data,origin});}}:null;}
 get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}
 set textContent(value){this._text=String(value);this.replaceChildren();}
 get isConnected(){return this.tag==='body'||!!this.parent?.isConnected;}
 appendChild(n){n.parent=this;this.children.push(n);return n;}
 prepend(n){n.parent=this;this.children.unshift(n);}
 replaceChildren(...nodes){for(const n of this.children)n.parent=null;this.children=[];for(const n of nodes)this.appendChild(n);}
 remove(){if(this.parent){this.parent.children=this.parent.children.filter(n=>n!==this);this.parent=null;}}
 setAttribute(k,v){this.attributes[k]=String(v);}
 addEventListener(k,fn){(this.events[k]??=[]).push(fn);}
 emit(k){const event={prevented:false,preventDefault(){this.prevented=true;}};for(const fn of this.events[k]||[])fn(event);return event;}
 click(){this.emit('click');}
 showModal(){this.open=true;}
 close(){this.open=false;this.emit('close');}
}
const all=n=>[n,...n.children.flatMap(all)];
const find=(n,fn)=>{const v=all(n).find(fn);assert.ok(v,'missing node');return v;};
const tag=(n,name)=>find(n,x=>x.tag===name);
const named=(n,name)=>find(n,x=>x.name===name);
const button=(n,text)=>find(n,x=>x.tag==='button'&&x.textContent===text);
async function setup({viewer=false,source=null,template=false,preview=false,embedded=null}={}){
 const body=new Node('body'),events=new Map(),messages=[],alerts=[],downloads=[];
 const document={body,title:'Initial',createElement(name){const n=new Node(name);if(name==='a')n.click=()=>downloads.push({href:n.href,filename:n.download});return n;},getElementById(id){return all(body).find(n=>n.id===id)||null;}};
 if(embedded){const node=new Node('script');node.id='radar-publication-payload';node.textContent=Buffer.from(JSON.stringify(embedded)).toString('base64');body.appendChild(node);}
 const graph={elements:()=>({jsons:()=>structuredClone(elements),remove:()=>{elements=[];}}),nodes:()=>({jsons:()=>structuredClone(elements),grabify(){},ungrabify(){}}),add:nodes=>{elements.push(...structuredClone(nodes));}};let elements=[];
 const toolbar={items:[],get(id){return id==='item2'?{items:this.items}:id==='item4'?{selected:'grabon'}:null;},set(id,o){if(id==='item2'&&o.items)this.items=o.items;},refresh(){}};
 const location={search:viewer?'?profile=viewer'+(preview?'&publicationPreview=1':''):'',origin:'https://radar.test',protocol:'https:',href:'https://radar.test/radar.html'+(viewer?'?profile=viewer':'')};
 const root={document,location,URLSearchParams,URL:class extends URL{static createObjectURL(blob){downloads.push({blob});return 'blob:test';}static revokeObjectURL(){}},Blob,crypto:{randomUUID,subtle:webcrypto.subtle},btoa,atob,console:{info(){},error(){}},i18next:await locale(),confirm:()=>true,w2alert:m=>alerts.push(m),w2ui:{toolbar},setTimeout:()=>1,clearTimeout(){},addEventListener(k,fn){(events.get(k)||events.set(k,[]).get(k)).push(fn);},removeEventListener(k,fn){events.set(k,(events.get(k)||[]).filter(x=>x!==fn));},w2sidebar:function(o){this.topHTML=o.topHTML;this.nodes=o.nodes;this.add=n=>{this.nodes=n;};this.refresh=()=>{};this.get=()=>null;this.select=()=>{};this.unselect=()=>{};},__radarRevisionDialogs:{openPicker(){}},changeLanguage(lang){return this.i18next.changeLanguage(lang);}};
 root.parent=preview?{postMessage(data,origin){messages.push({data,origin});}}:root;
 const ctx=vm.createContext({window:root,document,TextEncoder,TextDecoder,Uint8Array,Blob,URL:root.URL,setTimeout:root.setTimeout,clearTimeout:root.clearTimeout,console:root.console,structuredClone});
 for(const name of ['radar-application-profile','radar-artifact-integrity','radar-publication-model','radar-publication-projection','radar-publication-viewer','radar-publication-delivery','radar-publication-ui','radar-revision-session','radar-catalog-adapter','radar-catalog-persistence','radar-catalog-ui','radar-workspace-explorer'])vm.runInContext(src('js/'+name+'.js'),ctx,{filename:name+'.js'});
 const p=root.__radarCatalogPersistence,ui=root.__radarCatalogUI,e=root.__radarWorkspaceExplorer,adapter=root.__radarCatalogAdapter,session=root.__radarRevisionSession,v=root.__radarPublicationViewer;
 const mount=new Node('div');mount.id='workspace-explorer';body.appendChild(mount);
 e.initialize({mount,graph:()=>graph,select(group){session.select(graph,group,()=>{graph.elements().remove();graph.add(adapter.project(group).nodes);});ui.afterSelect(group,graph);}});
 if(source){const summary=ui.load(source,toolbar);p.remember(source,summary);e.addCatalog(source,summary);e.activate(summary.revisions[0].group);}
 const htmlTemplate='<!DOCTYPE html><html><head><!--RADAR-PUBLICATION-PAYLOAD--><script>const requested=["viewer"];window.__radarStandalone={profile:"viewer"};</script></head><body></body></html>';
 if(template){const n=new Node('script');n.id='radar-viewer-template';n.textContent=Buffer.from(htmlTemplate,'utf8').toString('base64');body.appendChild(n);}
 function fire(k,event){for(const fn of events.get(k)||[])fn(event);}
 return {root,document,body,mount,p,ui,e,adapter,session,v,graph,htmlTemplate,alerts,messages,downloads,fire,events};
}
async function projection(){const x=await setup({source:fixture()});const d=x.p.createPublicationDefinition(configuration());const r=await x.p.preparePublicationProjection(x.graph,d.definitionId,1);return {x,d,r,payload:x.v.payload(r.catalog,r.report,d.configuration.presentation)};}
test('Publisher options show published revisions only and configuration keeps machine IDs',async()=>{const x=await setup();const a=x.root.__radarPublicationUI;const opts=a.options(fixture());assert.deepEqual(plain(opts.revisions.map(r=>r.value)),['rev0','rev1']);const c=a.readConfiguration({name:' N ',description:'',audience:' A ',audienceOrganizations:['org'],selection:'allPublishedForRadars',revisions:['rev0'],radars:['radar1'],organizations:['org'],portfolios:['port'],title:'T',language:'en',references:false,modes:['standalone'],data:'embedded',iso:true,assessments:false});assert.deepEqual(plain(c.scope.revisionIds),[]);assert.deepEqual(plain(c.scope.radarIds),['radar1']);assert.equal(c.name,'N');assert.equal(c.presentation.references,false);});
test('Creator only: opening Publisher requires a catalog; Viewer cannot invoke it',async()=>{const a=await setup();assert.equal(a.root.__radarPublicationUI.open(a.graph),null);assert.match(a.alerts[0],/catalogue métier/);const b=await setup({viewer:true});assert.throws(()=>b.root.__radarPublicationUI.open(b.graph),/publication.create/);});
test('real i18next dialog creates and edits persisted definitions without losing input on language change',async()=>{const x=await setup({source:fixture()});const a=x.root.__radarPublicationUI;const panel=a.open(x.graph);button(panel,'Nouvelle publication').click();await flush();named(panel,'name').value='Publication test';named(panel,'audience').value='Partner';named(panel,'titleField').value='Packaged radar';named(panel,'revisions').checked=true;tag(panel,'form').emit('input');await x.root.i18next.changeLanguage('en');assert.equal(named(panel,'name').value,'Publication test');assert.equal(named(panel,'revisions').checked,true);assert.ok(button(panel,'Save definition'));assert.equal(x.root.i18next.t('menu.existing'),'Preserved');tag(panel,'form').emit('submit');await flush();assert.equal(x.p.publicationState().definitions.length,1);assert.equal(x.p.publicationState().definitions[0].version,1);assert.equal(x.p.isDirty(x.graph),true);button(panel,'Edit').click();await flush();named(panel,'name').value='Renamed';tag(panel,'form').emit('submit');await flush();assert.equal(x.p.publicationState().definitions[0].version,2);assert.equal(x.p.publicationState().definitions[0].configuration.name,'Renamed');button(panel,'Close').click();assert.equal(panel.isConnected,false);});
test('unsaved form cannot close accidentally and cancellation leaves persisted definition unchanged',async()=>{const x=await setup({source:fixture()});const d=x.p.createPublicationDefinition(configuration());const panel=x.root.__radarPublicationUI.open(x.graph);button(panel,'Modifier').click();await flush();named(panel,'name').value='Not saved';tag(panel,'form').emit('input');assert.equal(panel.emit('cancel').prevented,true);button(panel,'Fermer').click();assert.equal(panel.isConnected,true);button(panel,'Annuler').click();await flush();assert.equal(x.p.publicationState().definitions[0].definitionId,d.definitionId);assert.equal(x.p.publicationState().definitions[0].configuration.name,'Internal');button(panel,'Fermer').click();assert.equal(panel.isConnected,false);});
test('archive, reactivate and delete without history use native services',async()=>{const x=await setup({source:fixture()});x.p.createPublicationDefinition(configuration());const panel=x.root.__radarPublicationUI.open(x.graph);button(panel,'Archiver').click();await flush();assert.equal(x.p.publicationState().definitions[0].status,'archived');assert.ok(!all(panel).some(n=>n.textContent==='Vérifier le périmètre'));button(panel,'Réactiver').click();await flush();assert.equal(x.p.publicationState().definitions[0].status,'active');button(panel,'Supprimer').click();await flush();assert.equal(x.p.publicationState().definitions.length,0);});
test('projection report and candidate download contain no authoring metadata or unused data',async()=>{const x=await setup({source:fixture(),template:true});x.p.createPublicationDefinition(configuration());const panel=x.root.__radarPublicationUI.open(x.graph);button(panel,'Vérifier le périmètre').click();await new Promise(r=>setTimeout(r,20));assert.match(panel.textContent,/2 radars · 2 révisions · 2 blips · 1 standards · 1 fiches ISO/);button(panel,'Télécharger le Viewer candidat').click();await new Promise(r=>setTimeout(r,20));const blob=x.downloads.find(d=>d.blob)?.blob;assert.ok(blob);const html=await blob.text(),encoded=html.match(/id="radar-publication-payload">([^<]+)<\/script>/)[1];const data=x.v.decode(encoded);assert.doesNotMatch(JSON.stringify(data),/PRIVATE_|publications|sourceDigest|definitionId/);assert.equal(data.catalog.radarRevisions.length,2);assert.equal(data.catalog.standards[0].extensions.isoDocument.id,'synthetic-1');assert.match(x.downloads.find(d=>d.filename).filename,/^radar-viewer-candidate-[a-f0-9]{12}\.html$/);assert.equal(x.p.publicationState().releases.length,0);});
test('payload is minimal, detached and roundtrips Unicode and script-closing text safely',async()=>{const {x,payload}=await projection();assert.deepEqual(Object.keys(payload).sort(),['catalog','presentation','projectionDigest','schemaVersion']);assert.doesNotMatch(JSON.stringify(payload),/PRIVATE_/);const html=x.v.compose(x.htmlTemplate,payload);const encoded=html.match(/id="radar-publication-payload">([^<]+)<\/script>/)[1];assert.match(encoded,/^[A-Za-z0-9+/=]+$/);assert.doesNotMatch(html,/Publication épreuve/);assert.deepEqual(plain(x.v.decode(encoded)),plain(payload));assert.throws(()=>x.v.compose(html,payload),/template/);});
test('invalid payload fields, nonpublished data or author metadata rejected before load',async()=>{const {x,payload}=await projection();assert.throws(()=>x.v.validate({...payload,author:'secret'}),/payload/);assert.throws(()=>x.v.validate({...payload,presentation:{...payload.presentation,language:'xx'}}),/presentation/);const bad=plain(payload);bad.catalog.radarRevisions[0].status='draft';assert.throws(()=>x.v.validate(bad),/published/);const author=plain(payload);author.catalog.extensions={publications:{}};assert.throws(()=>x.v.validate(author),/published/);});
test('real Viewer services auto-register projected revisions, activate first, apply presentation and deny authoring',async()=>{const {payload}=await projection();const y=await setup({viewer:true});const result=await y.v.load(payload);assert.deepEqual(plain(result.revisionIds),['rev0','rev1']);assert.equal(y.p.status().importedCatalogs,1);assert.equal(y.adapter.status().length,2);assert.equal(y.e.status().sources[0].groups.length,2);assert.equal(y.session.status().groups.length,1);assert.equal(y.adapter.getRevision(y.session.status().activeGroup).revisionId,'rev0');y.e.activate(y.e.status().sources[0].groups[1]);assert.equal(y.session.status().groups.length,2);assert.equal(y.adapter.getRevision(y.session.status().activeGroup).revisionId,'rev1');assert.equal(y.document.title,payload.presentation.title);assert.equal(y.root.i18next.language,'en');assert.throws(()=>y.p.publicationState(),/publication.create/);assert.equal(y.root.__radarPublishedPresentation.references,true);await assert.rejects(y.v.load(payload),/workspace already open/);});
test('digest mismatch and Creator invocation fail without registration',async()=>{const {x,payload}=await projection();await assert.rejects(x.v.load(payload),/Viewer profile/);const y=await setup({viewer:true});const bad=plain(payload);bad.catalog.standards[0].name='tampered';await assert.rejects(y.v.load(bad),/digest mismatch/);assert.equal(y.p.status().importedCatalogs,0);assert.equal(y.adapter.status().length,0);});
test('embedded Viewer boot loads payload automatically on window load',async()=>{const {payload}=await projection();const y=await setup({viewer:true});const node=new Node('script');node.id='radar-publication-payload';node.textContent=y.v.encode(payload);y.body.appendChild(node);y.fire('load',{});await new Promise(r=>setTimeout(r,20));assert.equal(y.p.status().importedCatalogs,1);assert.equal(y.document.title,payload.presentation.title);});
test('HTTP preview sends data only to intended frame, rejects other sources and preserves Creator',async()=>{const x=await setup({source:fixture()});x.p.createPublicationDefinition(configuration());const before=plain(x.p.build(x.graph));const panel=x.root.__radarPublicationUI.open(x.graph);button(panel,'Prévisualiser dans le Viewer').click();await new Promise(r=>setTimeout(r,20));const frame=tag(panel,'iframe');assert.match(frame.src,/profile=viewer&publicationPreview=1/);x.fire('message',{source:{},origin:x.root.location.origin,data:{type:'radar-publication-preview-ready'}});assert.equal(frame.contentWindow.messages.length,0);x.fire('message',{source:frame.contentWindow,origin:'https://evil.test',data:{type:'radar-publication-preview-ready'}});assert.equal(frame.contentWindow.messages.length,0);x.fire('message',{source:frame.contentWindow,origin:x.root.location.origin,data:{type:'radar-publication-preview-ready'}});const sent=frame.contentWindow.messages[0].data.payload;assert.doesNotMatch(JSON.stringify(sent),/PRIVATE_/);assert.equal(sent.catalog.radarRevisions.length,2);x.fire('message',{source:frame.contentWindow,origin:x.root.location.origin,data:{type:'radar-publication-preview-result',ok:true,result:{profile:'viewer',projectionDigest:sent.projectionDigest,revisionIds:sent.catalog.radarRevisions.map(r=>r.revisionId)}}});assert.match(panel.textContent,/Prévisualisation chargée/);assert.deepEqual(plain(x.p.build(x.graph)),before);button(panel,'Fermer la prévisualisation').click();await flush();assert.equal((x.events.get('message')||[]).length,0);});
test('HTTP Viewer boot accepts one same-origin parent message and responds after load',async()=>{const {payload}=await projection();const y=await setup({viewer:true,preview:true});y.fire('load',{});assert.equal(y.messages[0].data.type,'radar-publication-preview-ready');y.fire('message',{source:y.root.parent,origin:'https://evil.test',data:{type:'radar-publication-preview-load',payload}});assert.equal(y.p.status().importedCatalogs,0);y.fire('message',{source:y.root.parent,origin:y.root.location.origin,data:{type:'radar-publication-preview-load',payload}});await new Promise(r=>setTimeout(r,20));assert.equal(y.p.status().importedCatalogs,1);assert.equal(y.messages[1].data.ok,true);});
test('standalone preview composes exactly the same embedded payload as candidate download',async()=>{const x=await setup({source:fixture(),template:true});x.p.createPublicationDefinition(configuration());const panel=x.root.__radarPublicationUI.open(x.graph);button(panel,'Prévisualiser dans le Viewer').click();await new Promise(r=>setTimeout(r,20));const link=find(panel,n=>n.tag==='a'&&n.target==='_blank');assert.equal(link.rel,'noopener noreferrer');assert.equal(all(panel).some(n=>n.tag==='iframe'),false);const previewHtml=await x.downloads.find(d=>d.blob).blob.text();const first=x.v.decode(previewHtml.match(/id="radar-publication-payload">([^<]+)<\/script>/)[1]);button(panel,'Télécharger le Viewer candidat').click();await new Promise(r=>setTimeout(r,20));const html=await x.downloads.filter(d=>d.blob).at(-1).blob.text(),second=x.v.decode(html.match(/id="radar-publication-payload">([^<]+)<\/script>/)[1]);assert.deepEqual(plain(first),plain(second));assert.equal(previewHtml,html);assert.equal(x.p.publicationState().releases.length,0);});
test('standalone generator builds Viewer first and embeds template only in Creator; current entry uses common modules',()=>{const gen=src('scripts/build-common-standalone.mjs'),html=src('radar.html');assert.match(gen,/await generate\(\s*'viewer',[\s\S]*await generate\(\s*'creator'/);assert.match(gen,/id="radar-viewer-template"/);assert.match(gen,/location\.protocol==='about:'/);assert.match(gen,/if\(profile==='viewer'\)\{\s*html=html\.replace\(head/);assert.match(html,/radar-publication-viewer\.js/);assert.match(html,/radar-publication-ui\.js/);assert.match(src('js/radar-workspace-explorer.js'),/allows\('publication.create'\).*radarPublicationUI/);assert.match(src('js/radar-standards-panel.js'),/__radarPublishedPresentation\?\.references===false/);});

// R1: reproduce an intervening presentation refresh selection without claiming
// that this was the cause of the observed Chrome session.
test('startup final selection follows presentation refresh, not an intervening selection',async()=>{const {payload}=await projection();const y=await setup({viewer:true});const change=y.root.changeLanguage;y.root.changeLanguage=async function(lang){await change.call(this,lang);y.e.activate(y.adapter.status()[1]);};assert.equal(y.v.startupStatus(),null);await y.v.load(payload);const boot=y.v.startupStatus();assert.equal(boot.ok,true);assert.equal(boot.expectedRevisionId,'rev0');assert.equal(boot.activeRevisionId,'rev0');assert.equal(boot.sessionGroup,boot.expectedGroup);assert.equal(boot.explorerGroup,boot.expectedGroup);assert.equal(y.session.status().activeGroup,boot.expectedGroup);assert.equal(y.graph.nodes().jsons()[0].data.radarchart.revisionId,'rev0');});
test('startup receipt remains detached and unchanged after subsequent navigation',async()=>{const {payload}=await projection();const y=await setup({viewer:true});await y.v.load(payload);const original=plain(y.v.startupStatus());const changed=y.v.startupStatus();changed.ok=false;changed.activeRevisionId='fake';y.e.activate(y.adapter.status()[1]);assert.equal(y.adapter.getRevision(y.session.status().activeGroup).revisionId,'rev1');assert.deepEqual(plain(y.v.startupStatus()),original);assert.equal(original.ok,true);assert.equal(original.activeRevisionId,'rev0');});


// A8.6 — same native services and actual repository JSZip, byte-level checks.
const CODE='0123456789abcdef0123456789abcdef01234567';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
function installDelivery(x){
  const module={exports:{}};
  vm.runInNewContext(src('lib/jszip.min.js'),{module,exports:module.exports,Buffer,Uint8Array,ArrayBuffer,TextEncoder,TextDecoder,setTimeout,clearTimeout,setImmediate,console});
  x.root.JSZip=module.exports;
  x.root.__radarStandalone={profile:'creator',sourceCommit:CODE};
  const proof={schemaVersion:1,codeCommit:CODE,templateSha256:hash(x.htmlTemplate),templateBytes:Buffer.byteLength(x.htmlTemplate),modules:['js/radar.js','standalone:offline-bootstrap']};
  const node=new Node('script');node.id='radar-viewer-template-proof';node.textContent=Buffer.from(JSON.stringify(proof)).toString('base64');x.body.appendChild(node);
  return {proof,node};
}
async function deliveryFixture(){const x=await setup({source:fixture(),template:true});const d=x.p.createPublicationDefinition(configuration());const info=installDelivery(x);return {x,d,...info};}
test('A8.6 actual ZIP bytes and both entries match ledger; no private source data; history survives reopening',async()=>{
 const {x,d}=await deliveryFixture();const result=await x.p.generateStandalonePublication(x.graph,d.definitionId,1);
 const bytes=new Uint8Array(await result.blob.arrayBuffer());const zip=await x.root.JSZip.loadAsync(bytes,{checkCRC32:true});
 assert.deepEqual(Object.keys(zip.files).sort(),['manifest.json','viewer.html']);
 const manifest=JSON.parse(await zip.file('manifest.json').async('string')),html=await zip.file('viewer.html').async('string');
 assert.equal(manifest.releaseId,result.release.releaseId);assert.equal(manifest.codeCommit,CODE);assert.deepEqual(manifest.revisionIds,['rev0','rev1']);
 assert.doesNotMatch(JSON.stringify(manifest),/PRIVATE_|catalogId|catalogDigest|definitionId/);
 const embedded=x.v.decode(html.match(/id="radar-publication-payload">([^<]+)<\/script>/)[1]);assert.doesNotMatch(JSON.stringify(embedded),/PRIVATE_|publications|sourceDigest|definitionId/);
 assert.equal(await x.root.__radarArtifactIntegrity.digest(embedded.catalog),manifest.projectionDigest);
 const release=x.p.publicationState().releases[0];assert.equal(release.releaseId,result.release.releaseId);assert.equal(release.artifacts.length,3);assert.ok(release.validation.checks.includes('download-blob-sha256'));
 for(const a of release.artifacts){const b=a.path===result.filename?bytes:await zip.file(a.path).async('uint8array');assert.equal(a.bytes,b.byteLength);assert.equal(a.sha256,hash(b));}
 assert.equal(x.p.isDirty(x.graph),true);result.release.definition.configuration.name='fake';assert.equal(x.p.publicationState().releases[0].definition.configuration.name,'Internal');
 const reopened=await setup({source:x.p.build(x.graph)});assert.equal(reopened.p.publicationState().releases[0].releaseId,release.releaseId);
});
test('A8.6 rejects tampered template and mismatched or working-tree code provenance without ledger change',async()=>{
 const {x,d,proof,node}=await deliveryFixture();const template=x.document.getElementById('radar-viewer-template');const original=template.textContent;
 template.textContent=Buffer.from(x.htmlTemplate+'tamper').toString('base64');await assert.rejects(x.p.generateStandalonePublication(x.graph,d.definitionId,1),/template byte integrity/);template.textContent=original;
 x.root.__radarStandalone.sourceCommit=CODE+'+working-tree';await assert.rejects(x.p.generateStandalonePublication(x.graph,d.definitionId,1),/uncommitted or mismatched/);x.root.__radarStandalone.sourceCommit=CODE;
 node.textContent=Buffer.from(JSON.stringify({...proof,codeCommit:'f'.repeat(40)})).toString('base64');await assert.rejects(x.p.generateStandalonePublication(x.graph,d.definitionId,1),/uncommitted or mismatched/);
 assert.equal(x.p.publicationState().releases.length,0);
});
test('A8.6 stale definition, external packaging, Viewer and corrupt ZIP rejected without release',async()=>{
 const {x,d}=await deliveryFixture();await assert.rejects(x.p.generateStandalonePublication(x.graph,d.definitionId,2),/stale/);
 const plan=await x.p.preparePublicationRelease(x.graph,d.definitionId,1,'standalone');await assert.rejects(x.p.recordPublicationRelease(x.graph,plan,{codeCommit:CODE,modules:['js/radar.js'],artifacts:[{path:'viewer.html',sha256:'a'.repeat(64),bytes:1}],checks:['template-byte-sha256']}),/reserved byte verification/);
 const orig=x.root.JSZip.loadAsync;x.root.JSZip.loadAsync=async()=>({files:{unexpected:{} }});await assert.rejects(x.p.generateStandalonePublication(x.graph,d.definitionId,1),/ZIP inventory/);x.root.JSZip.loadAsync=orig;
 const cfg=configuration();cfg.packaging.data='external';x.p.updatePublicationDefinition(d.definitionId,1,cfg);await assert.rejects(x.p.generateStandalonePublication(x.graph,d.definitionId,2),/embedded data/);
 const y=await setup({viewer:true});await assert.rejects(y.p.generateStandalonePublication(y.graph,d.definitionId,1),/capability denied/);assert.equal(x.p.publicationState().releases.length,0);
});
test('A8.6 concurrent definition change during byte verification aborts before ledger mutation',async()=>{
 const {x,d}=await deliveryFixture();const orig=x.root.JSZip.loadAsync;let changed=false;
 x.root.JSZip.loadAsync=async function(...args){if(!changed){changed=true;const cfg=configuration();cfg.name='Changed during assembly';x.p.updatePublicationDefinition(d.definitionId,1,cfg);}return orig.apply(this,args);};
 await assert.rejects(x.p.generateStandalonePublication(x.graph,d.definitionId,1),/workspace changed/);assert.equal(x.p.publicationState().releases.length,0);
});
test('A8.6 actual Publisher generates one ZIP and exposes retry without second release',async()=>{
 const {x}=await deliveryFixture();const panel=x.root.__radarPublicationUI.open(x.graph);button(panel,'Créer une nouvelle livraison ZIP').click();
 for(let i=0;i<100&&x.p.publicationState().releases.length===0;i++)await new Promise(r=>setTimeout(r,10));await flush();
 assert.equal(x.p.publicationState().releases.length,1);const filename=x.downloads.find(d=>d.filename)?.filename;assert.match(filename,/^radar-publication-[a-f0-9-]{36}\.zip$/);
 button(panel,'Télécharger la dernière livraison de cette session').click();await flush();assert.equal(x.downloads.filter(d=>d.filename===filename).length,2);assert.equal(x.p.publicationState().releases.length,1);
});
test('A8.6 build embeds provenance only in Creator and omits new authoring ZIP components from standalone Viewer',()=>{
 const gen=src('scripts/build-common-standalone.mjs');assert.match(gen,/id="radar-viewer-template-proof"/);assert.match(gen,/templateSha256:createHash\('sha256'\)/);assert.match(gen,/profile==='viewer'&&\['lib\/jszip.min.js','js\/radar-publication-delivery.js'\]/);
});

// A8.6-R1 — the same native projection has a dedicated consultation UI.
test('published collection replaces the tree with a localized radar card and switches without a revision picker',async()=>{
 const {payload}=await projection(),y=await setup({viewer:true});
 const genericPanel=y.document.getElementById('radar-published-radar-panel');assert.equal(genericPanel.hidden,true);
 await y.v.load(payload);const profile=y.root.__radarApplicationProfile;
 assert.equal(profile.published,true);assert.equal(profile.allows('catalog.open'),false);assert.equal(profile.allowsToolbar('item2:catrev_1'),false);
 assert.equal(y.mount.children[0].hidden,true);assert.equal(genericPanel.hidden,false);
 assert.match(genericPanel.textContent,/Radar 0/);assert.match(genericPanel.textContent,/Organisation/);assert.match(genericPanel.textContent,/Portefeuille/);
 assert.match(genericPanel.textContent,/Published version/);assert.match(genericPanel.textContent,/1.0.0/);
 let selector=y.document.getElementById('radar-published-selector');assert.equal(selector.children.length,2);selector.value=y.adapter.status()[1];selector.emit('change');
 assert.match(genericPanel.textContent,/Radar 1/);assert.equal(y.session.status().activeGroup,y.adapter.status()[1]);
 assert.equal(y.document.getElementById('radar-published-selector').value,y.adapter.status()[1]);
 await y.root.changeLanguage('fr');assert.match(genericPanel.textContent,/Version publiée/);assert.match(genericPanel.textContent,/Radar à consulter/);
 assert.equal(y.e.status().activeGroup,y.adapter.status()[1]);
});
test('single radar has no selector; publication name, native labels and reference policy are honored',async()=>{
 const source=fixture();source.extensions.administration={radarNames:{radar1:'Nom public <img>'},revisionLabels:{rev0:'Référence V1'}};
 const x=await setup({source}),c=configuration();c.scope.revisionIds=['rev0'];c.presentation.references=false;
 const def=x.p.createPublicationDefinition(c),r=await x.p.preparePublicationProjection(x.graph,def.definitionId,1),payload=x.v.payload(r.catalog,r.report,c.presentation);
 const y=await setup({viewer:true,embedded:payload}),profile=y.root.__radarApplicationProfile;
 assert.equal(profile.published,true);assert.equal(profile.allowsMenu('files'),false);assert.equal(profile.allowsMenu('radartools:selectcatalogrevision'),false);
 assert.throws(()=>y.ui.openFile(),/catalog.open/);y.fire('load',{});await new Promise(r=>setTimeout(r,20));
 const panel=y.document.getElementById('radar-published-radar-panel');assert.equal(y.v.startupStatus().ok,true);
 assert.equal(y.document.getElementById('radar-published-selector'),null);assert.match(panel.textContent,/Nom public <img>/);assert.match(panel.textContent,/Référence V1/);
 assert.ok(!all(panel).some(n=>n.tag==='button'));assert.equal(y.adapter.status().length,1);
});
test('published workspace cannot be replaced, closed or extended by normal services',async()=>{
 const {payload}=await projection(),y=await setup({viewer:true,preview:true});const profile=y.root.__radarApplicationProfile;
 assert.equal(profile.published,true);assert.throws(()=>y.ui.load(payload.catalog,y.root.w2ui.toolbar),/catalog.open/);
 await y.v.load(payload);const before=plain(y.e.status());
 assert.throws(()=>y.ui.openFile(),/catalog.open/);assert.throws(()=>y.ui.load(payload.catalog,y.root.w2ui.toolbar),/catalog.open/);
 assert.throws(()=>y.p.remember(payload.catalog,{revisions:[]}),/catalog.open/);assert.throws(()=>y.adapter.register('foreign',payload.catalog.radarRevisions[0]),/catalog.open/);
 assert.throws(()=>y.e.addCatalog(payload.catalog,{revisions:[]}),/catalog.open/);assert.throws(()=>y.e.releaseCatalog(y.adapter.status()),/catalog.open/);
 assert.throws(()=>y.p.closeCatalog(),/catalog.open/);await assert.rejects(y.ui.closeCatalog(y.graph,'close'),/catalog.open/);await assert.rejects(y.ui.requestClose(y.graph),/catalog.open/);
 assert.throws(()=>y.e.activate('foreign'),/not loaded/);assert.throws(()=>y.session.beforeExternalReplace(y.graph),/graph.import/);assert.throws(()=>y.ui.openRevisionPicker(),/descriptive panel/);
 assert.throws(()=>profile.initializePublication(()=>{}),/denied/);assert.deepEqual(plain(y.e.status()),before);
});
test('generic Viewer keeps import and tree; current publications reject ambiguous published revisions without guessing latest',async()=>{
 const y=await setup({viewer:true,source:{...fixture(),radarRevisions:fixture().radarRevisions.slice(0,2)}});
 assert.equal(y.root.__radarApplicationProfile.published,false);assert.equal(y.root.__radarApplicationProfile.allows('catalog.open'),true);
 assert.equal(y.document.getElementById('radar-published-radar-panel').hidden,true);
 const source=fixture();source.radarRevisions[2].status='published';const x=await setup({source,template:true});
 const c=configuration();c.scope.revisionIds=['rev0','rev2'];const def=x.p.createPublicationDefinition(c);
 await assert.rejects(x.p.preparePublicationProjection(x.graph,def.definitionId,1),/one published revision per radar/i);
 const raw=x.root.__radarPublicationProjection.project(source,c);assert.equal(raw.report.radarCount,1);assert.equal(raw.report.revisionIds.length,2);
 const digest=await x.root.__radarArtifactIntegrity.digest(raw.catalog);assert.throws(()=>x.v.payload(raw.catalog,{projectionDigest:digest},c.presentation),/one published revision per radar/);
 assert.equal(x.p.publicationState().releases.length,0);
});
test('malformed embedded publication stays locked before and after boot failure',async()=>{
 const {payload}=await projection(),bad=plain(payload);bad.catalog.standards[0].name='tampered';
 const y=await setup({viewer:true,embedded:bad});assert.equal(y.root.__radarApplicationProfile.allows('catalog.open'),false);
 y.fire('load',{});await new Promise(r=>setTimeout(r,20));assert.equal(y.p.status().importedCatalogs,0);assert.equal(y.v.startupStatus(),null);
 assert.equal(y.root.__radarApplicationProfile.allows('catalog.open'),false);assert.throws(()=>y.ui.openFile(),/catalog.open/);
});
test('publication editor refuses two revisions of one radar with localized explanation',async()=>{
 const source=fixture();source.radarRevisions[2].status='published';const x=await setup({source});const c=configuration();c.scope.revisionIds=['rev0'];x.p.createPublicationDefinition(c);
 const panel=x.root.__radarPublicationUI.open(x.graph);button(panel,'Modifier').click();await flush();
 const second=all(panel).find(n=>n.name==='revisions'&&n.value==='rev2');assert.ok(second);second.checked=true;
 tag(panel,'form').emit('submit');await flush();assert.match(panel.textContent,/Plusieurs révisions publiées pour un radar/);
 assert.deepEqual(plain(x.p.publicationState().definitions[0].configuration.scope.revisionIds),['rev0']);
});

// A8.6-R2 — historical configuration and byte-identical regeneration.
test('R2 duplicate generation requires confirmation; reason and historical differences survive reopening',async()=>{
 const {x}=await deliveryFixture();const panel=x.root.__radarPublicationUI.open(x.graph);
 named(panel,'deliveryReason').value='First controlled delivery';button(panel,'Créer une nouvelle livraison ZIP').click();
 for(let i=0;i<100&&x.p.publicationState().releases.length<1;i++)await new Promise(r=>setTimeout(r,10));await flush();
 const first=x.p.publicationState().releases[0];assert.equal(first.reason,'First controlled delivery');assert.match(panel.textContent,/First controlled delivery/);
 let prompts=[];x.root.confirm=message=>{prompts.push(message);return false;};button(panel,'Créer une nouvelle livraison ZIP').click();
 for(let i=0;i<100&&!prompts.length;i++)await new Promise(r=>setTimeout(r,10));await flush();
 assert.equal(prompts.length,1);assert.match(prompts[0],new RegExp(first.releaseId));assert.equal(x.p.publicationState().releases.length,1);
 x.root.confirm=()=>true;named(panel,'deliveryReason').value='Intentional repeat';button(panel,'Créer une nouvelle livraison ZIP').click();
 for(let i=0;i<100&&x.p.publicationState().releases.length<2;i++)await new Promise(r=>setTimeout(r,10));await flush();
 const second=x.p.publicationState().releases[1];assert.equal(second.reason,'Intentional repeat');assert.notEqual(second.releaseId,first.releaseId);assert.deepEqual(plain(x.root.__radarPublicationUI.compareReleases(first,second)),['viewerSame']);
 assert.match(panel.textContent,/Viewer identique/);assert.match(panel.textContent,/L002/);
 const reopened=await setup({source:x.p.build(x.graph)});const history=reopened.root.__radarPublicationUI.open(reopened.graph);assert.match(history.textContent,/Intentional repeat/);assert.match(history.textContent,/Viewer identique/);assert.ok(!all(history).some(n=>n.tag==='button'&&n.textContent.includes('dernière livraison de cette session')));
});
test('R2 expected Viewer hash mismatch aborts before recording; legacy releases remain valid',async()=>{
 const {x,d}=await deliveryFixture();await assert.rejects(x.p.generateStandalonePublication(x.graph,d.definitionId,1,{expectedViewerSha256:'0'.repeat(64)}),/Viewer changed after comparison/);assert.equal(x.p.publicationState().releases.length,0);
 const old=await x.p.generateStandalonePublication(x.graph,d.definitionId,1);assert.equal(Object.hasOwn(old.release,'reason'),false);
 assert.throws(()=>x.root.__radarPublicationModel.release({...old.release,reason:'bad '}),/reason/);
 const changed=plain(old.release);changed.source.codeCommit='f'.repeat(40);changed.artifacts[0].sha256='a'.repeat(64);changed.resolvedRevisions[0].version='2.0.0';
 assert.deepEqual(plain(x.root.__radarPublicationUI.compareReleases(old.release,changed)),['revisionsChanged','engineChanged','viewerChanged']);
});
