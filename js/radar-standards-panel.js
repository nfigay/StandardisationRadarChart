/* S13-R12 — One lower W2UI grid, two catalog views: existing ICS.csv tree and local references.
 * No new persistence store. No claim that the legacy RSS placeholder loads standards.
 */
(function(root){
 'use strict';
 const ICS_URL='https://nfigay.github.io/StandardisationRadarChart/ICS.csv';
 let mount=null,grid=null,search=null,status=null,selected=null,graphProvider=null;
 let isoLayout=null,isoSidebar=null,sidebarSelection={ics:null,committees:null},sidebarMode=null,sidebarSources=null,sidebarLanguage=null;
/* S14-N WINDOWED ISO VIEW */
 let windowHistory=[null],windowPosition=0,windowToken=0,windowSearch='',windowNext=null,windowMode='';
 let windowedActive=false,windowedRelease=null,groupIndexBuild=null;
 let previousWindowButton=null,nextWindowButton=null,firstWindowButton=null,windowSizeSelect=null,windowIndicator=null,sortSelect=null,icsFacet=null,committeeFacet=null;
 const WINDOW_SIZES=[100,250,500];let windowSize=100,windowSortField='reference',windowSortDirection='asc',autoLoading=false,windowBasePosition=0;
 let advancedExpression=null,advancedRevision=0,advancedButton=null,advancedDialog=null;
 let mode='ics',icsRows=null,icsError=null,loading=false,isoDeliverables=[],isoCommittees=[],isoSync=[],isoLoading=false,localSyncBusy=false,localSyncMessage='',rssRows=[],rssMessage='',changeRows=[],changeMessage='',changeRelease='';
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
 const isoStrings={fr:{"filterIcs":"Filtre ICS","filterCommittee":"Filtre TC/SC","sortLabel":"Trier par","sortReferenceAsc":"Référence A → Z","sortReferenceDesc":"Référence Z → A","sortTitleAsc":"Titre A → Z","sortTitleDesc":"Titre Z → A","sortEnglishAsc":"Titre anglais A → Z","sortEnglishDesc":"Titre anglais Z → A","sortStageAsc":"Stade A → Z","sortStageDesc":"Stade Z → A","windowAuto":"défilement automatique","windowScopeAll":"Toutes les normes","windowScopeDescendants":"sous-groupes inclus","windowNumber":"Fenêtre {{number}}","windowLoading":"chargement…","windowEmpty":"aucune norme","windowRange":"normes {{from}}–{{to}}","windowMore":"suite disponible","windowEnd":"fin des résultats","windowCatalogueTotal":"{{total}} normes au catalogue","modeChanges":"Évolutions ISO","changesLoad":"Charger les évolutions","changesSearch":"Référence, champ, changement…","changesFrom":"Depuis","changesTo":"Vers","changesKind":"Évolution","changesFields":"Champs modifiés","changesMissing":"Absente du nouveau jeu (retrait non confirmé)","changesAdded":"Nouvelle dans le jeu","changesChanged":"Métadonnées modifiées","changesEmpty":"Aucun journal publié. Comparer deux releases ISO pour produire des évolutions.","distributedSync":"Synchroniser le catalogue distribué","distributedPrompt":"Adresse du service de catalogues (URL)","distributedError":"Synchronisation du catalogue échouée","detail":"Détails","showStandards":"Afficher les normes","detailColumn":"Fiche","close":"Fermer","formTitle":"Fiche ISO","formTab":"Fiche de la norme","rawTab":"Métadonnées originales","reference":"Référence","titleFr":"Titre français","titleEn":"Titre anglais","otherLanguages":"Autres titres","scopeFr":"Description française","scopeEn":"Description anglaise","otherScopes":"Autres descriptions","ics":"Codes ICS","committee":"Comité TC / SC","stage":"Stade ISO","edition":"Édition","publicationDate":"Date de publication","deliverableType":"Type de livrable","supplementType":"Type de supplément","languages":"Langues","pages":"Pages","replaces":"Remplace","replacedBy":"Remplacée par","sourceData":"Toutes les métadonnées ISO","grpIdentification":"Identification","grpTitles":"Titres","grpDescriptions":"Descriptions / périmètre","grpClassification":"Classification et organisation","grpLifecycle":"Cycle de vie","grpRelations":"Relations entre éditions","grpRaw":"Champs bruts (consultation)","colIcs":"Code ICS","colLabel":"Libellé","colEnglishLabel":"Libellé anglais","colTC":"TC / SC","colTCRef":"TC / SC / Référence","colDescription":"Description","colRef":"Référence","colTitle":"Titre","colEnglishTitle":"Titre anglais","colStage":"Stade","colEdition":"Édition","colProvenance":"Provenance","modeIcs":"ICS et normes","modeCommittees":"Comités TC / SC","modeIsoList":"Normes ISO","modeReferences":"Références locales","refresh":"Actualiser","sync":"Charger catalogue ISO","add":"Ajouter au radar","import":"Importer JSONL","searchIcs":"ICS, titre, description, référence…","searchCommittees":"TC/SC, titre, description, norme…","searchIso":"Norme ISO, texte anglais, ICS, comité, stade…","searchLocal":"Numéro, titre, édition…","searchAccessible":"Rechercher dans le catalogue sélectionné","missingReference":"Identifiant ISO {{id}} — référence absente du cache","noCategory":"Sans catégorie ICS connue dans le catalogue","readOnlyUnavailable":"Le formulaire w2ui (w2form) est indisponible.","modeRss":"Actualités RSS","rssSync":"Actualiser RSS local","rssFeed":"Flux","rssDate":"Date","rssOpen":"Consulter","rssEmpty":"Aucun RSS en cache. Ajouter des flux avec tools/sync-iso-rss.mjs et exécuter la synchronisation.","rssSearch":"RSS, actualités, références…"},en:{"filterIcs":"ICS filter","filterCommittee":"TC/SC filter","sortLabel":"Sort by","sortReferenceAsc":"Reference A → Z","sortReferenceDesc":"Reference Z → A","sortTitleAsc":"Title A → Z","sortTitleDesc":"Title Z → A","sortEnglishAsc":"English title A → Z","sortEnglishDesc":"English title Z → A","sortStageAsc":"Stage A → Z","sortStageDesc":"Stage Z → A","windowAuto":"automatic scrolling","windowScopeAll":"All standards","windowScopeDescendants":"including subgroups","windowNumber":"Window {{number}}","windowLoading":"loading…","windowEmpty":"no standards","windowRange":"standards {{from}}–{{to}}","windowMore":"more available","windowEnd":"end of results","windowCatalogueTotal":"{{total}} standards in catalogue","modeChanges":"ISO changes","changesLoad":"Load changes","changesSearch":"Reference, field, change…","changesFrom":"From","changesTo":"To","changesKind":"Change","changesFields":"Changed fields","changesMissing":"Missing from new snapshot (withdrawal unconfirmed)","changesAdded":"New in snapshot","changesChanged":"Metadata changed","changesEmpty":"No published journal. Compare two ISO releases to generate changes.","distributedSync":"Sync distributed catalogue","distributedPrompt":"Catalogue service URL","distributedError":"Catalogue sync failed","detail":"Details","showStandards":"Show standards","detailColumn":"Details","close":"Close","formTitle":"ISO record","formTab":"Standard details","rawTab":"Original metadata","reference":"Reference","titleFr":"French title","titleEn":"English title","otherLanguages":"Other titles","scopeFr":"French description","scopeEn":"English description","otherScopes":"Other descriptions","ics":"ICS codes","committee":"Responsible TC / SC","stage":"ISO stage","edition":"Edition","publicationDate":"Publication date","deliverableType":"Deliverable type","supplementType":"Supplement type","languages":"Languages","pages":"Pages","replaces":"Replaces","replacedBy":"Replaced by","sourceData":"All ISO source metadata","grpIdentification":"Identification","grpTitles":"Titles","grpDescriptions":"Descriptions / scope","grpClassification":"Classification and organization","grpLifecycle":"Lifecycle","grpRelations":"Relationships between editions","grpRaw":"Raw source fields (read-only)","colIcs":"ICS code","colLabel":"Label","colEnglishLabel":"English label","colTC":"TC / SC","colTCRef":"TC / SC / Reference","colDescription":"Description","colRef":"Reference","colTitle":"Title","colEnglishTitle":"English title","colStage":"Stage","colEdition":"Edition","colProvenance":"Provenance","modeIcs":"ICS and standards","modeCommittees":"Technical committees TC / SC","modeIsoList":"ISO standards","modeReferences":"Local references","refresh":"Refresh","sync":"Load ISO catalogue","add":"Add to radar","import":"Import JSONL","searchIcs":"ICS, title, description, reference…","searchCommittees":"TC/SC, title, description, standard…","searchIso":"ISO standard, English text, ICS, committee, stage…","searchLocal":"Number, title, edition…","searchAccessible":"Search the selected catalogue","missingReference":"ISO identifier {{id}} — reference missing from cache","noCategory":"No known ICS category in catalogue","readOnlyUnavailable":"The w2ui form (w2form) is unavailable.","modeRss":"RSS updates","rssSync":"Refresh local RSS","rssFeed":"Feed","rssDate":"Date","rssOpen":"Open","rssEmpty":"No RSS cached. Add feeds using tools/sync-iso-rss.mjs and synchronize.","rssSearch":"RSS, news, references…"}};
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
 let treeSearchState=null,treeSearchRequest=null,treeSearchToken=0,sidebarSearchSignature=null;
 const treeFilterModuleUrl=new URL('radar-iso-tree-filter.js',root.document?.currentScript?.src||root.location?.href).href;
 let treeFilterLoading=null;
 function loadTreeFilter(){
   if(root.__radarIsoTreeFilter?.collect&&root.__radarIsoTreeFilter?.prune)return Promise.resolve(root.__radarIsoTreeFilter);
   if(treeFilterLoading)return treeFilterLoading;
   // S14-X-R1: the panel is a classic script, so do not use dynamic import here.
   // Vite can prepend ESM imports when transforming a nonliteral import() specifier.
   treeFilterLoading=new Promise((resolve,reject)=>{
     const document=root.document;
     if(!document?.createElement){reject(Error('S14-X-R1: document unavailable'));return;}
     const script=document.createElement('script');
     script.src=treeFilterModuleUrl;script.async=true;
     script.onload=()=>{
       if(root.__radarIsoTreeFilter?.collect&&root.__radarIsoTreeFilter?.prune)resolve(root.__radarIsoTreeFilter);
       else reject(Error('S14-X-R1: tree filter API not registered'));
     };
     script.onerror=()=>reject(Error('S14-X-R1: unable to load tree filter script'));
     (document.head||document.body||document.documentElement).appendChild(script);
   }).catch(error=>{treeFilterLoading=null;throw error;});
   return treeFilterLoading;
 }
 const advancedModuleUrl=new URL('radar-iso-advanced-query.js',root.document?.currentScript?.src||root.location?.href).href;
 let advancedModuleLoading=null;
 function loadAdvanced(){
   if(root.__radarIsoAdvancedQuery?.validate)return Promise.resolve(root.__radarIsoAdvancedQuery);
   if(advancedModuleLoading)return advancedModuleLoading;
   advancedModuleLoading=new Promise((resolve,reject)=>{
     const script=root.document.createElement('script');script.src=advancedModuleUrl;script.async=true;
     script.onload=()=>root.__radarIsoAdvancedQuery?.validate?resolve(root.__radarIsoAdvancedQuery):reject(Error('Module de recherche avancée indisponible'));
     script.onerror=()=>reject(Error('Impossible de charger la recherche avancée'));
     (root.document.head||root.document.body).appendChild(script);
   }).catch(error=>{advancedModuleLoading=null;throw error;});
   return advancedModuleLoading;
 }
 function advancedCurrent(){return advancedExpression;}
 function notifyAdvancedChange(){
   advancedRevision++;treeSearchToken++;treeSearchRequest=null;treeSearchState=null;sidebarSearchSignature=null;
   if(advancedButton){advancedButton.style.fontWeight=advancedExpression?'bold':'normal';advancedButton.setAttribute('aria-pressed',String(Boolean(advancedExpression)));}
   if(mode==='ics'||mode==='committees'||mode==='iso-list')refresh();
 }
 function openAdvancedDialog(){
   void loadAdvanced().then(engine=>{
     if(advancedDialog?.isConnected){advancedDialog.showModal();return;}
     const doc=root.document,dialog=doc.createElement('dialog');advancedDialog=dialog;
     dialog.setAttribute('aria-label','Recherche avancée ISO');
     dialog.style.cssText='width:min(850px,95vw);max-height:85vh;overflow:auto;border:1px solid #bbb;border-radius:8px;padding:18px;box-shadow:0 12px 50px #0004;background:white;color:#222;z-index:99999';
     const heading=doc.createElement('h2');heading.textContent='Recherche avancée ISO';heading.style.margin='0 0 12px';dialog.appendChild(heading);
     const help=doc.createElement('p');help.textContent='Regroupez les critères avec ET / OU ; NON inverse un groupe. La recherche simple, la sélection ICS/TC-SC et le tri restent actifs.';dialog.appendChild(help);
     const defaultTree={id:1,operator:'AND',negated:false,children:[
       {id:2,field:'title',comparison:'contains',value:'risque'},
       {id:3,operator:'OR',negated:false,children:[{id:4,field:'ics',comparison:'prefix',value:'03'},{id:5,field:'committee',comparison:'equals',value:'ISO/TC 262'}]},
       {id:6,operator:'AND',negated:true,children:[{id:7,field:'stage',comparison:'equals',value:'9093'}]}
     ]};
     let draft=JSON.parse(JSON.stringify(advancedExpression||defaultTree));
     let nextId=Math.max(0,...(function ids(node){return [Number(node.id)||0,...(node.children||[]).flatMap(ids)];})(draft))+1;
     const history=[];
     const editor=doc.createElement('div');dialog.appendChild(editor);
     const fields=[['all','Tous les champs'],['reference','Référence'],['title','Titre français'],['titleEn','Titre anglais'],['description','Description'],['ics','ICS'],['committee','TC/SC'],['stage','Stade']];
     function button(text,onClick){const el=doc.createElement('button');el.type='button';el.textContent=text;el.style.cssText='margin:3px;padding:5px 8px;cursor:pointer';el.addEventListener('click',onClick);return el;}
     function select(entries,value,onChange){const el=doc.createElement('select');el.style.cssText='max-width:100%;height:30px;margin:3px';for(const [id,label] of entries){const option=doc.createElement('option');option.value=id;option.textContent=label;el.appendChild(option);}el.value=value;el.addEventListener('change',()=>onChange(el.value));return el;}
     function structural(type,node,idsUsed=0){
       history.push(JSON.parse(JSON.stringify(draft)));
       try{draft=engine.edit(draft,{type,id:node.id,nextId});nextId+=idsUsed;render();}
       catch(e){history.pop();throw e;}
     }
     const controls=doc.createElement('div');controls.style.cssText='display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:8px 0';
     const undoButton=button('↶ Annuler la dernière modification',()=>{if(!history.length)return;draft=history.pop();render();});
     controls.appendChild(undoButton);
     controls.appendChild(button('Repartir de l’exemple',()=>{history.push(JSON.parse(JSON.stringify(draft)));draft=JSON.parse(JSON.stringify(defaultTree));nextId=Math.max(nextId,8);render();}));
     dialog.appendChild(controls);
     function render(){
       undoButton.disabled=!history.length;
       editor.replaceChildren();
       function draw(node,parent,depth,host){
         const isGroup=Array.isArray(node.children);
         const box=doc.createElement('fieldset');box.style.cssText='display:block;min-width:0;margin:8px 0 8px '+Math.min(depth*16,96)+'px;padding:9px;border:1px solid '+(isGroup?'#8b9ab1':'#ddd')+';border-left:'+ (isGroup?'4px solid #547aa5':'2px solid #ccc')+';border-radius:5px';
         const legend=doc.createElement('legend');legend.textContent=isGroup?(parent?'Sous-groupe (parenthèses)':'Expression principale'):'Condition';legend.style.cssText='font-size:12px;font-weight:600;padding:0 5px';box.appendChild(legend);
         if(isGroup){
           const top=doc.createElement('div');top.append('Combiner avec ',select([['AND','ET'],['OR','OU']],node.operator,v=>{node.operator=v;}));
           const neg=doc.createElement('label'),check=doc.createElement('input');check.type='checkbox';check.checked=node.negated;check.addEventListener('change',()=>{node.negated=check.checked;});neg.append(check,' NON (inverser le groupe)');top.appendChild(neg);box.appendChild(top);
           const bar=doc.createElement('div');bar.style.cssText='display:flex;flex-wrap:wrap;gap:3px';
           bar.append(button('+ Ajouter un critère ici',()=>structural('addCondition',node,1)),button('+ Ajouter un sous-groupe ici',()=>structural('addGroup',node,2)));
           if(parent){
             bar.append(button('+ Groupe au même niveau',()=>structural('addSiblingGroup',node,2)));
             bar.append(button('Dissoudre ce groupe (garder les critères)',()=>structural('unwrap',node)));
             bar.append(button('Supprimer ce groupe et ses critères',()=>structural('remove',node)));
           }
           box.appendChild(bar);
           for(const child of node.children)draw(child,node,depth+1,box);
         }else{
           box.append(select(fields,node.field,v=>{node.field=v;}),select([['contains','Contient'],['equals','Est égal à'],['prefix','Commence par']],node.comparison,v=>{node.comparison=v;}));
           const input=doc.createElement('input');input.type='text';input.value=node.value;input.placeholder='Terme';input.style.cssText='height:30px;min-width:120px;max-width:45%;box-sizing:border-box';input.addEventListener('input',()=>{node.value=input.value;});box.appendChild(input);
           const actions=doc.createElement('div');actions.style.cssText='display:flex;flex-wrap:wrap;gap:3px';
           actions.append(button('Regrouper cette condition (…)',()=>structural('wrap',node,1)),button('+ Groupe au même niveau',()=>structural('addSiblingGroup',node,2)),button('Supprimer cette condition',()=>structural('remove',node)));box.appendChild(actions);
         }
         host.appendChild(box);
       }
       draw(draft,null,0,editor);
     }
     render();
     const error=doc.createElement('div');error.setAttribute('role','alert');error.style.cssText='color:#b42318;min-height:22px';dialog.appendChild(error);
     const footer=doc.createElement('div');footer.style.cssText='display:flex;gap:6px;justify-content:flex-end;flex-wrap:wrap';
     footer.append(button('Annuler',()=>dialog.close()),button('Effacer la recherche avancée',()=>{advancedExpression=null;dialog.close();notifyAdvancedChange();}),button('Appliquer',()=>{
       try{engine.validate(draft);advancedExpression=JSON.parse(JSON.stringify(draft));dialog.close();notifyAdvancedChange();}
       catch(e){error.textContent=e.message;}
     }));dialog.appendChild(footer);
     dialog.addEventListener('close',()=>{dialog.remove();if(advancedDialog===dialog)advancedDialog=null;},{once:true});
     doc.body.appendChild(dialog);dialog.showModal();
   }).catch(error=>{if(status)status.textContent='Recherche avancée : '+error.message;});
 }
 function getSidebarIndex(){
   if(!root.__radarIsoSidebarIndex?.create)throw Error('S14-L3 : index sidebar manquant');
   if(!sidebarIndex||sidebarInputs?.[0]!==icsRows||sidebarInputs?.[1]!==isoCommittees||sidebarInputs?.[2]!==isoDeliverables){
     sidebarIndex=root.__radarIsoSidebarIndex.create(icsRows||[],isoCommittees,isoDeliverables);
     treeSearchToken++;treeSearchRequest=null;treeSearchState=null;sidebarSearchSignature=null;
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
   const term=String(search?.value||'').trim();
   const signature=navMode+'|'+term+'|advanced:'+advancedRevision+'|'+(icsFacet?.value||'')+'|'+(committeeFacet?.value||'')+'|'+(windowedRelease||'');
   if((!term&&!advancedExpression)||!windowedActive){
     if(treeSearchRequest||treeSearchState){treeSearchToken++;treeSearchRequest=null;treeSearchState=null;}
   }else if(treeSearchState?.key!==signature&&treeSearchRequest!==signature){
     const token=++treeSearchToken;treeSearchRequest=signature;
     void loadTreeFilter().then(treeFilter=>treeFilter.collect({
       page:options=>root.__radarIsoWindowed.page(options),model,mode:navMode,query:term,advancedQuery:advancedCurrent(),
       icsFilter:icsFacet?.value?.trim()||null,committeeFilter:committeeFacet?.value?.trim()||null,
       committees:isoCommittees,cancelled:()=>token!==treeSearchToken
     })).then(result=>{
       if(token!==treeSearchToken||result.cancelled)return;
       treeSearchState={key:signature,matched:result.matched,scanned:result.scanned};
       treeSearchRequest=null;sidebarSearchSignature=null;
       const selectedGroup=sidebarSelection[navMode];
       if(selectedGroup&&!result.matched.has(navMode+':'+selectedGroup)){
         sidebarSelection[navMode]=null;
         Promise.resolve().then(()=>windowPage('reset'));
       }
       refreshSidebar();
     }).catch(error=>{
       if(token!==treeSearchToken)return;
       treeSearchRequest=null;treeSearchState={key:signature,error:String(error?.message||error)};
       if(status)status.textContent='Filtrage de l’arborescence indisponible : '+treeSearchState.error;
     });
   }else if(treeSearchRequest!==signature&&treeSearchState?.key!==signature){
     treeSearchToken++;treeSearchRequest=null;treeSearchState=null;
   }
   if(isoSidebar&&sidebarMode===navMode&&sidebarSources===model&&sidebarLanguage===language&&sidebarSearchSignature===signature)return;
   try{isoSidebar?.destroy?.();}catch(_){}
   let nodes=navMode==='ics'&&(!Array.isArray(icsRows)||!icsRows.length)?[]:model.sidebar(navMode,language);
   if((term||advancedExpression)&&windowedActive&&treeSearchState?.key===signature&&treeSearchState.matched){
     nodes=root.__radarIsoTreeFilter.prune(nodes,treeSearchState.matched);
   }
   if(windowedActive){const scrub=items=>{for(const item of items){delete item.count;if(item.nodes)scrub(item.nodes);}};scrub(nodes);}
   // S14-L3-R2: native w2sidebar events; no injected eye icons or DOM handlers.
   const nodeId=event=>String(event?.target||event?.detail?.target||'');
   function resolveNode(event){
     const id=nodeId(event);
     return id.startsWith(navMode+':')?id.slice(navMode.length+1):null;
   }
   function openNodeDetails(event){
     const id=resolveNode(event);if(id===null)return;
     Promise.resolve().then(()=>showGroupDetails(navMode,id));
   }
   function selectNode(event){
     const id=resolveNode(event);if(id===null)return;
     sidebarSelection[navMode]=id;
     Promise.resolve().then(()=>refresh());
   }
   isoSidebar=new root.w2sidebar({
     name:'isoCatalogSidebar',icon:{text:'',style:''},nodes,
     menu:[{id:'details',text:tr('detail')},{id:'show-standards',text:tr('showStandards')}],
     onClick:selectNode,
     onDblClick:openNodeDetails,
     onMenuClick(event){
       const action=String(event?.detail?.item?.id||event?.detail?.subItem?.id||event?.item?.id||'');
       if(action==='details')openNodeDetails(event);
       else if(action==='show-standards')selectNode(event);
     },
     onKeydown(event){
       const key=event?.originalEvent?.key||event?.detail?.originalEvent?.key;
       if(key==='Enter')openNodeDetails({target:isoSidebar?.selected});
     }
   });
   sidebarMode=navMode;sidebarSources=model;sidebarLanguage=language;sidebarSearchSignature=signature;
   isoLayout.html('left',isoSidebar);
 }

 function showDetail(record){
   const d=root.document;
   const item=record.kind==='standard'?(record.isoItem||findDeliverable(record.isoId)):record.kind==='committee'?findCommittee(record.committeeId):null;
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
   if(isoLoading)return;
   isoLoading=true;
   try{
     const windowed=root.__radarIsoWindowed;
     const active=await windowed?.current?.();
     windowedActive=Boolean(active?.generation);windowedRelease=active?.summary?.release||null;root.__radarIsoWindowedCount=Number(active?.summary?.datasets?.deliverables?.count||0);
     if(windowedActive){
       // Committee metadata is small (< 1,000 today). Never materialize deliverables.
       const committees=[];let after=null;
       do{
         const window=await windowed.page({type:'committees',limit:500,after});
         committees.push(...window.records);after=window.next;
         if(committees.length>10000)throw Error('Too many committee metadata rows');
       }while(after);
       isoDeliverables=[];isoCommittees=committees;isoSync=[];
       // S14-P: derived index is built in short IndexedDB transactions, without fetching ISO.
       // UI remains usable through the S14-O cursor fallback during the migration.
       if(!groupIndexBuild&&typeof windowed.ensureGroupIndex==='function'){
         groupIndexBuild=windowed.ensureGroupIndex({batchSize:300,onProgress:p=>{
           if(status&&p.processed%3000===0)status.textContent='Indexation ICS/TC-SC : '+p.processed+' notices';
         }}).then(result=>{
           if(result.ready&&(mode==='ics'||mode==='committees'))windowPage('reset');
           return result;
         }).catch(e=>{if(status)status.textContent='Index ICS/TC-SC indisponible : '+e.message;})
           .finally(()=>{groupIndexBuild=null;});
       }
     }else{
       const provider=root.__radarIsoOpenData;
       if(provider)[isoDeliverables,isoCommittees,isoSync]=await Promise.all([
         provider.readAll('deliverables'),provider.readAll('committees'),provider.syncInfo()]);
     }
     sidebarIndex=null;sidebarInputs=null;
   }catch(e){if(status)status.textContent='Cache ISO indisponible : '+e.message;}
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

 async function windowPage(direction='reset'){
   if(!grid||!['ics','committees','iso-list'].includes(mode))return;
   const view=mode,token=++windowToken,provider=root.__radarIsoWindowed;
   const query=search?.value||'';
   const group=sidebarSelection[view];
   const key=view+'|'+(group||'')+'|'+query+'|advanced:'+advancedRevision+'|'+windowSortField+'|'+windowSortDirection+'|'+windowSize+'|'+(icsFacet?.value||'')+'|'+(committeeFacet?.value||'');
   if(direction==='reset'||direction==='first'||windowMode!==key){
     windowHistory=[null];windowPosition=0;windowBasePosition=0;windowSearch=query;windowNext=null;windowMode=key;
   }else if(direction==='next'&&windowNext){
     windowHistory=windowHistory.slice(0,windowPosition+1);windowHistory.push(windowNext);windowPosition++;
   }else if(direction==='previous'&&windowPosition>0){windowPosition--;}
   // S14-U: the sidebar is a *filter*, not a page. Pagination belongs to the
   // list of standards matching the selected ICS / TC-SC node, descendants included.
   const scopeLabel=()=>{
     if(view==='iso-list')return tr('windowScopeAll');
     const family=view==='ics'?'ICS':'TC/SC';
     if(!group)return family+' · '+tr('windowScopeAll');
     const node=getSidebarIndex().get(view,group);
     const reference=String(node?.reference||node?.id||group);
     const name=String(node?.title||'');
     return family+' '+reference+(name?' — '+name:'')+' · '+tr('windowScopeDescendants');
   };
   const selectedFacets=()=>[icsFacet?.value?.trim()?'ICS '+icsFacet.value.trim():'',committeeFacet?.value?.trim()?'TC/SC '+committeeFacet.value.trim():'',query?'«'+query+'»':'',advancedExpression?'recherche avancée':''].filter(Boolean).join(' · ');
   const updateButtons=(loaded=null)=>{
     if(firstWindowButton)firstWindowButton.disabled=!windowedActive||windowPosition===0;
     if(previousWindowButton)previousWindowButton.disabled=!windowedActive||windowPosition===0;
     if(nextWindowButton)nextWindowButton.disabled=!windowedActive||!windowNext;
     if(windowIndicator){
       const from=windowPosition*windowSize+1;
       const count=Number.isInteger(loaded)?loaded:null;
       const range=count===null?tr('windowLoading'):count===0?tr('windowEmpty'):
         tr('windowRange',{from,to:from+count-1});
       const globalCount=view==='iso-list'&&!query?Number(root.__radarIsoWindowedCount||0):0;
       windowIndicator.textContent=scopeLabel()+(selectedFacets()?' · '+selectedFacets():'')+' · '+tr('windowNumber',{number:windowPosition+1})+' · '+range+
         (windowNext?' · '+tr('windowMore'):'')+
         (globalCount?' · '+tr('windowCatalogueTotal',{total:globalCount}):'');
     }
   };
   if(!windowedActive||!provider?.page){updateButtons();return;}
   try{
     updateButtons();
     if(status)status.textContent=scopeLabel()+' · '+tr('windowLoading');
     const options={type:'deliverables',limit:windowSize,after:windowHistory[windowPosition],search:query,advancedQuery:advancedCurrent(),sortField:windowSortField,sortDirection:windowSortDirection,icsFilter:icsFacet?.value?.trim()||null,committeeFilter:committeeFacet?.value?.trim()||null};
     if((view==='ics'||view==='committees')&&group){
       const idx=getSidebarIndex(),parent=idx.get(view,group);
       if(parent){
         const keys=[],seen=new Set(),visit=id=>{
           if(seen.has(id))return;seen.add(id);
           const node=idx.get(view,id);if(!node)return;
           keys.push(view==='ics'?String(node.id):String(node.reference||''));
           for(const child of node.children||[])visit(child);
         };
         visit(group);
         const values=[...new Set(keys.filter(Boolean))];
         if(group==='__unclassified__')values.push('__unclassified__');
         options.dimension=view==='ics'?'ics':'committee';
         // S14-P uses the persistent hierarchical index when ready; otherwise S14-O fallback.
         options.groupKey=view==='ics'?String(parent.id):String(parent.reference||'');
         // Single leaf uses the existing IndexedDB link index. Parents use a
         // bounded cursor scan because older S14-M generations have no ancestor links.
         if(values.length===1&&group!=='__unclassified__')options.value=values[0];
         else options.values=values;
       }
     }
     if(windowSortField!=='reference'&&provider.ensureSortIndex){
       await provider.ensureSortIndex({batchSize:300,onProgress:p=>{
         if(status&&p.processed%3000===0)status.textContent=tr('sortLabel')+' : '+p.processed;
       }});
     }
     const result=await provider.page(options);
     if(token!==windowToken||mode!==view)return;
     windowNext=result.next;
     const projected=root.__radarIsoFullGrid.project(result.records,'');
     grid.clear(true);grid.records=projected;grid.total=projected.length;grid.buffered=projected.length;grid.refresh();
     if(status)status.textContent='ISO '+result.release+' · '+scopeLabel()+' · '+
       (projected.length?tr('windowRange',{from:windowPosition*windowSize+1,to:windowPosition*windowSize+projected.length}):tr('windowEmpty'))+
       (windowNext?' · '+tr('windowMore'):' · '+tr('windowEnd'));
     updateButtons(projected.length);
   }catch(e){if(token!==windowToken)return;if(status)status.textContent='Consultation fenêtrée impossible : '+e.message;windowNext=null;updateButtons();}
 }


 // S14-V: auto-advance within the same logical query. At most two IndexedDB pages
 // are materialised in w2grid. A scroll near the edge loads the next/previous page.
 function currentWindowOptions(after){
   const view=mode,query=search?.value||'',group=sidebarSelection[view];
   const options={type:'deliverables',limit:windowSize,after,search:query,advancedQuery:advancedCurrent(),sortField:windowSortField,sortDirection:windowSortDirection,icsFilter:icsFacet?.value?.trim()||null,committeeFilter:committeeFacet?.value?.trim()||null};
   if((view==='ics'||view==='committees')&&group){
     const idx=getSidebarIndex(),parent=idx.get(view,group);
     if(parent){
       const keys=[],seen=new Set(),visit=id=>{
         if(seen.has(id))return;seen.add(id);const node=idx.get(view,id);if(!node)return;
         keys.push(view==='ics'?String(node.id):String(node.reference||''));
         for(const child of node.children||[])visit(child);
       };visit(group);
       const values=[...new Set(keys.filter(Boolean))];
       if(group==='__unclassified__')values.push('__unclassified__');
       options.dimension=view==='ics'?'ics':'committee';
       options.groupKey=view==='ics'?String(parent.id):String(parent.reference||'');
       if(values.length===1&&group!=='__unclassified__')options.value=values[0];else options.values=values;
     }
   }
   return options;
 }
 async function autoShift(direction){
   if(autoLoading||!windowedActive||!grid||!['ics','committees','iso-list'].includes(mode))return;
   if(direction==='next'&&!windowNext)return;
   if(direction==='previous'&&windowBasePosition===0)return;
   const token=windowToken,view=mode;
   autoLoading=true;
   try{
     const previous=direction==='previous',index=previous?windowBasePosition-1:windowPosition+1;
     const cursor=previous?windowHistory[index]:windowNext;
     const result=await root.__radarIsoWindowed.page(currentWindowOptions(cursor));
     if(token!==windowToken||view!==mode)return;
     const rows=root.__radarIsoFullGrid.project(result.records,'');
     if(!rows.length)return;
     const scroller=mount?.querySelector('#grid_standardReferencesGrid_records, .w2ui-grid-records');
     const scrollBefore=scroller?.scrollTop||0;
     const old=grid.records.slice();let combined,removed=0;
     if(previous){
       combined=rows.concat(old);if(combined.length>2*windowSize)combined=combined.slice(0,2*windowSize);
       windowBasePosition=index;windowPosition=windowBasePosition+Math.ceil(combined.length/windowSize)-1;
       windowNext=windowHistory[windowPosition+1]||windowNext;
     }else{
       combined=old.concat(rows);
       removed=Math.max(0,combined.length-2*windowSize);
       if(removed)combined=combined.slice(removed);
       windowHistory=windowHistory.slice(0,windowPosition+1);windowHistory.push(cursor);
       windowPosition=index;windowBasePosition=index-(combined.length>windowSize?1:0);
       windowNext=result.next;
     }
     // Each page remains within the same filter/search/sort and active generation.
     grid.clear(true);grid.records=combined;grid.total=combined.length;grid.buffered=combined.length;grid.refresh();
     const actual=mount?.querySelector('#grid_standardReferencesGrid_records, .w2ui-grid-records');
     if(actual){actual.scrollTop=Math.max(0,scrollBefore+(previous?rows.length:-removed)*28);}
     if(windowIndicator){
       const from=windowBasePosition*windowSize+1,to=from+combined.length-1;
       windowIndicator.textContent=tr('windowRange',{from,to})+' · '+tr('windowAuto')+(windowNext?' · '+tr('windowMore'):'');
     }
     if(nextWindowButton)nextWindowButton.disabled=!windowNext;
     if(previousWindowButton)previousWindowButton.disabled=windowBasePosition===0;
     if(status)status.textContent=windowIndicator?.textContent||'';
   }catch(error){if(token===windowToken&&status)status.textContent='Chargement automatique : '+error.message;}
   finally{autoLoading=false;}
 }
 function onWindowGridScroll(event){
   const element=event.target;
   if(!element?.matches?.('#grid_standardReferencesGrid_records, .w2ui-grid-records'))return;
   if(autoLoading||!windowedActive)return;
   const remaining=element.scrollHeight-element.clientHeight-element.scrollTop;
   if(remaining<Math.max(100,element.clientHeight/3))void autoShift('next');
   else if(element.scrollTop<36&&windowBasePosition>0)void autoShift('previous');
 }

 function refresh(){
   if(!grid)return;
   detailColumn.text=tr('detailColumn');
   const term=search?.value||'';
   if(search)search.placeholder=mode==='ics'?tr('searchIcs'):mode==='committees'?tr('searchCommittees'):mode==='iso-list'?tr('searchIso'):mode==='rss'?tr('rssSearch'):mode==='changes'?tr('changesSearch'):tr('searchLocal');
   if(mode==='ics'||mode==='committees'){
     refreshSidebar();
     if(mode==='ics'&&(!Array.isArray(icsRows)||!icsRows.length)){
       grid.clear(true);grid.records=[];grid.total=0;grid.buffered=0;
       if(status)status.textContent=icsError?'Classifications ICS indisponibles : '+icsError:'Chargement des classifications ICS…';
       grid.refresh();updateModeButtons();return;
     }
     grid.columns=[
       {field:'identifier',text:tr('colRef'),size:'190px',sortable:false},
       {field:'title',text:tr('colTitle'),size:'32%',sortable:false},
       {field:'titleEn',text:tr('colEnglishTitle'),size:'24%',sortable:false},
       {field:'icsCodes',text:tr('ics'),size:'140px'},
       {field:'committee',text:tr('colTC'),size:'160px'},
       {field:'stage',text:tr('colStage'),size:'80px'},detailColumn
     ];
     if(windowedActive){
       grid.clear(true);grid.records=[];grid.total=0;grid.buffered=0;
       Promise.resolve().then(()=>windowPage('reset'));
     }else{
       const id=sidebarSelection[mode];
       const docs=getSidebarIndex().list(mode,id,term,true);
       const fullGrid=root.__radarIsoFullGrid;
       if(!fullGrid?.project)throw Error('S14-L1: projection des normes indisponible');
       const results=fullGrid.project(docs,'');
       grid.clear(true);grid.records=results;grid.total=results.length;grid.buffered=results.length;
       if(status)status.textContent=results.length+' '+(mode==='ics'?'normes pour la classification ICS':'normes pour le comité TC/SC')+' · '+isoDeliverables.length+' normes en cache · '+(id?'Sélection : '+(getSidebarIndex().get(mode,id)?.reference||id):'Tous les groupes');
            if(mode==='committees'&&isoCommittees.length===0&&status)status.textContent='Aucun comité TC/SC en cache. Utiliser « Gérer les sources » pour synchroniser le catalogue ou importer iso_technical_committees.';
     }
   } else if(mode==='iso-list'){
     refreshSidebar();
     grid.columns=[
       {field:'identifier',text:tr('colRef'),size:'180px',sortable:false},
       {field:'title',text:tr('colTitle'),size:'32%',sortable:false},
       {field:'titleEn',text:tr('colEnglishTitle'),size:'24%',sortable:false},
       {field:'icsCodes',text:tr('ics'),size:'135px'},
       {field:'committee',text:tr('colTC'),size:'145px'},
       {field:'stage',text:tr('colStage'),size:'75px'},detailColumn
     ];
     /* S14-L1 FULL ISO GRID */ const fullGrid=root.__radarIsoFullGrid;if(!fullGrid?.project)throw Error('S14-L1: projection ISO manquante');
     grid.clear(true);grid.records=[];grid.total=0;grid.buffered=0;
     if(windowedActive)Promise.resolve().then(()=>windowPage('reset'));
     else{
       const projected=fullGrid.project(isoDeliverables,term);
       grid.records=projected;grid.total=projected.length;grid.buffered=projected.length;
       if(status)status.textContent='Ancien catalogue en mémoire : '+projected.length+' normes. Importer S14-M pour utiliser le fenêtrage.';
     }
   } else if(mode==='changes'){
     const q=norm(term);
     grid.columns=[
       {field:'reference',text:tr('colRef'),size:'170px',sortable:true},
       {field:'dataset',text:tr('colProvenance'),size:'110px',sortable:true},
       {field:'kindLabel',text:tr('changesKind'),size:'260px',sortable:true},
       {field:'fields',text:tr('changesFields'),size:'45%'}
     ];
     const found=q?changeRows.filter(x=>norm([x.reference,x.dataset,x.kindLabel,x.fields,x.id].join(' ')).includes(q)):changeRows;
     grid.clear(true);grid.records=found.map((r,i)=>({...r,recid:'change:'+i}));grid.total=grid.records.length;grid.buffered=grid.records.length;
     if(status)status.textContent=changeMessage||tr('changesEmpty');
   } else if(mode==='rss'){
     const q=norm(term);
     grid.columns=[
       {field:'published',text:tr('rssDate'),size:'160px',sortable:true},
       {field:'title',text:tr('colTitle'),size:'48%',sortable:true},
       {field:'feedName',text:tr('rssFeed'),size:'28%'},
       {field:'linkLabel',text:tr('rssOpen'),size:'85px',render:r=>r.url?{html:'<button type="button" data-rss-open="'+escapeHtml(r.url)+'">'+escapeHtml(tr('rssOpen'))+'</button>'}:''}
     ];
     const found=q?rssRows.filter(x=>norm([x.title,x.description,x.feedName,x.published].join(' ')).includes(q)):rssRows;
     grid.clear(true);grid.records=found.map((r,i)=>({...r,recid:'rss:'+i}));grid.total=grid.records.length;grid.buffered=grid.records.length;
     if(status)status.textContent=(rssMessage||(!rssRows.length?tr('rssEmpty'):rssRows.length+' RSS'));
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
   const nav=mount?.querySelector('[data-iso-window-navigator]');if(nav)nav.style.display=windowedActive&&['ics','committees','iso-list'].includes(mode)?'inline-flex':'none';
   if(status&&localSyncMessage)status.textContent+=' · '+localSyncMessage;
   selected=null;
   grid.refresh();updateModeButtons();
   const importBtn=mount?.querySelector('[data-iso-import]');if(importBtn){importBtn.disabled=mode==='references'||mode==='rss'||mode==='changes';importBtn.title=mode==='committees'?'Importer iso_technical_committees (JSONLines)':mode==='ics'||mode==='iso-list'?'Importer iso_deliverables_metadata (JSONLines)':'Sélectionner une vue ISO pour importer';}
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
 /* S14-H RSS grid */
 async function loadRssCache(force=false){
   const api=root.__radarIsoRss;if(!api){rssMessage='Module RSS indisponible';refresh();return;}
   rssMessage='Chargement des flux RSS locaux…';refresh();
   try{const outcome=await api.syncLocal(force);rssRows=await api.readAll();rssMessage=outcome.reason==='not-configured'?tr('rssEmpty'):rssRows.length+' événements RSS en cache';}
   catch(e){rssMessage='RSS : '+String(e.message||e);}
   refresh();
 }
 /* S14-J change journal */
 async function loadChanges(){
   const api=root.__radarCatalogChanges;
   if(!api){changeMessage='Module des évolutions indisponible';if(mode==='changes')refresh();return;}
   let endpoint='';try{endpoint=root.localStorage?.getItem('radarCatalogDistributionEndpoint')||'';}catch(_){}
   if(!endpoint)endpoint=root.location.origin+root.location.pathname.replace(/[^/]*$/,'')+'catalog-distribution/';
   changeMessage=tr('changesLoad')+'…';if(mode==='changes')refresh();
   try{const res=await api.load(endpoint);const j=res.journal;changeRows=j?.changes?.map(x=>({id:x.id,reference:escapeHtml(String(x.reference||x.id)),dataset:escapeHtml(String(x.dataset)),kind:x.kind,kindLabel:tr(x.kind==='added'?'changesAdded':x.kind==='missing'?'changesMissing':'changesChanged'),fields:escapeHtml((x.fields||[]).join(', '))}))||[];changeRelease=j?j.from+' → '+j.to:'';changeMessage=j?changeRelease+' · '+changeRows.length+' changements':tr('changesEmpty');}
   catch(e){changeRows=[];changeMessage='Évolutions : '+String(e.message||e);}
   if(mode==='changes')refresh();
 }
 async function loadIcs(force=false){
   if(loading||(!force&&Array.isArray(icsRows)&&icsRows.length))return;
   loading=true;icsError=null;refresh();
   try{
     // Prefer the verified taxonomy stored in IndexedDB. Never load 81,768 notices.
     await import('./radar-iso-ics-extension.js');
     const cached=await root.__radarIsoIcsExtension.list();
     if(cached.status==='ready'&&cached.records.length){
       icsRows=cached.records;icsError=null;loading=false;refresh();return;
     }
   }catch(error){icsError='Extension ICS : '+String(error.message||error);}
   // Compatibility fallback for installations without a distributed ICS extension.
   if(typeof root.Papa?.parse!=='function'){icsError='Parseur CSV absent';loading=false;refresh();return;}
   const sources=['./ICS.csv',ICS_URL];let lastError='';
   for(const url of sources){
     try{
       const rows=await new Promise((resolve,reject)=>root.Papa.parse(url,{download:true,header:true,skipEmptyLines:true,
         complete:r=>r.errors?.length&&!(r.data||[]).length?reject(Error(r.errors[0].message)):resolve((r.data||[]).filter(x=>String(x?.identifier||'').trim()&&String(x?.titleFr||x?.titleEn||'').trim())),
         error:reject}));
       if(rows.length){icsRows=rows;icsError=null;break;}
       lastError='Fichier ICS vide';
     }catch(error){lastError=String(error?.message||error);}
   }
   if(!icsRows?.length)icsError=lastError;
   loading=false;refresh();
 }
 function initialize(node,getGraph){
   registerI18n();
   graphProvider=typeof getGraph==='function'?getGraph:null;
   if(!node||!root.document)return false;
   mount=node;mount.replaceChildren();const d=root.document;
   const box=d.createElement('div');box.style.cssText='height:100%;display:flex;flex-direction:column;min-height:0;font:13px Arial,sans-serif';
   const bar=d.createElement('div');bar.style.cssText='display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:6px;border-bottom:1px solid #ddd';
   function modeButton(id,label){const btn=d.createElement('button');btn.type='button';btn.textContent=label;btn.dataset.isoTranslation=({ics:'modeIcs',committees:'modeCommittees','iso-list':'modeIsoList',references:'modeReferences',rss:'modeRss',changes:'modeChanges'})[id];btn.dataset.catalogMode=id;btn.addEventListener('click',()=>{windowToken++;mode=id;search.value='';refresh();if(mode==='ics')loadIcs();});bar.appendChild(btn);}
   modeButton('ics',tr('modeIcs'));modeButton('committees',tr('modeCommittees'));modeButton('iso-list',tr('modeIsoList'));modeButton('references',tr('modeReferences'));modeButton('rss',tr('modeRss'));modeButton('changes',tr('modeChanges'));
   search=d.createElement('input');search.type='search';search.placeholder='Code ou libellé ICS…';search.setAttribute('aria-label',tr('searchAccessible'));search.style.cssText='flex:1;min-width:180px;padding:5px';bar.appendChild(search);
   advancedButton=d.createElement('button');advancedButton.type='button';advancedButton.textContent='Recherche avancée…';advancedButton.title='Combiner des critères ET / OU / NON avec des parenthèses';advancedButton.addEventListener('click',openAdvancedDialog);bar.appendChild(advancedButton);
   // S14-T: page size is not a catalogue limit. Keep a bounded window in w2grid.
   const navigator=d.createElement('span');navigator.dataset.isoWindowNavigator='true';navigator.style.cssText='display:inline-flex;align-items:center;gap:5px;flex-wrap:wrap';
   firstWindowButton=d.createElement('button');firstWindowButton.type='button';firstWindowButton.textContent='⏮';firstWindowButton.title='Revenir à la première fenêtre';firstWindowButton.setAttribute('aria-label','Première fenêtre');firstWindowButton.disabled=true;firstWindowButton.addEventListener('click',()=>windowPage('first'));navigator.appendChild(firstWindowButton);
   previousWindowButton=d.createElement('button');previousWindowButton.type='button';previousWindowButton.textContent='◀';previousWindowButton.disabled=true;previousWindowButton.title='Fenêtre précédente du groupe sélectionné';previousWindowButton.setAttribute('aria-label','Fenêtre précédente');previousWindowButton.addEventListener('click',()=>windowPage('previous'));navigator.appendChild(previousWindowButton);
   windowIndicator=d.createElement('span');windowIndicator.setAttribute('role','status');windowIndicator.style.cssText='white-space:nowrap;font-size:12px';windowIndicator.textContent='Fenêtre 1 · chargement…';navigator.appendChild(windowIndicator);
   nextWindowButton=d.createElement('button');nextWindowButton.type='button';nextWindowButton.textContent='▶';nextWindowButton.disabled=true;nextWindowButton.title='Fenêtre suivante du groupe sélectionné';nextWindowButton.setAttribute('aria-label','Fenêtre suivante');nextWindowButton.addEventListener('click',()=>windowPage('next'));navigator.appendChild(nextWindowButton);
   const windowSizeLabel=d.createElement('label');windowSizeLabel.textContent='Normes par fenêtre : ';windowSizeLabel.style.cssText='display:inline-flex;align-items:center;gap:5px;white-space:nowrap;flex:0 0 auto;';
   windowSizeSelect=d.createElement('select');windowSizeSelect.setAttribute('aria-label','Nombre de normes par fenêtre');windowSizeSelect.style.cssText='display:inline-block;box-sizing:border-box;width:76px;min-width:76px;max-width:76px;height:30px;min-height:30px;max-height:30px;padding:2px 5px;margin:0;flex:none;align-self:center;';windowSizeSelect.size=1;
   for(const n of WINDOW_SIZES){const opt=d.createElement('option');opt.value=String(n);opt.textContent=String(n);windowSizeSelect.appendChild(opt);}
   windowSizeSelect.value=String(windowSize);
   windowSizeSelect.addEventListener('change',()=>{const size=Number(windowSizeSelect.value);if(!WINDOW_SIZES.includes(size))return;windowSize=size;windowPage('reset');});
   windowSizeLabel.appendChild(windowSizeSelect);navigator.appendChild(windowSizeLabel);bar.appendChild(navigator);
   const sortLabel=d.createElement('label');sortLabel.style.cssText='display:inline-flex;align-items:center;gap:5px;white-space:nowrap';
   const sortText=d.createElement('span');sortText.dataset.isoTranslation='sortLabel';sortText.textContent=tr('sortLabel');sortLabel.appendChild(sortText);
   sortSelect=d.createElement('select');sortSelect.setAttribute('aria-label',tr('sortLabel'));
   sortSelect.style.cssText='display:inline-block;box-sizing:border-box;min-width:150px;width:180px;height:30px;max-height:30px;padding:2px 5px;flex:none';
   for(const [value,label] of [['reference:asc','sortReferenceAsc'],['reference:desc','sortReferenceDesc'],['title:asc','sortTitleAsc'],['title:desc','sortTitleDesc'],['titleEn:asc','sortEnglishAsc'],['titleEn:desc','sortEnglishDesc'],['stage:asc','sortStageAsc'],['stage:desc','sortStageDesc']]){
     const option=d.createElement('option');option.value=value;option.dataset.isoTranslation=label;option.textContent=tr(label);sortSelect.appendChild(option);
   }
   sortSelect.addEventListener('change',()=>{
     const parts=sortSelect.value.split(':');windowSortField=parts[0];windowSortDirection=parts[1];
     if(windowedActive&&['ics','committees','iso-list'].includes(mode))void windowPage('reset');
   });
   sortLabel.appendChild(sortSelect);bar.appendChild(sortLabel);
   // Independent facets combine with the current sidebar selection and full-text search.
   function facet(labelKey,placeholder){
     const label=d.createElement('label');label.style.cssText='display:inline-flex;gap:4px;align-items:center';
     const caption=d.createElement('span');caption.dataset.isoTranslation=labelKey;caption.textContent=tr(labelKey);label.appendChild(caption);
     const input=d.createElement('input');input.type='search';input.placeholder=placeholder;
     input.setAttribute('aria-label',tr(labelKey));input.style.cssText='box-sizing:border-box;width:134px;min-width:100px;height:30px;min-height:30px;padding:3px 5px';
     label.appendChild(input);bar.appendChild(label);
     let debounce=null;input.addEventListener('input',()=>{
       if(debounce)clearTimeout(debounce);
       debounce=setTimeout(()=>{if(windowedActive&&['ics','committees','iso-list'].includes(mode)){refreshSidebar();void windowPage('reset');}},250);
     });return input;
   }
   icsFacet=facet('filterIcs','07 / 01.040');
   committeeFacet=facet('filterCommittee','ISO/TC 121');
   const reload=d.createElement('button');reload.type='button';reload.textContent=tr('refresh');reload.dataset.isoTranslation='refresh';bar.appendChild(reload);
   const syncButton=d.createElement('button');syncButton.type='button';syncButton.textContent=tr('sync');syncButton.dataset.isoTranslation='sync';syncButton.title='Charger les fichiers ISO téléchargés localement dans IndexedDB';syncButton.addEventListener('click',()=>syncLocalIso());bar.appendChild(syncButton);
   const remote=d.createElement('button');remote.type='button';remote.dataset.catalogDistribution='true';remote.dataset.isoTranslation='distributedSync';remote.textContent=tr('distributedSync');remote.title=tr('distributedSync');
   remote.addEventListener('click',async()=>{
     remote.disabled=true;
     try{
       await import('./radar-iso-ics-extension.js');
       await import('./radar-iso-catalog-client.js');
       const result=await root.__radarIsoCatalogClient.sync({onProgress:p=>{
         if(status)status.textContent='ISO '+(p.dataset||'')+' : '+(p.count||0)+' enregistrements';
       }});
       await loadIsoCache();await loadIcs(true);refresh();
       if(status)status.textContent='Catalogue '+result.release+' : ISO '+result.iso.status+', ICS '+result.ics.status+(result.warnings.length?' · '+result.warnings.join('; '):'');
       root.__radarLastCatalogSync=result;
     }catch(error){root.__radarLastCatalogSync={operation:'S14-S-CATALOG-SYNC',status:'error',message:String(error?.message||error)};if(status)status.textContent=tr('distributedError')+' : '+String(error?.message||error);}
     finally{remote.disabled=false;}
   });bar.appendChild(remote);
   const changesReload=d.createElement('button');changesReload.type='button';changesReload.dataset.isoTranslation='changesLoad';changesReload.textContent=tr('changesLoad');changesReload.addEventListener('click',()=>loadChanges());bar.appendChild(changesReload);
   const rssReload=d.createElement('button');rssReload.type='button';rssReload.textContent=tr('rssSync');rssReload.dataset.isoTranslation='rssSync';rssReload.addEventListener('click',()=>loadRssCache(true));bar.appendChild(rssReload);
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
   }else grid.render(target);
   target.addEventListener('scroll',onWindowGridScroll,true);
   target.addEventListener('click',e=>{const rss=e.target?.closest?.('[data-rss-open]');if(rss){const url=rss.getAttribute('data-rss-open');try{const u=new URL(url);if(u.protocol==='https:'&&u.hostname.endsWith('.iso.org'))root.open(u.href,'_blank','noopener,noreferrer');}catch(_){/* invalid url */}return;}
     const btn=e.target?.closest?.('[data-iso-detail]');if(!btn)return;
     const id=btn.getAttribute('data-iso-detail');const record={kind:'standard',isoId:id};
     if(windowedActive&&root.__radarIsoWindowed?.get){root.__radarIsoWindowed.get({type:'deliverables',id}).then(item=>{if(item)showDetail({...record,isoItem:item});else showDetail(record);}).catch(err=>{if(status)status.textContent=err.message;});}
     else showDetail(record);
   });
   let isoSearchDebounce=null;search.addEventListener('input',()=>{if(isoSearchDebounce)clearTimeout(isoSearchDebounce);if(mode!=='iso-list'){isoSearchDebounce=setTimeout(()=>{isoSearchDebounce=null;refresh();},180);return;}isoSearchDebounce=setTimeout(()=>{isoSearchDebounce=null;refresh();},180);});reload.addEventListener('click',()=>{if(mode==='ics')loadIcs(true);loadIsoCache();});
   add.addEventListener('click',()=>{
     if(mode!=='references'){status.textContent='Les normes ISO en cache sont consultables ; leur rapprochement au registre et leur création de blips seront traités dans le prochain lot. Pour ajouter un blip, utiliser « Références locales ». ';return;}
     if(!selected){status.textContent='Sélectionner une référence.';return;}
     const group=root.__radarRevisionSession?.status?.().activeGroup;
     const revision=root.__radarCatalogAdapter?.getRevision?.(group);
     if(!revision||revision.status!=='draft'){status.textContent='Sélectionner une révision draft pour ajouter un blip.';return;}
     try{root.__radarCatalogCreateForm.open(graphProvider?.(),'existing',selected);}
     catch(e){status.textContent=e.message;}
   });
   bindLocale();updateStaticLabels();refresh();loadIcs();loadIsoCache().then(()=>{if(!windowedActive)return syncLocalIso();});loadRssCache();loadChanges();return true;
 }
 function open(){if(!mount)initialize(root.document?.getElementById('standard-references-panel'));const layout=root.w2ui?.mainLayout;if(layout?.show)layout.show('bottom');if(layout?.sizeTo)layout.sizeTo('bottom',240);refresh();search?.focus();}
 root.__radarStandardsPanel=Object.freeze({initialize,refresh,open,icsTree,enrichedIcsTree});
})(window);
