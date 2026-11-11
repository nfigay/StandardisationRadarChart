/* S13-R12 — One lower W2UI grid, two catalog views: existing ICS.csv tree and local references.
 * No new persistence store. No claim that the legacy RSS placeholder loads standards.
 */
(function(root){
 'use strict';
 const ICS_URL='https://nfigay.github.io/StandardisationRadarChart/ICS.csv';
 let mount=null,grid=null,search=null,status=null,selected=null,graphProvider=null;
 let isoLayout=null,isoSidebar=null,sidebarSelection={ics:null,committees:null},sidebarMode=null,sidebarSources=null,sidebarLanguage=null;
 let mode='ics',icsRows=null,icsError=null,loading=false,isoDeliverables=[],isoCommittees=[],isoSync=[],isoLoading=false,localSyncBusy=false,localSyncMessage='';
 /* S14-L2 INCREMENTAL TREES */
 let treeIndex=null,treeIcs=null,treeCommittees=null,treeDeliverables=null;
 function getTreeIndex(){
   if(!root.__radarIsoTreeIndex?.create)throw Error('S14-L2 : index des arborescences ISO indisponible');
   if(!treeIndex||treeIcs!==icsRows||treeCommittees!==isoCommittees||treeDeliverables!==isoDeliverables){
     treeIndex=root.__radarIsoTreeIndex.create(icsRows||[],isoCommittees,isoDeliverables);
     treeIcs=icsRows;treeCommittees=isoCommittees;treeDeliverables=isoDeliverables;
   }
   return treeIndex;
 }
 const isoStrings={fr:{"detail":"Détails","detailColumn":"Fiche","close":"Fermer","formTitle":"Fiche ISO","formTab":"Fiche de la norme","rawTab":"Métadonnées originales","reference":"Référence","titleFr":"Titre français","titleEn":"Titre anglais","otherLanguages":"Autres titres","scopeFr":"Description française","scopeEn":"Description anglaise","otherScopes":"Autres descriptions","ics":"Codes ICS","committee":"Comité TC / SC","stage":"Stade ISO","edition":"Édition","publicationDate":"Date de publication","deliverableType":"Type de livrable","supplementType":"Type de supplément","languages":"Langues","pages":"Pages","replaces":"Remplace","replacedBy":"Remplacée par","sourceData":"Toutes les métadonnées ISO","grpIdentification":"Identification","grpTitles":"Titres","grpDescriptions":"Descriptions / périmètre","grpClassification":"Classification et organisation","grpLifecycle":"Cycle de vie","grpRelations":"Relations entre éditions","grpRaw":"Champs bruts (consultation)","colIcs":"Code ICS","colLabel":"Libellé","colEnglishLabel":"Libellé anglais","colTC":"TC / SC","colTCRef":"TC / SC / Référence","colDescription":"Description","colRef":"Référence","colTitle":"Titre","colEnglishTitle":"Titre anglais","colStage":"Stade","colEdition":"Édition","colProvenance":"Provenance","modeIcs":"ICS et normes","modeCommittees":"Comités TC / SC","modeIsoList":"Normes ISO","modeReferences":"Références locales","refresh":"Actualiser","sync":"Charger catalogue ISO","add":"Ajouter au radar","import":"Importer JSONL","searchIcs":"ICS, titre, description, référence…","searchCommittees":"TC/SC, titre, description, norme…","searchIso":"Norme ISO, texte anglais, ICS, comité, stade…","searchLocal":"Numéro, titre, édition…","searchAccessible":"Rechercher dans le catalogue sélectionné","missingReference":"Identifiant ISO {{id}} — référence absente du cache","noCategory":"Sans catégorie ICS connue dans le catalogue","readOnlyUnavailable":"Le formulaire w2ui (w2form) est indisponible."},en:{"detail":"Details","detailColumn":"Details","close":"Close","formTitle":"ISO record","formTab":"Standard details","rawTab":"Original metadata","reference":"Reference","titleFr":"French title","titleEn":"English title","otherLanguages":"Other titles","scopeFr":"French description","scopeEn":"English description","otherScopes":"Other descriptions","ics":"ICS codes","committee":"Responsible TC / SC","stage":"ISO stage","edition":"Edition","publicationDate":"Publication date","deliverableType":"Deliverable type","supplementType":"Supplement type","languages":"Languages","pages":"Pages","replaces":"Replaces","replacedBy":"Replaced by","sourceData":"All ISO source metadata","grpIdentification":"Identification","grpTitles":"Titles","grpDescriptions":"Descriptions / scope","grpClassification":"Classification and organization","grpLifecycle":"Lifecycle","grpRelations":"Relationships between editions","grpRaw":"Raw source fields (read-only)","colIcs":"ICS code","colLabel":"Label","colEnglishLabel":"English label","colTC":"TC / SC","colTCRef":"TC / SC / Reference","colDescription":"Description","colRef":"Reference","colTitle":"Title","colEnglishTitle":"English title","colStage":"Stage","colEdition":"Edition","colProvenance":"Provenance","modeIcs":"ICS and standards","modeCommittees":"Technical committees TC / SC","modeIsoList":"ISO standards","modeReferences":"Local references","refresh":"Refresh","sync":"Load ISO catalogue","add":"Add to radar","import":"Import JSONL","searchIcs":"ICS, title, description, reference…","searchCommittees":"TC/SC, title, description, standard…","searchIso":"ISO standard, English text, ICS, committee, stage…","searchLocal":"Number, title, edition…","searchAccessible":"Search the selected catalogue","missingReference":"ISO identifier {{id}} — reference missing from cache","noCategory":"No known ICS category in catalogue","readOnlyUnavailable":"The w2ui form (w2form) is unavailable."}};
 function registerI18n(){
   const instance=root.i18next;
   if(!instance?.addResourceBundle)return;
   for(const language of ['fr','en'])instance.addResourceBundle(language,'translation',{isoPanel:isoStrings[language]},true,true);
 }
 function tr(key,options){
   const instance=root.i18next;
   const lang=String(instance?.resolvedLanguage||instance?.language||'fr').split('-')[0];
   const fallback=isoStrings[lang]?.[key]||isoStrings.fr[key]||key;
   if(instance?.t){const value=instance.t('isoPanel.'+key,{...options,defaultValue:fallback});if(value&&value!=='isoPanel.'+key)return value;}
   return fallback.replace(/\{\{(\w+)\}\}/g,(_,k)=>String(options?.[k]??''));
 }
 registerI18n();
 let activeDetailRecord=null;
 let localeSubscribed=false;
 function bindLocale(){
   if(localeSubscribed||!root.i18next?.on)return;
   root.i18next.on('languageChanged',()=>{refresh();updateStaticLabels();if(activeDetailRecord)showDetail({...activeDetailRecord});});
   localeSubscribed=true;
 }
 function updateStaticLabels(){
   if(!mount)return;
   for(const el of mount.querySelectorAll('[data-iso-translation]'))el.textContent=tr(el.dataset.isoTranslation);
   if(search)search.setAttribute('aria-label',tr('searchAccessible'));
 }

 const escapeHtml=v=>str(v).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
 const asLines=v=>str(v).replace(/\r\n/g,'\n');
 const preview=v=>escapeHtml(asLines(v).slice(0,280)).replace(/\n/g,'<br>');
 const detailColumn={field:'detail',text:tr('detailColumn'),size:'82px',sortable:false,render:r=>r.kind==='standard'?{html:'<button type=\"button\" data-iso-detail=\"'+escapeHtml(r.isoId)+'\">'+escapeHtml(tr('detail'))+'</button>'}:''};
 const findDeliverable=id=>isoDeliverables.find(x=>str(x.id)===str(id));
 const findCommittee=id=>isoCommittees.find(x=>str(x.id)===str(id));
 /* S14-L3: one navigation index derived from the existing IndexedDB cache. */
 let sidebarIndex=null,sidebarInputs=null;
 function getSidebarIndex(){
   if(!root.__radarIsoSidebarIndex?.create)throw Error('S14-L3 : index sidebar manquant');
   if(!sidebarIndex||sidebarInputs?.[0]!==icsRows||sidebarInputs?.[1]!==isoCommittees||sidebarInputs?.[2]!==isoDeliverables){
     sidebarIndex=root.__radarIsoSidebarIndex.create(icsRows||[],isoCommittees,isoDeliverables);
     sidebarInputs=[icsRows,isoCommittees,isoDeliverables];
   }
   return sidebarIndex;
 }
 function showGroupDetails(type,id){
   const info=getSidebarIndex().get(type,id);if(!info||typeof root.w2form!=='function'||!root.w2popup)return;
   const title=type==='ics'?tr('colIcs'):tr('colTCRef');
   const detailRecord={reference:String(info.reference||''),label:String(info.title||''),english:String(info.titleEn||''),scope:String(info.description||'').replace(/\\n/g,'\n'),metadata:JSON.stringify(info.raw||{},null,2)};
   const containerId='iso-group-detail-container';
   try{root.w2ui?.isoGroupReadOnlyForm?.destroy?.();}catch(_){}
   root.w2popup.open({title:escapeHtml(title+': '+detailRecord.reference),width:760,height:580,
     body:'<div id="'+containerId+'" style="height:100%;width:100%"></div>',
     onOpen(event){event.onComplete=()=>{
       const element=root.document.getElementById(containerId);if(!element)return;
       const fields=[['reference',title,'text'],['label',tr('colLabel'),'textarea'],['english',tr('colEnglishLabel'),'textarea'],['scope',tr('colDescription'),'textarea'],['metadata',tr('sourceData'),'textarea']].map(([field,label,type])=>({field,type,html:{label,span:12,attr:'readonly style="width:96%;'+(type==='textarea'?'height:90px;white-space:pre-wrap;':'')+'"'}}));
       const form=new root.w2form({name:'isoGroupReadOnlyForm',focus:-1,fields,record:detailRecord,actions:{}});
       form.render(element);
     };},onClose(){try{root.w2ui?.isoGroupReadOnlyForm?.destroy?.();}catch(_){}}});
 }
 function refreshSidebar(){
   if(!isoLayout)return;
   const navMode=mode==='ics'?'ics':mode==='committees'?'committees':null;
   if(!navMode){isoLayout.hide('left');return;}
   isoLayout.show('left');
   const model=getSidebarIndex();const language=String(root.i18next?.language||'fr').slice(0,2);
   if(isoSidebar&&sidebarMode===navMode&&sidebarSources===model&&sidebarLanguage===language)return;
   try{isoSidebar?.destroy?.();}catch(_){}
   const nodes=model.sidebar(navMode,language);
   function addEye(group){
     group.text=escapeHtml(group.text)+' <span role="button" title="'+escapeHtml(tr('detail'))+'" data-iso-nav-eye="'+encodeURIComponent(group.id)+'" style="float:right;cursor:pointer">&#128065;</span>';
     for(const sub of group.nodes||[])addEye(sub);
   }
   for(const node of nodes)addEye(node);
   isoSidebar=new root.w2sidebar({name:'isoCatalogSidebar',nodes,onClick(event){
     const id=String(event.target||event.detail?.target||'');
     if(id.startsWith(navMode+':')){sidebarSelection[navMode]=id.slice(navMode.length+1);Promise.resolve().then(()=>refresh());}
   }});
   sidebarMode=navMode;sidebarSources=model;sidebarLanguage=language;
   isoLayout.html('left',isoSidebar);
 }

 function showDetail(record){
   const d=root.document;
   const item=record.kind==='standard'?findDeliverable(record.isoId):record.kind==='committee'?findCommittee(record.committeeId):null;
   if(!d||!item)return;
   activeDetailRecord={...record};
   if(typeof root.w2form!=='function'){
     if(status)status.textContent=tr('readOnlyUnavailable');
     return;
   }
   d.getElementById('iso-standard-detail-dialog')?.close();
   d.getElementById('iso-standard-detail-dialog')?.remove();
   const dialog=d.createElement('dialog');
   dialog.id='iso-standard-detail-dialog';
   dialog.style.cssText='box-sizing:border-box;width:min(1000px,96vw);max-width:96vw;height:min(780px,90vh);max-height:90vh;padding:0;border:1px solid #aaa;border-radius:8px;overflow:hidden;background:white';
   const style=d.createElement('style');
   style.textContent='#iso-standard-detail-dialog .w2ui-label, #iso-standard-detail-dialog .w2ui-field > label, #iso-standard-detail-dialog .w2ui-field label {white-space:normal!important;overflow:visible!important;text-overflow:clip!important;overflow-wrap:break-word!important;max-width:none!important;}';
   dialog.appendChild(style);
   const wrapper=d.createElement('div');wrapper.style.cssText='height:100%;display:flex;flex-direction:column;min-height:0';
   const header=d.createElement('div');header.style.cssText='flex:none;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:10px 16px;border-bottom:1px solid #ddd';
   const heading=d.createElement('strong');heading.textContent=item.reference||tr('formTitle');heading.style.cssText='font:600 18px Arial,sans-serif';header.appendChild(heading);
   const close=d.createElement('button');close.type='button';close.textContent=tr('close');close.className='w2ui-btn';header.appendChild(close);wrapper.appendChild(header);
   const container=d.createElement('div');container.style.cssText='flex:1;min-height:0;overflow:hidden';wrapper.appendChild(container);dialog.appendChild(wrapper);d.body.appendChild(dialog);
   if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');
   const line=v=>String(v??'').replace(/\r\n?/g,'\n').replace(/\\n/g,'\n').trim();
   const list=v=>Array.isArray(v)?v.map(x=>typeof x==='object'?JSON.stringify(x):String(x)).join(', '):v==null?'':typeof v==='object'?JSON.stringify(v):String(v);
   const localized=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
   const titles=localized(item.titleI18n),scopes=localized(item.scopeI18n);
   const resolveRelations=ids=>Array.isArray(ids)?ids.map(id=>findDeliverable(id)?.reference||tr('missingReference',{id})).join('\n'):'';
   const recordData={
     reference:item.reference||'',titleFr:line(titles.fr||item.title),titleEn:line(titles.en),
     scopeFr:line(scopes.fr),scopeEn:line(scopes.en||item.scope),
     ics:list(item.icsCodes),committee:list(item.ownerCommittee),stage:list(item.currentStage),
     edition:list(item.edition),publicationDate:list(item.publicationDate),
     deliverableType:list(item.deliverableType),supplementType:list(item.supplementType),
     languages:list(item.languages),pages:list(item.pages),
     replaces:resolveRelations(item.replaces),replacedBy:resolveRelations(item.replacedBy),
     otherLanguages:Object.entries(titles).filter(([k])=>k!=='fr'&&k!=='en').map(([k,v])=>k+': '+line(v)).join('\n'),
     otherScopes:Object.entries(scopes).filter(([k])=>k!=='fr'&&k!=='en').map(([k,v])=>k+': '+line(v)).join('\n'),
     sourceData:JSON.stringify(item.sourceData||item,null,2)
   };
   // All controls are read-only. No save action is created for ISO source data.
   const fields=[];
   function field(name,label,type='text',group='',page=0,height=0){
     const html={label:tr(name),span:8,page,attr:type==='textarea'?('readonly style="width:96%;height:'+height+'px;resize:vertical;white-space:pre-wrap"'):'readonly style="width:96%"'};
     if(group)html.group=tr(group);
     fields.push({field:name,type,html});
   }
   field('reference','Référence','text','grpIdentification');
   field('titleFr','Titre français','textarea','grpTitles',0,62);
   field('titleEn','Titre anglais','textarea','',0,62);
   field('otherLanguages','Autres titres','textarea','',0,55);
   field('scopeFr','Description française','textarea','grpDescriptions',0,150);
   field('scopeEn','Description anglaise','textarea','',0,150);
   field('otherScopes','Autres descriptions','textarea','',0,75);
   field('ics','Codes ICS','text','grpClassification');
   field('committee','Comité TC / SC');
   field('stage','Stade ISO','text','grpLifecycle');
   field('edition','Édition');
   field('publicationDate','Date de publication');
   field('deliverableType','Type de livrable');
   field('supplementType','Type de supplément');
   field('languages','Langues');
   field('pages','Pages');
   field('replaces','Remplace','textarea','grpRelations',0,85);
   field('replacedBy','Remplacée par','textarea','',0,85);
   field('sourceData','Toutes les métadonnées ISO','textarea','grpRaw',1,440);
   const name='isoStandardReadOnlyForm';
   try{root.w2ui?.[name]?.destroy?.();}catch(_){/* clean up stale form */}
   let form;
   try{
     form=new root.w2form({name,style:'border:0;background:transparent',
       tabs:[{id:'details',text:tr('formTab')},{id:'raw',text:tr('rawTab')}],
       fields,record:recordData,actions:{}});
     form.render(container);
   }catch(e){dialog.remove();if(status)status.textContent='Erreur d’ouverture w2form : '+e.message;return;}
   dialog.addEventListener('close',()=>{
     if(activeDetailRecord?.isoId===record.isoId&&activeDetailRecord?.committeeId===record.committeeId)activeDetailRecord=null;
     try{form.destroy();}catch(_){/* already cleaned up */}
     dialog.remove();
   },{once:true});
   close.addEventListener('click',()=>dialog.close());
 }
 const str=v=>String(v??'').trim();
 const norm=v=>str(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 function icsTree(rows,term=''){
   const query=norm(term),nodes=new Map();
   for(const r of rows||[]){
     const id=str(r.identifier),en=str(r.titleEn),fr=str(r.titleFr);
     if(!id||(!en&&!fr)||nodes.has(id))continue;
     nodes.set(id,{recid:'ics:'+id,identifier:id,title:fr||en,titleEn:en,titleFr:fr,parent:str(r.parent),w2ui:{children:[],expanded:false},_match:!query||norm([id,en,fr].join(' ')).includes(query)});
   }
   const children=new Map();for(const node of nodes.values()){
     const parent=node.parent;
     if(parent&&parent!==node.identifier&&nodes.has(parent)){
       if(!children.has(parent))children.set(parent,[]);
       children.get(parent).push(node);
     }
   }
   const visited=new Set();
   function walk(node,ancestors){
     if(ancestors.has(node.identifier)||visited.has(node.identifier))return null;
     visited.add(node.identifier);
     const next=new Set(ancestors);next.add(node.identifier);
     const nested=(children.get(node.identifier)||[]).map(n=>walk(n,next)).filter(Boolean);
     const include=node._match||nested.length>0;
     if(!include)return null;
     node.w2ui.children=nested;
     node.w2ui.expanded=Boolean(query&&nested.length);
     delete node._match;delete node.parent;
     return node;
   }
   const roots=[];
   for(const node of nodes.values())if(!node.parent||!nodes.has(node.parent)||node.parent===node.identifier){const out=walk(node,new Set());if(out)roots.push(out);}
   // Treat malformed cycles as independent roots rather than discarding the whole catalog.
   for(const node of nodes.values())if(!visited.has(node.identifier)){const out=walk(node,new Set());if(out)roots.push(out);}
   return roots;
 }
 function enrichedIcsTree(rows,standards,term=''){
   const roots=icsTree(rows||[]),byCode=new Map();
   function index(nodes){for(const n of nodes){byCode.set(n.identifier,n);index(n.w2ui?.children||[]);}}
   index(roots);let attached=0;const unknown=[];
   for(const s of standards||[]){
     const codes=s.icsCodes?.length?s.icsCodes:[''];
     for(const code of codes){
       const leaf={recid:'iso-standard:ics:'+code+':'+s.id,kind:'standard',isoId:s.id,
         identifier:s.reference,title:s.title,description:s.scope,stage:s.currentStage,committee:s.ownerCommittee,icsCodes:(s.icsCodes||[]).join(', '),titleEn:s.titleI18n?.en||'',kind:'standard'};
       const parent=byCode.get(code);
       if(parent)parent.w2ui.children.push(leaf);else unknown.push(leaf);
       attached++;
     }
   }
   if(unknown.length)roots.push({recid:'ics:unclassified',kind:'group',identifier:'—',title:tr('noCategory'),w2ui:{children:unknown,expanded:false}});
   const q=norm(term);
   function filter(n){const children=(n.w2ui?.children||[]).map(filter).filter(Boolean);
     if(q&&!norm([n.identifier,n.title,n.titleEn,n.description,n.stage,n.committee].join(' ')).includes(q)&&!children.length)return null;
     const result={...n};if(n.w2ui)result.w2ui={...n.w2ui,children,expanded:Boolean(q&&children.length)};
     return result;
   }
   return {records:roots.map(filter).filter(Boolean),occurrences:attached};
 }
 async function loadIsoCache(){
   const provider=root.__radarIsoOpenData;if(!provider||isoLoading)return;
   isoLoading=true;
   try{[isoDeliverables,isoCommittees,isoSync]=await Promise.all([
     provider.readAll('deliverables'),provider.readAll('committees'),provider.syncInfo()]);}
   catch(e){if(status)status.textContent='Cache ISO indisponible : '+e.message;}
   finally{isoLoading=false;refresh();}
 }
 function referenceRows(term){
   try{return root.__radarStandardRegistry?.records(term,1000)||[];}
   catch(e){if(status)status.textContent=e.message;return [];}
 }
 function updateModeButtons(){
   for(const btn of mount?.querySelectorAll('[data-catalog-mode]')||[]){
     const active=btn.dataset.catalogMode===mode;
     btn.setAttribute('aria-pressed',String(active));btn.style.fontWeight=active?'bold':'normal';
   }
 }
 function refresh(){
   if(!grid)return;
   detailColumn.text=tr('detailColumn');
   const term=search?.value||'';
   if(search)search.placeholder=mode==='ics'?tr('searchIcs'):mode==='committees'?tr('searchCommittees'):mode==='iso-list'?tr('searchIso'):tr('searchLocal');
   if(mode==='ics'||mode==='committees'){
     refreshSidebar();
     grid.columns=[
       {field:'identifier',text:tr('colRef'),size:'190px',sortable:true},
       {field:'title',text:tr('colTitle'),size:'32%',sortable:true},
       {field:'titleEn',text:tr('colEnglishTitle'),size:'24%',sortable:true},
       {field:'icsCodes',text:tr('ics'),size:'140px'},
       {field:'committee',text:tr('colTC'),size:'160px'},
       {field:'stage',text:tr('colStage'),size:'80px'},detailColumn
     ];
     const id=sidebarSelection[mode];
     const docs=getSidebarIndex().list(mode,id,term,true);
     const fullGrid=root.__radarIsoFullGrid;
     if(!fullGrid?.project)throw Error('S14-L1: projection des normes indisponible');
     const results=fullGrid.project(docs,'');
     grid.clear(true);grid.records=results;grid.total=results.length;grid.buffered=results.length;
     if(status)status.textContent=results.length+' '+(mode==='ics'?'normes pour la classification ICS':'normes pour le comité TC/SC')+' · '+isoDeliverables.length+' normes en cache · '+(id?'Sélection : '+(getSidebarIndex().get(mode,id)?.reference||id):'Tous les groupes');
   } else if(mode==='iso-list'){
     refreshSidebar();
     grid.columns=[
       {field:'identifier',text:tr('colRef'),size:'180px',sortable:true},
       {field:'title',text:tr('colTitle'),size:'32%',sortable:true},
       {field:'titleEn',text:tr('colEnglishTitle'),size:'24%',sortable:true},
       {field:'icsCodes',text:tr('ics'),size:'135px'},
       {field:'committee',text:tr('colTC'),size:'145px'},
       {field:'stage',text:tr('colStage'),size:'75px'},detailColumn
     ];
     /* S14-L1 FULL ISO GRID */ const fullGrid=root.__radarIsoFullGrid;if(!fullGrid?.project)throw Error('S14-L1: projection ISO manquante');
     grid.clear(true);const projected=fullGrid.project(isoDeliverables,term);grid.records=projected;grid.total=projected.length;grid.buffered=projected.length;
     if(status)status.textContent=grid.records.length+" résultats ISO sur "+isoDeliverables.length+" références en cache · w2grid virtualisée · ISO Open Data (ODC-By 1.0)";
   } else {
     refreshSidebar();
     grid.columns=[
       {field:'designation',text:tr('colRef'),size:'150px',sortable:true},
       {field:'name',text:tr('colTitle'),size:'45%',sortable:true},
       {field:'edition',text:tr('colEdition'),size:'90px',sortable:true},
       {field:'verification',text:tr('colProvenance'),size:'160px',sortable:true}
     ];
     const found=referenceRows(term);
     grid.records=found.map((r,i)=>({recid:r.standardId||String(i+1),standardId:str(r.standardId),designation:str(r.designation),name:str(r.name),edition:str(r.editionDesignation),verification:str(r.verification)}));
     if(status)status.textContent=`${found.length} référence(s) locales — synchronisation ISO Open Data à venir`;
   }
   if(status&&localSyncMessage)status.textContent+=' · '+localSyncMessage;
   selected=null;
   grid.refresh();updateModeButtons();
   const importBtn=mount?.querySelector('[data-iso-import]');if(importBtn){importBtn.disabled=mode==='references';importBtn.title=mode==='committees'?'Importer iso_technical_committees (JSONLines)':mode==='ics'||mode==='iso-list'?'Importer iso_deliverables_metadata (JSONLines)':'Sélectionner une vue ISO pour importer';}
 }
 async function syncLocalIso(force=false){
   if(localSyncBusy)return;
   const iso=root.__radarIsoOpenData;if(!iso)return;
   localSyncBusy=true;localSyncMessage='Recherche des fichiers ISO locaux…';refresh();
   try{
     const res=await fetch('./iso-open-data-cache/manifest.json',{cache:'no-store'});
     if(!res.ok)throw new Error('Fichiers ISO non téléchargés sur le serveur local (lancer tools/sync-iso-open-data.mjs)');
     const manifest=await res.json();
     if(manifest.schemaVersion!==1||!Array.isArray(manifest.datasets))throw new Error('Manifeste ISO non reconnu');
     let count=0;
     for(const type of ['committees','deliverables']){
       const entry=manifest.datasets.find(x=>x.type===type);
       if(!entry||entry.file!==type+'.jsonl'||!/^[a-f0-9]{64}$/.test(entry.sha256))throw new Error('Entrée manifeste ISO invalide : '+type);
       const marker='iso-local:s14d:'+entry.sha256;
       const installed=(await iso.syncInfo()).find(x=>x.type===type);
       if(!force&&installed?.filename===marker)continue;
       localSyncMessage='Chargement '+(type==='committees'?'des comités':'des normes')+' dans IndexedDB…';refresh();
       const data=await fetch('./iso-open-data-cache/'+entry.file,{cache:'no-store'});
       if(!data.ok)throw new Error('Fichier local '+entry.file+' indisponible (HTTP '+data.status+')');
       const blob=await data.blob();
       if(Number(entry.bytes)&&blob.size!==entry.bytes)throw new Error('Taille incohérente : '+entry.file);
       Object.defineProperty(blob,'name',{value:marker});
       const result=await iso.importJsonLines(type,blob,n=>{localSyncMessage=type+' : '+n+' lignes importées';});
       count+=result.count;
     }
     await loadIsoCache();
     localSyncMessage='Catalogue local synchronisé · '+isoCommittees.length+' comités · '+isoDeliverables.length+' normes';
   }catch(e){localSyncMessage='Synchronisation : '+String(e.message||e);}
   finally{localSyncBusy=false;refresh();}
 }
 function loadIcs(){
   if(loading||icsRows!==null)return;
   if(typeof root.Papa?.parse!=='function'){icsError='parseur CSV absent';refresh();return;}
   loading=true;icsError=null;refresh();
   root.Papa.parse(ICS_URL,{download:true,header:true,skipEmptyLines:true,
     complete(result){loading=false;if(result.errors?.length&&!(result.data||[]).length){icsError=result.errors[0].message;icsRows=null;}else{icsRows=result.data||[];icsError=null;}refresh();},
     error(err){loading=false;icsError=String(err?.message||err);refresh();}
   });
 }
 function initialize(node,getGraph){
   registerI18n();
   graphProvider=typeof getGraph==='function'?getGraph:null;
   if(!node||!root.document)return false;
   mount=node;mount.replaceChildren();const d=root.document;
   const box=d.createElement('div');box.style.cssText='height:100%;display:flex;flex-direction:column;min-height:0;font:13px Arial,sans-serif';
   const bar=d.createElement('div');bar.style.cssText='display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:6px;border-bottom:1px solid #ddd';
   function modeButton(id,label){const btn=d.createElement('button');btn.type='button';btn.textContent=label;btn.dataset.isoTranslation=({ics:'modeIcs',committees:'modeCommittees','iso-list':'modeIsoList',references:'modeReferences'})[id];btn.dataset.catalogMode=id;btn.addEventListener('click',()=>{mode=id;search.value='';refresh();if(mode==='ics')loadIcs();});bar.appendChild(btn);}
   modeButton('ics',tr('modeIcs'));modeButton('committees',tr('modeCommittees'));modeButton('iso-list',tr('modeIsoList'));modeButton('references',tr('modeReferences'));
   search=d.createElement('input');search.type='search';search.placeholder='Code ou libellé ICS…';search.setAttribute('aria-label',tr('searchAccessible'));search.style.cssText='flex:1;min-width:180px;padding:5px';bar.appendChild(search);
   const reload=d.createElement('button');reload.type='button';reload.textContent=tr('refresh');reload.dataset.isoTranslation='refresh';bar.appendChild(reload);
   const syncButton=d.createElement('button');syncButton.type='button';syncButton.textContent=tr('sync');syncButton.dataset.isoTranslation='sync';syncButton.title='Charger les fichiers ISO téléchargés localement dans IndexedDB';syncButton.addEventListener('click',()=>syncLocalIso());bar.appendChild(syncButton);
   const add=d.createElement('button');add.type='button';add.textContent=tr('add');add.dataset.isoTranslation='add';bar.appendChild(add);
   // The selected tab determines the ISO dataset; no redundant oversized select.
   const importButton=d.createElement('button');importButton.type='button';importButton.textContent=tr('import');importButton.dataset.isoTranslation='import';importButton.dataset.isoImport='true';
   importButton.title='Importer les normes ISO dans « ICS et normes » ou les comités dans « Comités TC / SC »';
   importButton.style.cssText='flex:0 0 auto;height:29px;padding:2px 8px;white-space:nowrap';
   bar.appendChild(importButton);
   const file=d.createElement('input');file.type='file';file.accept='.jsonl,.ndjson,application/x-ndjson,application/jsonl';
   file.setAttribute('aria-label','Choisir un fichier ISO Open Data JSONLines');file.style.display='none';
   bar.appendChild(file);
   let pendingDataset=null;
   importButton.addEventListener('click',()=>{
     if(mode==='references')return;
     pendingDataset=mode==='committees'?'committees':'deliverables';
     file.click();
   });
   file.addEventListener('change',async()=>{
     const chosen=file.files?.[0];if(!chosen)return;
     const iso=root.__radarIsoOpenData;if(!iso){status.textContent='Module ISO absent';pendingDataset=null;return;}
     const dataset=pendingDataset;if(!dataset){file.value='';return;}
     const answer=root.confirm?.('Remplacer le cache local du jeu '+(dataset==='committees'?'comités ISO':'normes ISO')+' par le contenu de '+chosen.name+' ?');
     if(answer===false){file.value='';pendingDataset=null;return;}
     try{file.disabled=true;status.textContent='Import JSONL en cours…';
       const result=await iso.importJsonLines(dataset,chosen,n=>{status.textContent=n+' enregistrements ISO importés…';});
       await loadIsoCache();status.textContent=result.count+' enregistrements importés dans IndexedDB';
     }catch(e){status.textContent='Import ISO échoué : '+e.message;}
     finally{file.disabled=false;file.value='';pendingDataset=null;}
   });
   const target=d.createElement('div');target.id='standard-references-grid';target.style.cssText='flex:1;min-height:100px';
   status=d.createElement('div');status.style.cssText='padding:3px 7px;color:#555';status.setAttribute('role','status');
   box.append(bar,target,status);mount.appendChild(box);
   if(typeof root.w2grid!=='function'){status.textContent='w2ui grid indisponible';return false;}
   grid=new root.w2grid({name:'standardReferencesGrid',recordHeight:28,show:{toolbar:false,footer:true,expandColumn:false},multiSelect:false,records:[],columns:[],onClick(event){selected=event.recid||event.detail?.recid||null;
     if(selected?.startsWith('iso-more:')&&getTreeIndex().loadMore(selected)){
       // Defer rebuilding the tree until w2ui finishes dispatching the click.
       Promise.resolve().then(()=>refresh());
     }
   }});
   if(typeof root.w2layout==='function'&&typeof root.w2sidebar==='function'){
     try{root.w2ui?.isoCatalogBrowserLayout?.destroy?.();}catch(_){}
     isoLayout=new root.w2layout({name:'isoCatalogBrowserLayout',panels:[
       {type:'left',size:280,minSize:190,resizable:true,hidden:false},
       {type:'main'}
     ]});
     isoLayout.render(target);isoLayout.html('main',grid);
     // S14-L3-R1: w2sidebar can re-render a node before its click event.
     // Capture pointerdown first; keep click for keyboard activation.
     function openEye(event){
       const eye=event.target?.closest?.('[data-iso-nav-eye]');
       if(!eye||!target.contains(eye))return;
       if(event.type==='click'&&event.detail!==0)return; // pointer handled above
       event.preventDefault();event.stopPropagation();event.stopImmediatePropagation?.();
       const encoded=eye.getAttribute('data-iso-nav-eye');
       if(!encoded)return;
       const id=decodeURIComponent(encoded);const split=id.indexOf(':');
       if(split<1)return;
       // Open outside the sidebar's own event-dispatch cycle.
       Promise.resolve().then(()=>showGroupDetails(id.slice(0,split),id.slice(split+1)));
     }
     root.document.addEventListener('pointerdown',openEye,true);
     root.document.addEventListener('click',openEye,true);
   }else grid.render(target);
   target.addEventListener('click',e=>{const btn=e.target?.closest?.('[data-iso-detail]');if(!btn)return;
     const id=btn.getAttribute('data-iso-detail');const record={kind:'standard',isoId:id};showDetail(record);
   });
   let isoSearchDebounce=null;search.addEventListener('input',()=>{if(isoSearchDebounce)clearTimeout(isoSearchDebounce);if(mode!=='iso-list'){isoSearchDebounce=setTimeout(()=>{isoSearchDebounce=null;refresh();},180);return;}isoSearchDebounce=setTimeout(()=>{isoSearchDebounce=null;refresh();},180);});reload.addEventListener('click',()=>{if(mode==='ics'){icsRows=null;loadIcs();}loadIsoCache();});
   add.addEventListener('click',()=>{
     if(mode!=='references'){status.textContent='Les normes ISO en cache sont consultables ; leur rapprochement au registre et leur création de blips seront traités dans le prochain lot. Pour ajouter un blip, utiliser « Références locales ». ';return;}
     if(!selected){status.textContent='Sélectionner une référence.';return;}
     const group=root.__radarRevisionSession?.status?.().activeGroup;
     const revision=root.__radarCatalogAdapter?.getRevision?.(group);
     if(!revision||revision.status!=='draft'){status.textContent='Sélectionner une révision draft pour ajouter un blip.';return;}
     try{root.__radarCatalogCreateForm.open(graphProvider?.(),'existing',selected);}
     catch(e){status.textContent=e.message;}
   });
   bindLocale();updateStaticLabels();refresh();loadIcs();loadIsoCache().then(()=>syncLocalIso());return true;
 }
 function open(){if(!mount)initialize(root.document?.getElementById('standard-references-panel'));const layout=root.w2ui?.mainLayout;if(layout?.show)layout.show('bottom');if(layout?.sizeTo)layout.sizeTo('bottom',240);refresh();search?.focus();}
 root.__radarStandardsPanel=Object.freeze({initialize,refresh,open,icsTree,enrichedIcsTree});
})(window);
