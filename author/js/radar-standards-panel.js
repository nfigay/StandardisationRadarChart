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
 let nativeOriginFilter=null;
 let standardsToolbar=null,toolbarState=new Map(),documentOffset=0,documentSeries=null,documentOmgAdoptions=false,documentOmgFamily=null,documentResult=null,documentBusy=false,documentMessage='',documentToken=0,omgFile=null;
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
 const isoStrings={fr:{"filterIcs":"Filtre ICS","filterCommittee":"Filtre TC/SC","sortLabel":"Trier par","sortReferenceAsc":"Référence A → Z","sortReferenceDesc":"Référence Z → A","sortTitleAsc":"Titre A → Z","sortTitleDesc":"Titre Z → A","sortEnglishAsc":"Titre anglais A → Z","sortEnglishDesc":"Titre anglais Z → A","sortStageAsc":"Stade A → Z","sortStageDesc":"Stade Z → A","windowAuto":"défilement automatique","windowScopeAll":"Toutes les normes","windowScopeDescendants":"sous-groupes inclus","windowNumber":"Fenêtre {{number}}","windowLoading":"chargement…","windowEmpty":"aucune norme","windowRange":"normes {{from}}–{{to}}","windowMore":"suite disponible","windowEnd":"fin des résultats","windowCatalogueTotal":"{{total}} normes au catalogue","modeChanges":"Évolutions ISO","changesLoad":"Charger les évolutions","changesSearch":"Référence, champ, changement…","changesFrom":"Depuis","changesTo":"Vers","changesKind":"Évolution","changesFields":"Champs modifiés","changesMissing":"Absente du nouveau jeu (retrait non confirmé)","changesAdded":"Nouvelle dans le jeu","changesChanged":"Métadonnées modifiées","changesEmpty":"Aucun journal publié. Comparer deux releases ISO pour produire des évolutions.","distributedSync":"Synchroniser le catalogue distribué","distributedPrompt":"Adresse du service de catalogues (URL)","distributedError":"Synchronisation du catalogue échouée","detail":"Détails","showStandards":"Afficher les normes","detailColumn":"Fiche","close":"Fermer","formTitle":"Fiche ISO","formTab":"Fiche de la norme","rawTab":"Métadonnées originales","reference":"Référence","titleFr":"Titre français","titleEn":"Titre anglais","otherLanguages":"Autres titres","scopeFr":"Description française","scopeEn":"Description anglaise","otherScopes":"Autres descriptions","ics":"Codes ICS","committee":"Comité TC / SC","stage":"Stade ISO","edition":"Édition","publicationDate":"Date de publication","deliverableType":"Type de livrable","supplementType":"Type de supplément","languages":"Langues","pages":"Pages","replaces":"Remplace","replacedBy":"Remplacée par","sourceData":"Toutes les métadonnées ISO","grpIdentification":"Identification","grpTitles":"Titres","grpDescriptions":"Descriptions / périmètre","grpClassification":"Classification et organisation","grpLifecycle":"Cycle de vie","grpRelations":"Relations entre éditions","grpRaw":"Champs bruts (consultation)","colIcs":"Code ICS","colLabel":"Libellé","colEnglishLabel":"Libellé anglais","colTC":"TC / SC","colTCRef":"TC / SC / Référence","colDescription":"Description","colRef":"Référence","colTitle":"Titre","colEnglishTitle":"Titre anglais","colStage":"Stade","colEdition":"Édition","colProvenance":"Provenance","modeIcs":"ICS et normes","modeCommittees":"Comités TC / SC","modeIsoList":"Normes ISO","modeReferences":"Références du catalogue","refresh":"Actualiser","sync":"Charger catalogue ISO","add":"Ajouter au radar","import":"Importer JSONL","searchIcs":"ICS, titre, description, référence…","searchCommittees":"TC/SC, titre, description, norme…","searchIso":"Norme ISO, texte anglais, ICS, comité, stade…","searchLocal":"Numéro, titre, édition, organisme, source…","searchAccessible":"Rechercher dans le catalogue sélectionné","missingReference":"Identifiant ISO {{id}} — référence absente du cache","noCategory":"Sans catégorie ICS connue dans le catalogue","readOnlyUnavailable":"Le formulaire w2ui (w2form) est indisponible.","modeRss":"Actualités RSS","rssSync":"Actualiser RSS local","rssFeed":"Flux","rssDate":"Date","rssOpen":"Consulter","rssEmpty":"Aucun RSS en cache. Ajouter des flux avec tools/sync-iso-rss.mjs et exécuter la synchronisation.","rssSearch":"RSS, actualités, références…"},en:{"filterIcs":"ICS filter","filterCommittee":"TC/SC filter","sortLabel":"Sort by","sortReferenceAsc":"Reference A → Z","sortReferenceDesc":"Reference Z → A","sortTitleAsc":"Title A → Z","sortTitleDesc":"Title Z → A","sortEnglishAsc":"English title A → Z","sortEnglishDesc":"English title Z → A","sortStageAsc":"Stage A → Z","sortStageDesc":"Stage Z → A","windowAuto":"automatic scrolling","windowScopeAll":"All standards","windowScopeDescendants":"including subgroups","windowNumber":"Window {{number}}","windowLoading":"loading…","windowEmpty":"no standards","windowRange":"standards {{from}}–{{to}}","windowMore":"more available","windowEnd":"end of results","windowCatalogueTotal":"{{total}} standards in catalogue","modeChanges":"ISO changes","changesLoad":"Load changes","changesSearch":"Reference, field, change…","changesFrom":"From","changesTo":"To","changesKind":"Change","changesFields":"Changed fields","changesMissing":"Missing from new snapshot (withdrawal unconfirmed)","changesAdded":"New in snapshot","changesChanged":"Metadata changed","changesEmpty":"No published journal. Compare two ISO releases to generate changes.","distributedSync":"Sync distributed catalogue","distributedPrompt":"Catalogue service URL","distributedError":"Catalogue sync failed","detail":"Details","showStandards":"Show standards","detailColumn":"Details","close":"Close","formTitle":"ISO record","formTab":"Standard details","rawTab":"Original metadata","reference":"Reference","titleFr":"French title","titleEn":"English title","otherLanguages":"Other titles","scopeFr":"French description","scopeEn":"English description","otherScopes":"Other descriptions","ics":"ICS codes","committee":"Responsible TC / SC","stage":"ISO stage","edition":"Edition","publicationDate":"Publication date","deliverableType":"Deliverable type","supplementType":"Supplement type","languages":"Languages","pages":"Pages","replaces":"Replaces","replacedBy":"Replaced by","sourceData":"All ISO source metadata","grpIdentification":"Identification","grpTitles":"Titles","grpDescriptions":"Descriptions / scope","grpClassification":"Classification and organization","grpLifecycle":"Lifecycle","grpRelations":"Relationships between editions","grpRaw":"Raw source fields (read-only)","colIcs":"ICS code","colLabel":"Label","colEnglishLabel":"English label","colTC":"TC / SC","colTCRef":"TC / SC / Reference","colDescription":"Description","colRef":"Reference","colTitle":"Title","colEnglishTitle":"English title","colStage":"Stage","colEdition":"Edition","colProvenance":"Provenance","modeIcs":"ICS and standards","modeCommittees":"Technical committees TC / SC","modeIsoList":"ISO standards","modeReferences":"Catalog references","refresh":"Refresh","sync":"Load ISO catalogue","add":"Add to radar","import":"Import JSONL","searchIcs":"ICS, title, description, reference…","searchCommittees":"TC/SC, title, description, standard…","searchIso":"ISO standard, English text, ICS, committee, stage…","searchLocal":"Number, title, edition, issuer, source…","searchAccessible":"Search the selected catalogue","missingReference":"ISO identifier {{id}} — reference missing from cache","noCategory":"No known ICS category in catalogue","readOnlyUnavailable":"The w2ui form (w2form) is unavailable.","modeRss":"RSS updates","rssSync":"Refresh local RSS","rssFeed":"Feed","rssDate":"Date","rssOpen":"Open","rssEmpty":"No RSS cached. Add feeds using tools/sync-iso-rss.mjs and synchronize.","rssSearch":"RSS, news, references…"}};
 Object.assign(isoStrings.fr,{storedTab:'Métadonnées conservées',storedData:'Copie documentaire conservée',grpStored:'Copie documentaire (consultation)'});
 Object.assign(isoStrings.en,{storedTab:'Stored metadata',storedData:'Stored document snapshot',grpStored:'Document snapshot (read-only)'});
 Object.assign(isoStrings.fr,{publishedReferences:'Références publiées',addToCatalog:'Ajouter au catalogue',viewReferences:'Voir les références',referenceAlreadyPresent:'Déjà présente dans le catalogue',referenceIntegrated:'Référence intégrée au catalogue',documentSnapshot:'Copie documentaire',publishedReferenceCount:'{{count}} référence(s) publiée(s)',nativeReferenceCount:'{{count}} référence(s) du catalogue métier'});
 Object.assign(isoStrings.en,{publishedReferences:'Published references',addToCatalog:'Add to catalog',viewReferences:'View references',referenceAlreadyPresent:'Already in catalog',referenceIntegrated:'Reference added to catalog',documentSnapshot:'Document snapshot',publishedReferenceCount:'{{count}} published reference(s)',nativeReferenceCount:'{{count}} business catalog reference(s)'});
 Object.assign(isoStrings.fr,{addFromReferences:'Intégrez d’abord la norme au catalogue, puis utilisez la vue Références.',selectReference:'Sélectionnez une référence.',selectDraft:'Sélectionnez un brouillon pour ajouter un blip.'});
 Object.assign(isoStrings.en,{addFromReferences:'Add the standard to the catalog first, then use the References view.',selectReference:'Select a reference.',selectDraft:'Select a draft to add a blip.'});
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
 Object.assign(isoStrings.fr,{advancedSearch:'Recherche avancée…',advancedTitle:'Combiner des critères ET / OU / NON avec des parenthèses',moreFilters:'Filtres et tri',declareLocal:'Déclarer une référence',declaredFeedback:'Référence locale enregistrée (non vérifiée). Vous pouvez l’ajouter au brouillon actif.',nativeAll:'Toutes les provenances',nativeTitle:'Fiche de référence',nativeIssuer:'Organisme',nativeSource:'Source documentaire',nativeUrl:'URL source',nativeOrigin:'Origine',nativeId:'Identifiant',nativeUnknown:'Inconnu',nativeManual:'Déclaration locale',nativeIso:'ISO Open Data',nativeLegacy:'Historique',nativeUnverified:'Non vérifiée',nativeVerified:'Issue de la source'});
 Object.assign(isoStrings.en,{advancedSearch:'Advanced search…',advancedTitle:'Combine AND / OR / NOT criteria with parentheses',moreFilters:'Filters and sorting',declareLocal:'Declare a reference',declaredFeedback:'Local reference saved (unverified). You can add it to the active draft.',nativeAll:'All origins',nativeTitle:'Reference details',nativeIssuer:'Issuer',nativeSource:'Documentary source',nativeUrl:'Source URL',nativeOrigin:'Origin',nativeId:'Identifier',nativeUnknown:'Unknown',nativeManual:'Local declaration',nativeIso:'ISO Open Data',nativeLegacy:'Legacy',nativeUnverified:'Unverified',nativeVerified:'Source verified'});
 Object.assign(isoStrings.fr,{standardSources:'Sources de standardisation',nativeRfc:'RFC Editor',nativeW3c:'W3C API',nativeDocumentStatus:'Statut documentaire',nativeAcquired:'Acquisition',externalAdded:'Référence intégrée au catalogue.',externalExisting:'Référence déjà présente ; notice sélectionnée.'});
 Object.assign(isoStrings.fr,{referenceLifecycle:'Cycle de vie',referenceUpdated:'Notice actualisée ; identifiant conservé.',referenceReconciled:'Déclaration réconciliée ; identifiant conservé.',referenceRemoved:'Référence supprimée.',referenceLifecycleError:'Impossible de contrôler les dépendances de cette référence.'});
 Object.assign(isoStrings.en,{referenceLifecycle:'Lifecycle',referenceUpdated:'Record updated; identifier retained.',referenceReconciled:'Declaration reconciled; identifier retained.',referenceRemoved:'Reference removed.',referenceLifecycleError:'Unable to check dependencies for this reference.'});
 Object.assign(isoStrings.en,{standardSources:'Standardization sources',nativeRfc:'RFC Editor',nativeW3c:'W3C API',nativeDocumentStatus:'Document status',nativeAcquired:'Acquired',externalAdded:'Reference added to catalog.',externalExisting:'Reference already present; record selected.'});
 Object.assign(isoStrings.fr,{browseRfc:'RFC Editor',browseW3c:'W3C',sourceNeedsCatalog:'Ouvrez un catalogue métier pour consulter et intégrer les références de cette source.'});
 Object.assign(isoStrings.en,{browseRfc:'RFC Editor',browseW3c:'W3C',sourceNeedsCatalog:'Open a business catalog to browse and integrate references from this source.'});
 Object.assign(isoStrings.fr,{resourceSelector:'Source documentaire',resourceOmgSpecs:'Spécifications OMG',resourceOmgAdoptions:'Adoptions ISO',resourceIsoManage:'Gérer les sources ISO',resourceInventory:'Inventaire des ressources',resourceLoad:'Charger',resourceRefresh:'Actualiser la source',resourceOpen:'Ouvrir la source',resourceImport:'Importer / actualiser le corpus',resourceOmgRestore:'Charger le corpus en cache',resourceOmgOnline:'Actualiser OMG en ligne',resourceOmgPrepared:'Charger le corpus préparé',resourceOmgOfficial:'Acquisition HTTPS directe',resourceOmgRelay:'Acquisition HTTPS via le relais local',resourceOmgPreparedOrigin:'Corpus préparé par le collecteur local',resourceBack:'Retour aux spécifications',resourceVersions:'Publications',resourceDetails:'Fiche documentaire',resourceEmpty:'Aucune donnée chargée. Charger explicitement la source.',resourceOmgEmpty:'OMG : actualiser en ligne, charger un corpus préparé ou importer un fichier. Aucun accès réseau automatique.',resourceOmgDataset:'Corpus local',resourceOmgLocal:'Fichier local : origine non vérifiée',resourcePartial:'Couverture partielle',resourceComplete:'Tables reconnues sans rejet (pas toutes les éditions historiques)',resourceRows:'résultats',resourcePrevious:'Page précédente',resourceNext:'Page suivante',resourcePage:'Page',resourceRead:'Consultation',resourceSearch:'Référence, titre, statut, édition…',resourceType:'Type de ressource',resourceAccess:'Accès',resourceConnector:'Connecteur',resourceIsoAdoption:'Adoptions ISO signalées',resourceDate:'Date',resourceFlow:'Flux',resourceSelect:'Sélectionner une ligne',resourceNoCatalog:'Ouvrir ou créer un catalogue pour intégrer une publication.',resourceVersionRequired:'Sélectionner une publication datée.',resourceCancel:'Annuler',resourceError:'Erreur documentaire',resourceLoading:'Chargement…',resourceContext:'Contexte IETF',resourceAvailable:'Disponible',resourceNotImplemented:'Non implémenté',resourceReview:'À instruire',resourceSource:'Source',resourceClear:'Effacer l’index OMG en cache (historiques conservés)',resourceImportSnapshot:'Importer un instantané',resourceSourceUrl:'URL officielle',resourceCache:'Cache',resourceLocalNoDate:'Date d’acquisition non déclarée',resourceCacheClearFailed:'Le cache navigateur n’a pas pu être effacé.'});
 Object.assign(isoStrings.en,{resourceSelector:'Documentary source',resourceOmgSpecs:'OMG specifications',resourceOmgAdoptions:'ISO adoptions',resourceIsoManage:'Manage ISO sources',resourceInventory:'Resource inventory',resourceLoad:'Load',resourceRefresh:'Refresh source',resourceOpen:'Open source',resourceImport:'Import / update corpus',resourceOmgRestore:'Load cached corpus',resourceOmgOnline:'Refresh OMG online',resourceOmgPrepared:'Load prepared corpus',resourceOmgOfficial:'Direct HTTPS acquisition',resourceOmgRelay:'HTTPS acquisition via local relay',resourceOmgPreparedOrigin:'Corpus prepared by the local collector',resourceBack:'Back to specifications',resourceVersions:'Publications',resourceDetails:'Document details',resourceEmpty:'No data loaded. Explicitly load the source.',resourceOmgEmpty:'OMG: refresh online, load a prepared corpus or import a file. No automatic network access.',resourceOmgDataset:'Local corpus',resourceOmgLocal:'Local file: unverified origin',resourcePartial:'Partial coverage',resourceComplete:'Recognized tables without rejected rows (not all historical editions)',resourceRows:'results',resourcePrevious:'Previous page',resourceNext:'Next page',resourcePage:'Page',resourceRead:'Consultation',resourceSearch:'Reference, title, status, edition…',resourceType:'Resource type',resourceAccess:'Access',resourceConnector:'Connector',resourceIsoAdoption:'Reported ISO adoptions',resourceDate:'Date',resourceFlow:'Stream',resourceSelect:'Select a row',resourceNoCatalog:'Open or create a catalog to integrate a publication.',resourceVersionRequired:'Select a dated publication.',resourceCancel:'Cancel',resourceError:'Documentary error',resourceLoading:'Loading…',resourceContext:'IETF context',resourceAvailable:'Available',resourceNotImplemented:'Not implemented',resourceReview:'To review',resourceSource:'Source',resourceClear:'Clear cached OMG index (keep histories)',resourceImportSnapshot:'Import snapshot',resourceSourceUrl:'Official URL',resourceCache:'Cache',resourceLocalNoDate:'Acquisition date not declared',resourceCacheClearFailed:'Browser cache could not be cleared.'});
 Object.assign(isoStrings.fr,{resourceOmgHistoryImport:'Importer un historique OMG (JSON)',resourceOmgHistoryExport:'Exporter cet historique (JSON)',resourceOmgHistoryImported:'Historique privé importé',resourceOmgPublished:'Charger les références OMG en ligne (Pages)',resourceOmgPublic:'Index de liens publics, source OMG'});
 Object.assign(isoStrings.en,{resourceOmgHistoryImport:'Import OMG edition history (JSON)',resourceOmgHistoryExport:'Export this history (JSON)',resourceOmgHistoryImported:'Private history imported',resourceOmgPublished:'Load OMG references online (Pages)',resourceOmgPublic:'Public link index, OMG source'});
 Object.assign(isoStrings.fr,{resourceOmgHistory:'Historique des éditions',resourceOmgHistoryView:'Historique OMG',resourceOmgApplicability:'Une ancienne édition peut rester applicable en exploitation ; vérifier le contexte contractuel ou technique.',resourceOmgHistoryBack:'Retour au catalogue OMG',resourceOmgHistoryRefresh:'Actualiser cet historique',resourceOmgHistoryUnavailable:'Historique non encore acquis'});
 Object.assign(isoStrings.en,{resourceOmgHistory:'Edition history',resourceOmgHistoryView:'OMG history',resourceOmgApplicability:'An earlier edition may remain applicable in operation; verify contractual or technical context.',resourceOmgHistoryBack:'Back to OMG catalog',resourceOmgHistoryRefresh:'Refresh this history',resourceOmgHistoryUnavailable:'History not yet acquired'});
 registerI18n();
 let activeDetailRecord=null,activeDetailCleanup=null;
 let localeSubscribed=false;
 function bindLocale(){
   if(localeSubscribed||!root.i18next?.on)return;
   root.i18next.on('languageChanged',()=>{
     const previous=mode==='references'?selected:null;
     refresh();updateStaticLabels();
     if(previous&&grid?.records.some(r=>r.recid===previous)){grid.select?.(previous);selected=previous;updateToolbar();}
     if(activeDetailRecord)showDetail({...activeDetailRecord});
   });
   localeSubscribed=true;
 }
 function updateStaticLabels(){
   if(!mount)return;
   for(const el of mount.querySelectorAll('[data-iso-translation]'))el.textContent=tr(el.dataset.isoTranslation);
   if(search)search.setAttribute('aria-label',tr('searchAccessible'));
   if(nativeOriginFilter)nativeOriginFilter.setAttribute('aria-label',tr('nativeOrigin'));
   if(advancedButton)advancedButton.title=tr('advancedTitle');
 }

 const escapeHtml=v=>str(v).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
 const asLines=v=>str(v).replace(/\r\n/g,'\n');
 const preview=v=>escapeHtml(asLines(v).slice(0,280)).replace(/\n/g,'<br>');
 const findDeliverable=id=>isoDeliverables.find(x=>str(x.id)===str(id));
 const findCommittee=id=>isoCommittees.find(x=>str(x.id)===str(id));
 // C3: evidence-based ISO edition navigation. Never equate a missing cache row
 // with a nonexistent publication, and never infer relationships from dates.
 const isoEditionSeries=(function(){
   function family(reference){
     const match=String(reference||'').toUpperCase().match(/\b(\d{3,7}(?:-\d{1,5})+)(?=[:\s\/]|$)/);
     return match?match[1]:null;
   }
   function kind(record){
     const ref=String(record?.reference||'');
     if(/(?:\/|\b)(?:COR|CORRIGENDUM|TC)\s*\d/i.test(ref)||/corrigend/i.test(String(record?.supplementType||'')))return 'corrigendum';
     if(/(?:\/|\b)(?:AMD|AMENDMENT)\s*\d/i.test(ref)||/amendment/i.test(String(record?.supplementType||'')))return 'amendment';
     if(/^ISO\/(?:CD|DIS|FDIS|NP|WD|DTS|DTR)\b/i.test(ref))return 'project';
     return 'edition';
   }
   function collect(subject,candidates){
     const id=family(subject?.reference),found=new Map();
     if(!id)return {family:null,rows:[]};
     for(const item of [subject,...(Array.isArray(candidates)?candidates:[])]){
       if(!item||family(item.reference)!==id||!item.reference)continue;
       const key=String(item.id??item.reference);
       if(!found.has(key))found.set(key,{id:item.id==null?null:String(item.id),reference:String(item.reference),edition:item.edition??null,date:item.publicationDate??null,kind:kind(item),item});
     }
     return {family:id,rows:[...found.values()].sort((a,b)=>String(a.reference).localeCompare(String(b.reference),'fr',{numeric:true}))};
   }
   function relations(subject,candidates){
     const byId=new Map(candidates.filter(Boolean).map(x=>[String(x.id),x]));
     return ['replaces','replacedBy'].flatMap(direction=>(Array.isArray(subject?.[direction])?subject[direction]:[]).map(id=>({direction,id:String(id),record:byId.get(String(id))||null})));
   }
   return Object.freeze({family,kind,collect,relations});
 })();
 root.__radarIsoEditionSeries=isoEditionSeries;

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
           bar.append(
             button('+ Critère',()=>structural('addCondition',node,1)),
             button('+ Sous-groupe',()=>structural('addGroup',node,2))
           );
           if(parent){
             const position=parent.children.indexOf(node);
             const up=button('↑',()=>structural('moveUp',node));
             up.title='Déplacer ce groupe vers le haut';
             up.disabled=position===0;
             const down=button('↓',()=>structural('moveDown',node));
             down.title='Déplacer ce groupe vers le bas';
             down.disabled=position===parent.children.length-1;
             bar.append(up,down,
               button('+ Groupe au même niveau',
                 ()=>structural('addSiblingGroup',node,2))
             );
             bar.append(button('Dissoudre ce groupe (garder les critères)',
               ()=>structural('unwrap',node)));
             const removeGroup=button('Supprimer ce groupe et ses critères',
               ()=>structural('remove',node));
             removeGroup.disabled=parent.children.length===1;
             bar.append(removeGroup);
           }
           box.appendChild(bar);
           for(const child of node.children)draw(child,node,depth+1,box);
         }else{
           box.append(select(fields,node.field,v=>{node.field=v;}),select([['contains','Contient'],['equals','Est égal à'],['prefix','Commence par']],node.comparison,v=>{node.comparison=v;}));
           const input=doc.createElement('input');input.type='text';input.value=node.value;input.placeholder='Terme';input.style.cssText='height:30px;min-width:120px;max-width:45%;box-sizing:border-box';input.addEventListener('input',()=>{node.value=input.value;});box.appendChild(input);
           const actions=doc.createElement('div');actions.style.cssText='display:flex;flex-wrap:wrap;gap:3px';
           const position=parent.children.indexOf(node);
           const up=button('↑',()=>structural('moveUp',node));
           up.title='Déplacer cette condition vers le haut';
           up.disabled=position===0;
           const down=button('↓',()=>structural('moveDown',node));
           down.title='Déplacer cette condition vers le bas';
           down.disabled=position===parent.children.length-1;
           actions.append(up,down,
             button('+ Critère voisin',
               ()=>structural('addSiblingCondition',node,1)),
             button('Regrouper cette condition (…)',()=>structural('wrap',node,1)),
             button('+ Groupe au même niveau',
               ()=>structural('addSiblingGroup',node,2))
           );
           const removeCondition=button('Supprimer',
             ()=>structural('remove',node));
           removeCondition.disabled=parent.children.length===1;
           actions.append(removeCondition);
           box.appendChild(actions);
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
   const local=record.localReference;
   const item=local?{reference:local.designation||local.name}:record.nativeReference?record.isoItem:record.kind==='standard'?(record.isoItem||findDeliverable(record.isoId)):record.kind==='committee'?findCommittee(record.committeeId):null;
   if(!d||!item)return;
   if(typeof root.w2form!=='function'||typeof root.w2popup?.open!=='function'){
     if(status)status.textContent=tr('readOnlyUnavailable');
     return;
   }
   if(activeDetailRecord)root.w2popup?.close?.();
   activeDetailCleanup?.();
   const detail={...record};
   activeDetailRecord=detail;
   // S17-R4: w2popup owns the window. The existing read-only w2form owns the fields.
   // Keep a per-record lifecycle so delayed ISO lookups cannot repaint a closed form.
   let disposed=false,form=null,pendingNext=null;
   const style=d.createElement('style');
   style.textContent='#iso-standard-detail-popup-body .w2ui-label, #iso-standard-detail-popup-body .w2ui-field > label, #iso-standard-detail-popup-body .w2ui-field label {white-space:normal!important;overflow:visible!important;text-overflow:clip!important;overflow-wrap:break-word!important;max-width:none!important;}';
   const wrapper=d.createElement('div');wrapper.style.cssText='height:100%;display:flex;flex-direction:column;min-height:0';
   const header=d.createElement('div');header.style.cssText='flex:none;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:10px 16px;border-bottom:1px solid #ddd';
   const heading=d.createElement('strong');heading.textContent=item.reference||tr('formTitle');heading.style.cssText='font:600 18px Arial,sans-serif';header.appendChild(heading);
   if(record.nativeReference&&!local){
     const provenance=d.createElement('span');
     provenance.textContent=(tr('documentSnapshot')+' — ')+String(item.source||'')+' · '+String(item.release||'');
     header.appendChild(provenance);
   }
   // This is a separate business command: the ISO form itself stays read-only.
   if(!local&&!record.nativeReference&&record.kind==='standard'&&windowedActive&&
      !root.__radarApplicationProfile?.viewer&&root.__radarApplicationProfile?.allows('catalog.declareReference')===true&&
      root.__radarCatalogPersistence?.status?.().importedCatalogs===1){
     const use=d.createElement('button');use.type='button';use.className='w2ui-btn';
     use.textContent=tr('addToCatalog');
     const feedback=d.createElement('span');feedback.setAttribute('role','status');
     use.addEventListener('click',async()=>{
       use.disabled=true;
       try{
         const result=await root.__radarCatalogPersistence.importIsoReference(String(record.isoId));
         feedback.textContent=tr(result.action==='existing'?'referenceAlreadyPresent':'referenceIntegrated');
         refresh();
       }catch(error){feedback.textContent=String(error?.message||error);}
       finally{use.disabled=false;}
     });
     const browse=d.createElement('button');browse.type='button';browse.className='w2ui-btn';
     browse.textContent=tr('viewReferences');
     browse.addEventListener('click',()=>{root.w2popup.close();openReferences();});
     header.appendChild(use);header.appendChild(browse);header.appendChild(feedback);
   }
   // C3: explicit, bounded lookup within the local ISO cache. No HTTP access.
   // C3-R2: also visible from an ISO snapshot kept in the business catalog; read-only.
   const editionLanguage=String(root.i18next?.language||'fr').slice(0,2);
   const editionFamily=typeof isoEditionSeries!=='undefined'&&isoEditionSeries?.family?.(item.reference);
   if(!local&&record.kind==='standard'&&editionFamily){
     const editions=d.createElement('button');editions.type='button';editions.className='w2ui-btn';
     editions.setAttribute('data-iso-editions','');
     editions.textContent=editionLanguage==='fr'?'Éditions et documents liés':'Editions and related documents';
     editions.addEventListener('click',async()=>{
       editions.disabled=true;
       const panel=d.createElement('dialog');panel.setAttribute('aria-label',editions.textContent+' — '+editionFamily);
       panel.style.cssText='width:min(960px,94vw);max-height:82vh;overflow:auto;padding:18px;background:white;color:#222';
       const title=d.createElement('h2');title.textContent=editions.textContent+' — ISO '+editionFamily;panel.appendChild(title);
       const body=d.createElement('div');body.setAttribute('role','status');body.textContent=editionLanguage==='fr'?'Recherche dans le cache ISO local…':'Searching local ISO cache…';panel.appendChild(body);
       const exit=d.createElement('button');exit.type='button';exit.className='w2ui-btn';exit.textContent=tr('close');exit.addEventListener('click',()=>panel.close());panel.appendChild(exit);
       panel.addEventListener('close',()=>{panel.remove();editions.disabled=false;});d.body.appendChild(panel);
       if(typeof panel.showModal==='function')panel.showModal();else panel.setAttribute('open','');
       try{
         const candidates=[item],source=root.__radarIsoWindowed,seenPages=new Set();let after=null,complete=true;
         // Resolve explicit relations by ISO IDs before searching the standard family.
         if(windowedActive&&source?.get){
           for(const id of [...new Set([...(item.replaces||[]),...(item.replacedBy||[])].map(String))].slice(0,100)){
             const match=await source.get({type:'deliverables',id});if(match)candidates.push(match);
           }
         }
         if(windowedActive&&source?.page){
           for(let i=0;i<5;i++){
             const result=await source.page({type:'deliverables',search:isoEditionSeries.family(item.reference),limit:100,after});
             if(!Array.isArray(result?.records))throw Error('Réponse du cache ISO invalide');
             candidates.push(...result.records);if(!result.next){after=null;break;}
             const next=JSON.stringify(result.next);if(seenPages.has(next))throw Error('Pagination ISO répétée');seenPages.add(next);after=result.next;
           }
           if(after)complete=false;
         }else if(!windowedActive){candidates.push(...isoDeliverables);}
         const grouped=isoEditionSeries.collect(item,candidates),relations=isoEditionSeries.relations(item,candidates);
         body.replaceChildren();
         const note=d.createElement('p');note.textContent=editionLanguage==='fr'
           ?'Notices retrouvées dans le cache ISO local ; cette liste peut être incomplète. Consultation seule, sans acquisition réseau.'
           :'Records found in the local ISO cache; the list may be incomplete. Read-only; no network acquisition.';
         body.appendChild(note);
         if(!complete){const limited=d.createElement('p');limited.textContent=editionLanguage==='fr'?'Limite de recherche locale atteinte.':'Local search limit reached.';body.appendChild(limited);}
         const groups=[['edition',editionLanguage==='fr'?'Éditions':'Editions'],['corrigendum',editionLanguage==='fr'?'Rectificatifs':'Corrigenda'],['amendment',editionLanguage==='fr'?'Amendements':'Amendments'],['project',editionLanguage==='fr'?'Projets':'Projects']];
         for(const [kind,heading] of groups){
           const rows=grouped.rows.filter(row=>row.kind===kind);if(!rows.length)continue;
           const section=d.createElement('section');section.setAttribute('data-iso-kind',kind);
           const groupTitle=d.createElement('h3');groupTitle.textContent=heading+' ('+rows.length+')';section.appendChild(groupTitle);
           const list=d.createElement('ul');section.appendChild(list);
           for(const row of rows){
             const li=d.createElement('li');li.textContent=row.reference+(row.edition!=null?' · '+(editionLanguage==='fr'?'édition ':'edition ')+row.edition:'')+(row.date?' · '+row.date:'');
             if(row.id!=null&&String(row.id)!==String(item.id)){
               const open=d.createElement('button');open.type='button';open.className='w2ui-btn';open.textContent=tr('detail');
               open.addEventListener('click',()=>{pendingNext={kind:'standard',isoId:row.id,isoItem:row.item,nativeReference:false};panel.close();root.w2popup.close();});li.appendChild(open);
             }
             list.appendChild(li);
           }
           body.appendChild(section);
         }
         const relationTitle=d.createElement('h3');relationTitle.textContent=tr('grpRelations');body.appendChild(relationTitle);
         if(!relations.length){const empty=d.createElement('p');empty.textContent=editionLanguage==='fr'?'Aucune relation explicite dans cette notice.':'No explicit relationship in this record.';body.appendChild(empty);}
         for(const edge of relations){
           const line=d.createElement('p');line.setAttribute('data-iso-relation',edge.direction);
           line.textContent=(edge.direction==='replaces'?tr('replaces'):tr('replacedBy'))+' : '+(edge.record?.reference||(editionLanguage==='fr'?'Notice ISO n° ':'ISO record #')+edge.id+' — '+(editionLanguage==='fr'?'référence non résolue dans le cache':'reference unresolved in cache'));
           // The URL derives from a source ID; it does not prove that the page exists.
           if(!edge.record&&/^\d{1,9}$/.test(edge.id)){
             const link=d.createElement('a');link.href='https://www.iso.org/standard/'+edge.id+'.html';
             link.target='_blank';link.rel='noopener noreferrer';link.textContent=editionLanguage==='fr'?' · Consulter ISO (lien non vérifié)':' · View ISO (unverified link)';line.appendChild(link);
           }
           body.appendChild(line);
         }
         if(!grouped.rows.length){const empty=d.createElement('p');empty.textContent=editionLanguage==='fr'?'Aucune édition retrouvée dans le cache.':'No edition found in cache.';body.appendChild(empty);}
       }catch(error){body.textContent=(editionLanguage==='fr'?'Consultation ISO impossible : ':'ISO lookup failed: ')+String(error?.message||error);}
     });
     header.appendChild(editions);
   }
   const close=d.createElement('button');close.type='button';close.textContent=tr('close');close.className='w2ui-btn';header.appendChild(close);wrapper.appendChild(header);
   const container=d.createElement('div');container.style.cssText='flex:1;min-height:0;overflow:hidden';wrapper.appendChild(container);
   const line=v=>String(v??'').replace(/\r\n?/g,'\n').replace(/\\n/g,'\n').trim();
   const list=v=>Array.isArray(v)?v.map(x=>typeof x==='object'?JSON.stringify(x):String(x)).join(', '):v==null?'':typeof v==='object'?JSON.stringify(v):String(v);
   const localized=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
   const titles=localized(item.titleI18n),scopes=localized(item.scopeI18n);
   // C3-R3: the main detail must use the same ISO-ID evidence as the
   // editions dialog. A missing synchronous list entry is not proof that
   // a record is absent from the windowed IndexedDB cache.
   const relationIds=[...new Set([...(Array.isArray(item.replaces)?item.replaces:[]),...(Array.isArray(item.replacedBy)?item.replacedBy:[])].map(String))].slice(0,100);
   const relationRecords=new Map();
   // A published/native ISO snapshot is self-contained: do not consult the
   // global ISO catalogue for documentary relations in Viewer mode.
   if(!record.nativeReference){
     for(const id of relationIds){const hit=findDeliverable(id);if(hit)relationRecords.set(id,hit);}
   }
   const resolvedRelation=id=>record.nativeReference?String(id):(relationRecords.get(String(id))?.reference||tr('missingReference',{id}));
   const resolveRelations=ids=>Array.isArray(ids)?ids.map(resolvedRelation).join('\n'):'';
   let recordData={
     reference:item.reference||'',titleFr:line(titles.fr||(titles.en?'':item.title)),titleEn:line(titles.en),
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
     if(record.nativeReference&&name==='sourceData'){
       html.label=tr('storedData');html.group=tr('grpStored');
     }
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
   if(local){
     fields.length=0;
     recordData={nativeId:String(local.standardId||''),reference:String(local.designation||''),colTitle:String(local.name||''),nativeIssuer:String(local.issuer||''),edition:String(local.editionDesignation||''),nativeSource:String(local.sourceName||''),nativeUrl:String(local.sourceUrl||''),nativeOrigin:tr(({manual:'nativeManual','iso-open-data':'nativeIso',legacy:'nativeLegacy','rfc-editor':'nativeRfc',w3c:'nativeW3c'})[local.origin]||'nativeUnknown'),colProvenance:tr(({unverified:'nativeUnverified','source-verified':'nativeVerified'})[local.verification]||'nativeUnknown')};
     if(local.externalDocument){recordData.nativeDocumentStatus=String(local.externalDocument.status||'');recordData.nativeAcquired=String(local.externalDocument.acquiredAt||'');}
     for(const key of Object.keys(recordData))field(key,key,key==='nativeUrl'?'textarea':'text','',0,60);
   }
   const name='isoStandardReadOnlyForm';
   function dispose(){
     if(disposed)return;disposed=true;
     if(activeDetailRecord===detail)activeDetailRecord=null;
     if(activeDetailCleanup===dispose)activeDetailCleanup=null;
     try{form?.destroy?.();}catch(_){/* already cleaned up */}
     wrapper.remove();
   }
   activeDetailCleanup=dispose;
   function mountForm(){
     if(disposed)return;
     const host=d.getElementById('iso-standard-detail-popup-body');
     if(!host){dispose();if(status)status.textContent=tr('readOnlyUnavailable');return;}
     host.appendChild(style);host.appendChild(wrapper);
     try{
       root.w2ui?.[name]?.destroy?.();
       form=new root.w2form({name,style:'border:0;background:transparent',
         tabs:local?[{id:'details',text:tr('nativeTitle')}]:[{id:'details',text:tr('formTab')},record.nativeReference?{id:'raw',text:tr('storedTab')}:{id:'raw',text:tr('rawTab')}],
         fields,record:recordData,actions:{}});
       form.render(container);
       root.__radarFormAutoheight?.schedule?.();
     }catch(error){
       if(status)status.textContent='Erreur d’ouverture w2form : '+String(error?.message||error);
       root.w2popup.close();
     }
   }
   root.w2popup.open({
     title:escapeHtml(item.reference||tr('formTitle')),
     width:1000,height:780,
     body:'<div id="iso-standard-detail-popup-body" style="height:100%;overflow:hidden"></div>',
     onOpen(event){event.onComplete=mountForm;},
     onClose(event){
       const finish=()=>{dispose();const next=pendingNext;pendingNext=null;if(next)showDetail(next);};
       if(event)event.onComplete=finish;else finish();
     }
   });
   close.addEventListener('click',()=>root.w2popup.close());
   // Reconcile visible relations with the same get-by-ID cache used by
   // « Editions and related documents ». Never fetch across the network.
   // Guard the dialog lifecycle: a late IndexedDB result cannot update a
   // closed/replaced form, or the business catalog.
   const relationSource=root.__radarIsoWindowed;
   if(!local&&!record.nativeReference&&relationIds.length&&windowedActive&&typeof relationSource?.get==='function'){
     Promise.all(relationIds.map(async id=>{
       try{
         const hit=await relationSource.get({type:'deliverables',id});
         if(hit&&String(hit.id)===id&&typeof hit.reference==='string'&&hit.reference.trim())return {id,hit};
       }catch(_){/* an unavailable cache row remains explicitly unresolved */}
       return {id,hit:null};
     })).then(results=>{
       if(disposed||activeDetailRecord!==detail)return;
       for(const {id,hit} of results)if(hit)relationRecords.set(id,hit);
       if(!form)return;
       form.record.replaces=resolveRelations(item.replaces);
       form.record.replacedBy=resolveRelations(item.replacedBy);
       form.refresh?.();
     }).catch(()=>{/* Never interrupt ISO documentary consultation. */});
   }
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
           if(status&&isoModes.includes(mode)&&p.processed%3000===0)status.textContent='Indexation ICS/TC-SC : '+p.processed+' notices';
         }}).then(result=>{
           if(result.ready&&(mode==='ics'||mode==='committees'))windowPage('reset');
           return result;
         }).catch(e=>{if(status&&isoModes.includes(mode))status.textContent='Index ICS/TC-SC indisponible : '+e.message;})
           .finally(()=>{groupIndexBuild=null;});
       }
     }else{
       const provider=root.__radarIsoOpenData;
       if(provider)[isoDeliverables,isoCommittees,isoSync]=await Promise.all([
         provider.readAll('deliverables'),provider.readAll('committees'),provider.syncInfo()]);
     }
     sidebarIndex=null;sidebarInputs=null;
   }catch(e){if(status&&isoModes.includes(mode))status.textContent='Cache ISO indisponible : '+e.message;}
   finally{isoLoading=false;refresh();}
 }
 function referenceRows(term,origin='all'){
   if(root.__radarApplicationProfile?.viewer||root.__radarCatalogPersistence?.status?.().importedCatalogs===1){
     if(root.__radarCatalogPersistence?.status?.().importedCatalogs!==1)return [];
     const query=norm(String(term||''));
     const active=root.__radarApplicationProfile?.published
       ?root.__radarCatalogAdapter?.getRevision?.(root.__radarRevisionSession?.status?.().activeGroup):null;
     const allowed=root.__radarApplicationProfile?.published?new Set((active?.blips||[]).map(b=>b.standardId)):null;
     return root.__radarCatalogPersistence.listReferenceRecords().filter(r=>{
       if(allowed&&!allowed.has(r.standardId))return false;
       if(origin!=='all'&&r.origin!==origin)return false;
       const doc=r.isoDocument;
       return !query||norm([r.standardId,r.name,r.issuer,r.designation,r.editionDesignation,r.sourceName,r.sourceUrl,r.origin,r.verification,
         doc?.title,...Object.values(doc?.titleI18n||{}),doc?.scope,...Object.values(doc?.scopeI18n||{}),
         ...(Array.isArray(doc?.icsCodes)?doc.icsCodes:[]),doc?.ownerCommittee,doc?.currentStage,doc?.release,r.externalDocument?.status,r.externalDocument?.stream].filter(Boolean).join(' ')).includes(query);
     });
   }
   try{return root.__radarStandardRegistry?.records(term,1000)||[];}
   catch(e){if(status)status.textContent=e.message;return [];}
 }

 // S16-A-R2: the W2UI toolbar owns the visible navigation and action commands.
 // Legacy ISO/native controls remain delegated implementation details (and a fallback
 // when an older host does not provide w2toolbar). Search/facets remain compact inputs.
 const isoModes=['ics','committees','iso-list','rss','changes'];
 const documentaryModes=['rfc-editor','w3c','omg-specifications','resources'];
 const isDocumentary=()=>documentaryModes.includes(mode);
 const sourceApi=()=>root.__radarStandardSources;
 const canIntegrate=()=>!root.__radarApplicationProfile?.viewer&&root.__radarApplicationProfile?.allows('catalog.declareReference')===true&&root.__radarCatalogPersistence?.status?.().importedCatalogs===1;
 function currentSource(){return isoModes.includes(mode)?'iso-open-data':mode;}
 function navigateMode(id){
   if(root.__radarApplicationProfile?.viewer&&id!=='references')return;
   if(!isoModes.includes(id)&&!documentaryModes.includes(id)&&id!=='references')return;
   toolbarState.clear();windowToken++;documentToken++;documentBusy=false;documentMessage='';documentOffset=0;documentSeries=null;documentOmgAdoptions=false;documentOmgFamily=null;documentResult=null;mode=id;selected=null;if(search)search.value='';refresh();if(mode==='ics')void loadIcs();if(mode==='omg-specifications'&&!sourceApi()?.omgStatus())void documentaryAction(sourceApi()?.omgHasLocalRelay?.()?'omgRestore':'omgPublished');
 }
 function sourceItems(){
   const entries=(sourceApi()?.listResources?.()||[]).filter(r=>['iso-open-data','rfc-editor','w3c','omg-specifications'].includes(r.id));
   return [...entries.map(r=>({id:r.id,text:r.id==='omg-specifications'?'OMG':r.label})),{id:'references',text:tr('modeReferences')},{id:'resources',text:tr('resourceInventory')}];
 }
 function isoViewItems(){return [['iso-list','modeIsoList'],['ics','modeIcs'],['committees','modeCommittees'],['rss','modeRss'],['changes','modeChanges']].map(([id,label])=>({id,text:tr(label)}));}
 function acquisitionItems(){const items=isoModes.includes(mode)?[['reload','refresh'],['sync','sync'],['distributed','distributedSync'],['manageIso','resourceIsoManage'],['isoImport','import'],...(mode==='rss'?[['rssLoad','rssSync']]:[]),...(mode==='changes'?[['changesLoad','changesLoad']]:[])]:mode==='rfc-editor'||mode==='w3c'?[['load','resourceLoad'],['refreshSource','resourceRefresh']]:mode==='omg-specifications'?[[ 'omgPublished','resourceOmgPublished'],...(sourceApi()?.omgHasLocalRelay?.()?[['omgOnline','resourceOmgOnline']]:[]),...(sourceApi()?.omgHasLocalRelay?.()?[['omgPrepared','resourceOmgPrepared']]:[]),['omgRestore','resourceOmgRestore'],...(documentOmgFamily?[['omgHistoryRefresh','resourceOmgHistoryRefresh'],...(sourceApi()?.omgStatus()?.origin==='published-links'?[]:[['omgHistoryExport','resourceOmgHistoryExport']])]:[]),['omgHistoryImport','resourceOmgHistoryImport'],['omgImport','resourceImport'],['omgClear','resourceClear']]:[];return items.map(([id,label])=>({id,text:tr(label),disabled:documentBusy||(id==='isoImport'&&['rss','changes'].includes(mode))}));}
 function omgViewItems(){return [{id:'specifications',text:tr('resourceOmgSpecs')},{id:'adoptions',text:tr('resourceOmgAdoptions')}];}
 function toolbarItems(){return [
   {type:'menu-radio',id:'source',text:tr('resourceSelector'),selected:currentSource(),items:sourceItems()},
   {type:'break',id:'source-divider'},
   {type:'menu-radio',id:'isoView',text:tr('modeIsoList'),selected:mode,items:isoViewItems(),hidden:true},
   {type:'menu-radio',id:'omgView',text:tr('resourceOmgSpecs'),selected:'specifications',items:omgViewItems(),hidden:true},
   {type:'menu',id:'acquisition',text:tr('standardSources'),items:[],hidden:true},
   ...[['advanced','advancedSearch'],['history','resourceOmgHistory'],['versions','resourceVersions'],['back','resourceBack'],['previous','resourcePrevious'],['next','resourceNext'],['details','resourceDetails'],['context','resourceContext'],['integrate','addToCatalog'],['openSource','resourceOpen'],['declare','declareLocal'],['lifecycle','referenceLifecycle'],['addRadar','add'],['sourceDialog','standardSources']].map(([id,label])=>({type:'button',id,text:tr(label),hidden:true}))
 ];}
 function selectedDocument(){return grid?.records?.find(r=>r.recid===(grid.getSelection?.()[0]||selected))||null;}
 // S17: one toolbar command for records from every supported documentary source.
 async function openSelectedDocumentaryRecord(){
   const row=selectedDocument();if(!row||!['ics','committees','iso-list','references'].includes(mode))return;
   if(mode==='references'){
     // The w2grid projects compact display columns, not the complete native record.
     // Resolve through the scope-aware registry before opening the read-only form.
     const record=referenceRows('', 'all').find(r=>r.standardId===row.standardId);
     if(!record)return;
     if(record.isoDocument)showDetail({kind:'standard',isoId:record.isoDocument.id,isoItem:record.isoDocument,nativeReference:true});
     else showDetail({kind:'local',localReference:record,nativeReference:true});
     return;
   }
   if(row.kind!=='standard'||!row.isoId)return;
   const isoId=row.isoId,view=mode;
   if(windowedActive&&root.__radarIsoWindowed?.get){
     try{const item=await root.__radarIsoWindowed.get({type:'deliverables',id:isoId});
       if(mode===view&&selectedDocument()?.isoId===isoId)showDetail(item?{kind:'standard',isoId,isoItem:item}:{kind:'standard',isoId});
     }catch(error){if(status)status.textContent=String(error.message||error);}
   }else showDetail({kind:'standard',isoId});
 }

 function setToolbarItem(id,patch){const signature=JSON.stringify(patch),key=id+':'+Object.keys(patch).join(',');if(toolbarState.get(key)===signature)return;toolbarState.set(key,signature);standardsToolbar.set(id,patch);}
 function updateToolbar(){
   if(!standardsToolbar)return;
   const source=currentSource(),doc=isDocumentary(),row=selectedDocument(),ext=mode==='rfc-editor'||mode==='w3c',omg=mode==='omg-specifications',inventory=mode==='resources',native=mode==='references',iso=isoModes.includes(mode);
   const item=sourceItems().find(x=>x.id===source);
   setToolbarItem('source',{text:tr('resourceSelector')+' : '+(item?.text||source),selected:source,items:sourceItems()});
   const visible=new Set(iso?['advanced',...(['ics','committees','iso-list'].includes(mode)?['details']:[])]:native?['details','declare','lifecycle','addRadar','sourceDialog']:ext?['details','openSource','previous','next',...(mode==='rfc-editor'?['integrate','context']:documentSeries?['back','integrate']:['versions'])]:omg?['details','openSource','previous','next','integrate',...(documentOmgFamily?['back']:['history'])]:inventory?['details','openSource']:[]);
   setToolbarItem('isoView',{text:isoViewItems().find(x=>x.id===mode)?.text||tr('modeIsoList'),selected:mode,items:isoViewItems(),hidden:!iso});
   setToolbarItem('omgView',{text:tr(documentOmgAdoptions?'resourceOmgAdoptions':'resourceOmgSpecs'),selected:documentOmgAdoptions?'adoptions':'specifications',items:omgViewItems(),hidden:!omg||!!documentOmgFamily});
   setToolbarItem('acquisition',{text:tr('standardSources'),items:acquisitionItems(),hidden:!iso&&!ext&&!omg,disabled:documentBusy});
   for(const def of toolbarItems().slice(5))setToolbarItem(def.id,{text:def.text,hidden:!visible.has(def.id)});
   const disabled=new Set();
   if(!row){for(const id of ['details','context','versions','history','integrate'])disabled.add(id);}
   if(!canIntegrate()){for(const id of ['integrate','declare','lifecycle','sourceDialog','addRadar'])disabled.add(id);}
   if(native&&!row){disabled.add('lifecycle');disabled.add('addRadar');}
   if(!doc||documentOffset===0)disabled.add('previous');
   if(!documentResult||documentOffset+100>=documentResult.total)disabled.add('next');
   if(documentBusy){for(const id of ['load','refreshSource','history','versions','previous','next','integrate','context','omgImport','omgRestore','omgPublished','omgOnline','omgPrepared','omgHistoryRefresh','omgHistoryImport','omgHistoryExport','omgClear'])disabled.add(id);}
   if(mode==='rss'||mode==='changes')disabled.add('isoImport');
   for(const id of visible)setToolbarItem(id,{disabled:disabled.has(id),checked:isoModes.includes(id)&&id===mode});
   // The former DOM buttons are not visible when the toolbar exists. The search
   // and ISO/native facet/window controls are retained until their own migration.
   for(const selector of ['[data-catalog-mode]','[data-standard-source-shortcut]','[data-standard-sources]','[data-native-declare]','[data-reference-lifecycle]','[data-iso-import]','[data-catalog-distribution]','[data-r2-legacy-action]'])for(const el of mount?.querySelectorAll(selector)||[])el.style.display='none';
   if(advancedButton)advancedButton.style.display='none';
   const filters=mount?.querySelector('[data-iso-more-filters]');if(filters&&doc)filters.style.display='none';
 }
 function documentColumns(fields){return fields.map(([field,label,size])=>({field,text:tr(label),size,sortable:false,render:r=>({html:escapeHtml(r[field])})}));}
 function renderDocumentary(){
   refreshSidebar();const api=sourceApi(),term=search?.value||'';let records=[],info=null,total=0;const inventory=mode==='resources';
   if(search)search.placeholder=tr('resourceSearch');
   try{
     if(inventory){const q=norm(term);const all=(api?.listResources?.()||[]).filter(r=>!q||norm([r.label,r.providerLabel,r.kind,r.id].join(' ')).includes(q));total=all.length;records=all.map(r=>({recid:r.id,designation:r.label,title:r.providerLabel,kind:r.kind,access:r.access.type,connector:r.connector,resource:r}));grid.columns=documentColumns([['designation','resourceSource','27%'],['title','nativeIssuer','25%'],['kind','resourceType','20%'],['access','resourceAccess','18%'],['connector','resourceConnector','180px']]);}
     else{
       const omg=mode==='omg-specifications',result=omg?(documentOmgFamily?api.searchOmgHistory(documentOmgFamily,term,documentOffset):api.searchOmg(term,documentOffset,documentOmgAdoptions)):api.search(mode,term,documentSeries,documentOffset);documentResult=result;total=result.total;
       info=omg?(documentOmgFamily?api.omgHistoryStatus(documentOmgFamily):api.omgStatus()):api.status(mode,documentSeries);records=result.rows.map(r=>({...r,recid:r.key,isoAdoptionsText:(r.isoAdoptions||[]).join(', ')}));
       const fields=[['designation','colRef','160px'],['title','colTitle','42%'],['edition','colEdition','135px'],['status','nativeDocumentStatus','150px']];
       if(mode==='rfc-editor')fields.push(['stream','resourceFlow','140px']);
       if(omg)fields.push(['publicationDate','resourceDate','110px'],['isoAdoptionsText','resourceIsoAdoption','210px']);
       grid.columns=documentColumns(fields);
     }
   }catch(error){documentMessage=tr('resourceError')+' : '+String(error.message||error);}
   const previous=selected;grid.clear(true);grid.records=records;grid.total=records.length;grid.buffered=records.length;grid.refresh();selected=null;
   if(previous&&records.some(r=>r.recid===previous)){grid.select?.(previous);selected=previous;}
   const detail=info?[''+total+' '+tr('resourceRows'),tr('resourcePage')+' '+(Math.floor(documentOffset/100)+1),info.acquiredAt||tr('resourceLocalNoDate'),info.storage||'',info.origin?tr(({"local-unverified":'resourceOmgLocal',"official-fetch":'resourceOmgOfficial',"local-relay":'resourceOmgRelay',"local-prepared":'resourceOmgPreparedOrigin','published-links':'resourceOmgPublic'})[info.origin]||'colProvenance'):'',info.coverage?(info.coverage.complete?tr('resourceComplete'):tr('resourcePartial')+' ('+info.coverage.rejected+')'):''].filter(Boolean).join(' · '):inventory?total+' '+tr('resourceRows'):mode==='omg-specifications'?tr('resourceOmgEmpty'):tr('resourceEmpty');
   if(status)status.textContent=(documentBusy?tr('resourceLoading')+' · ':'')+detail+(documentSeries?' · '+documentSeries:'')+(mode==='omg-specifications'?' · '+tr(info?.distribution==='public-links-only'?'resourceOmgPublic':'resourceOmgDataset'):'')+(documentMessage?' · '+documentMessage:'');
   const nav=mount?.querySelector('[data-iso-window-navigator]');if(nav)nav.style.display='none';updateModeButtons();
 }
 async function documentaryAction(action){
   if(root.__radarApplicationProfile?.viewer)return;
   const api=sourceApi(),view=mode,row=selectedDocument();let token=documentToken,started=false,failed=false;
   if(documentBusy&&['previous','next','load','refreshSource','versions','context','integrate','history','omgImport','omgRestore','omgPublished','omgOnline','omgPrepared','omgHistoryRefresh','omgHistoryImport','omgHistoryExport','omgClear'].includes(action))return;
   if(action.startsWith('omg')&&view!=='omg-specifications')return;
   try{
     if(action==='previous'||action==='next'){if(documentBusy||!documentResult||(action==='next'&&documentOffset+100>=documentResult.total)||(action==='previous'&&documentOffset===0))return;documentOffset=Math.max(0,documentOffset+(action==='previous'?-100:100));selected=null;renderDocumentary();return;}
     if(action==='back'){documentToken++;documentBusy=false;documentSeries=null;documentOmgFamily=null;documentOffset=0;selected=null;documentMessage='';search.value='';renderDocumentary();return;}
     if(action==='openSource'){const url=row?.resource?.access?.url||row?.url||(view==='w3c'&&row?.key&&!documentSeries?api.W3C+'/'+encodeURIComponent(row.key):api.getResource(view)?.access?.url);if(url&&new URL(url).protocol==='https:')root.open?.(url,'_blank','noopener,noreferrer');return;}
     if(action==='history'){
       if(view!=='omg-specifications'||documentOmgFamily||!row?.acronym)throw Error(tr('resourceSelect'));
       documentBusy=true;started=true;token=++documentToken;documentMessage='';updateToolbar();
       if(api.omgStatus()?.origin==='published-links')await api.loadOmgPublishedHistory(row.acronym);else await api.loadOmgHistory(row.acronym);
       if(token===documentToken&&mode===view){documentOmgFamily=row.acronym;documentOmgAdoptions=false;documentOffset=0;selected=null;search.value='';}return;
     }
     if(action==='omgHistoryRefresh'){
       if(view!=='omg-specifications'||!documentOmgFamily)throw Error(tr('resourceSelect'));
       documentBusy=true;started=true;token=++documentToken;documentMessage='';updateToolbar();
       if(api.omgStatus()?.origin==='published-links')await api.loadOmgPublishedHistory(documentOmgFamily);else await api.loadOmgHistory(documentOmgFamily,{refresh:true});
       if(token===documentToken&&mode===view){documentOffset=0;selected=null;}return;
     }
     if(action==='omgHistoryImport'){omgFile?.click();return;}
     if(action==='omgHistoryExport'){
       if(view!=='omg-specifications'||!documentOmgFamily)throw Error(tr('resourceSelect'));
       const json=await api.exportOmgHistory(documentOmgFamily);
       const blob=new Blob([json],{type:'application/json'});
       const url=URL.createObjectURL(blob);
       try{const a=root.document.createElement('a');a.href=url;a.download='S16-OMG-History-'+documentOmgFamily.replace(/\//g,'-')+'.json';a.style.display='none';root.document.body.appendChild(a);a.click();a.remove();}
       finally{root.setTimeout?.(()=>URL.revokeObjectURL(url),1000);}
       return;
     }
     if(action==='omgImport'){omgFile?.click();return;}
     if(action==='omgPublished'){documentBusy=true;started=true;token=++documentToken;documentMessage='';updateToolbar();await api.loadOmgPublished();if(token===documentToken&&mode===view){selected=null;documentOffset=0;}return;}
     if(action==='omgOnline'||action==='omgPrepared'){documentBusy=true;started=true;token=++documentToken;documentMessage='';updateToolbar();
       if(action==='omgOnline')await api.loadOmgOnline();else await api.loadOmgPrepared();
       if(token===documentToken&&mode===view){selected=null;documentOffset=0;}return;
     }
     if(action==='omgRestore'){documentBusy=true;started=true;token=++documentToken;documentMessage='';updateToolbar();await api.restoreOmg();if(token===documentToken&&mode===view){selected=null;documentOffset=0;}return;}
     if(action==='omgClear'){documentBusy=true;started=true;token=++documentToken;documentMessage='';updateToolbar();const cleared=await api.clearOmg();if(token===documentToken&&mode===view){selected=null;documentOffset=0;if(root.indexedDB&&!cleared)documentMessage=tr('resourceCacheClearFailed');}return;}
     if(action==='details'){if(!row)throw Error(tr('resourceSelect'));showDocumentaryDetail(row);return;}
     if(action==='integrate'){
       if(!canIntegrate())throw Error(tr('resourceNoCatalog'));if(!row||!documentResult?.generation||(view==='w3c'&&!documentSeries)||!['rfc-editor','w3c','omg-specifications'].includes(view))throw Error(tr('resourceVersionRequired'));
       const result=view==='omg-specifications'?root.__radarCatalogPersistence.importOmgReference(row.key,documentResult.generation,{family:documentOmgFamily}):root.__radarCatalogPersistence.importSourceReference(view,row.key,documentResult.generation);navigateMode('references');nativeOriginFilter.value='all';refresh();grid.select?.(result.standardId);selected=result.standardId;updateToolbar();if(status)status.textContent=tr(result.action==='existing'?'externalExisting':'externalAdded');return;
     }
     if(documentBusy)return;
     if(action==='context'){
       if(view!=='rfc-editor'||!row)throw Error(tr('resourceSelect'));documentBusy=true;started=true;token=++documentToken;updateToolbar();const result=await api.readRfcContext(row.key);if(token===documentToken&&mode===view){documentBusy=false;showDocumentaryDetail({...row,context:result});}return;
     }
     if(!['load','refreshSource','versions'].includes(action)||!['rfc-editor','w3c'].includes(view))return;
     let series=documentSeries;
     if(action==='versions'){if(view!=='w3c'||!row||documentSeries)throw Error(tr('resourceSelect'));series=row.key;}
     documentBusy=true;started=true;documentMessage='';token=++documentToken;updateToolbar();if(status)status.textContent=tr('resourceLoading');
     const opts={refresh:action==='refreshSource',reload:action==='load'};
     if(series)await api.loadVersions(series,opts);else await api.load(view,opts);
     if(token!==documentToken||mode!==view)return;
     documentSeries=series;documentOffset=0;selected=null;if(action==='versions')search.value='';
   }catch(error){failed=true;if(token===documentToken&&mode===view)documentMessage=tr('resourceError')+' : '+String(error.message||error);}
   finally{if((started||failed)&&token===documentToken&&mode===view&&isDocumentary()){if(started)documentBusy=false;renderDocumentary();}}
 }
 function showDocumentaryDetail(row){
   if(!root.w2popup||typeof root.w2popup.open!=='function')throw Error(tr('readOnlyUnavailable'));
   const resource=row.resource,info=mode==='omg-specifications'?sourceApi().omgStatus():sourceApi().status(mode,documentSeries);
   const values=resource?[[tr('resourceSource'),resource.label],[tr('nativeIssuer'),resource.providerLabel],[tr('resourceType'),resource.kind],[tr('resourceAccess'),resource.access.type],[tr('resourceSourceUrl'),resource.access.url],[tr('resourceConnector'),resource.connector],...Object.entries(resource.capabilities).map(([k,v])=>[k,v.availability+' / '+v.implementation+(v.mapping?' — '+v.mapping:'')])]:[[tr('colRef'),row.designation],[tr('colTitle'),row.title],[tr('colEdition'),row.edition],[tr('nativeDocumentStatus'),row.status],[tr('nativeIssuer'),row.issuer],[tr('resourceFlow'),row.stream],[tr('resourceDate'),row.publicationDate],[tr('resourceIsoAdoption'),row.isoAdoptionsText],[tr('resourceOmgHistoryView'),row.historyEvidence],[tr('resourceSourceUrl'),row.url||(mode==='w3c'&&!documentSeries&&row.key?sourceApi().W3C+'/'+encodeURIComponent(row.key):null)],[tr('nativeAcquired'),info?.acquiredAt],[tr('resourceCache'),info?.storage],[tr('colProvenance'),info?.origin],[tr(info?.distribution==='public-links-only'?'resourceOmgPublic':'resourceOmgDataset'),mode==='omg-specifications'?info?.distribution:null],[tr('resourceContext'),row.context?JSON.stringify(row.context.fields,null,2):null]];
   // w2popup owns the window, w2form read-only fields own the detail presentation.
   const name='standardsDocumentDetail';const safeValues=values.filter(([,v])=>v!==null&&v!==undefined&&v!=='').map(([label,value],i)=>({key:'field'+i,label,value:String(value)}));
   root.w2popup.open({title:escapeHtml(resource?.label||row.designation||tr('resourceDetails')),width:850,height:600,body:'<div id="standards-document-detail" style="height:100%;overflow:auto"></div>',onOpen(event){event.onComplete=()=>{const target=root.document.getElementById('standards-document-detail');if(!target)return;root.w2ui?.[name]?.destroy?.();const form=new root.w2form({name,focus:-1,fields:safeValues.map(v=>({field:v.key,type:'textarea',html:{label:escapeHtml(v.label),span:5,attr:'readonly style="width:95%;height:55px"'}})),record:Object.fromEntries(safeValues.map(v=>[v.key,v.value])),actions:{}});form.render(target);};},onClose(){root.w2ui?.[name]?.destroy?.();}});
 }
 function initializeToolbar(host){
   if(typeof root.w2toolbar!=='function'||root.__radarApplicationProfile?.viewer)return;
   root.w2ui?.standardsToolbar?.destroy?.();
   toolbarState.clear();standardsToolbar=new root.w2toolbar({name:'standardsToolbar',items:toolbarItems(),onClick(event){const target=String(event.target||'');if(['source','isoView','omgView','acquisition'].includes(target))return;if(['acquisition:omgImport','acquisition:omgHistoryImport'].includes(target)&&mode==='omg-specifications'&&!documentBusy){omgFile?.click();return;}Promise.resolve().then(()=>{
     if(target.startsWith('source:')){const id=target.slice(7);navigateMode(id==='iso-open-data'?'iso-list':id);return;}
     if(target.startsWith('isoView:')){navigateMode(target.slice(8));return;}
     if(target.startsWith('omgView:')&&mode==='omg-specifications'&&!documentOmgFamily){documentOmgAdoptions=target==='omgView:adoptions';documentOffset=0;selected=null;search.value='';renderDocumentary();return;}
     const action=target.startsWith('acquisition:')?target.slice(12):target;
     if(isDocumentary()){void documentaryAction(action);return;}
     if(action==='details'){void openSelectedDocumentaryRecord();return;}
     if(action==='advanced'){advancedButton?.click();return;}
     if(action==='manageIso'){if(root.__radarApplicationProfile?.allows('catalog.admin')===true)root.__radarS14Z?.open?.();return;}
     const selectors={reload:'[data-r2-legacy-action="reload"]',sync:'[data-r2-legacy-action="sync"]',distributed:'[data-catalog-distribution]',isoImport:'[data-iso-import]',rssLoad:'[data-r2-legacy-action="rssLoad"]',changesLoad:'[data-r2-legacy-action="changesLoad"]',declare:'[data-native-declare]',lifecycle:'[data-reference-lifecycle]',addRadar:'[data-r2-legacy-action="addRadar"]',sourceDialog:'[data-standard-sources]'};
     if(selectors[action])mount?.querySelector(selectors[action])?.click();
   });}});standardsToolbar.render(host);mount.setAttribute('data-standards-w2ui','true');const style=root.document.createElement('style');style.textContent='[data-standards-w2ui] [data-s14-z-manage]{display:none!important}';host.parentElement?.appendChild(style);updateToolbar();
 }
 function updateModeButtons(){
   // These controls query the external ISO corpus, not the native references.
   if(advancedButton)advancedButton.style.display=mode==='references'?'none':'';
   const isoFilters=mount?.querySelector('[data-iso-more-filters]');if(isoFilters)isoFilters.style.display=mode==='references'?'none':'';
   if(nativeOriginFilter)nativeOriginFilter.style.display=mode==='references'?'':'none';
   const declareButton=mount?.querySelector('[data-native-declare]');if(declareButton)declareButton.style.display=mode==='references'?'':'none';
   const lifecycleButton=mount?.querySelector('[data-reference-lifecycle]');if(lifecycleButton){lifecycleButton.style.display=mode==='references'?'':'none';lifecycleButton.disabled=root.__radarCatalogPersistence?.status?.().importedCatalogs!==1||root.__radarApplicationProfile?.allows('catalog.declareReference')!==true;}
   const sourcesButton=mount?.querySelector('[data-standard-sources]');if(sourcesButton){sourcesButton.style.display=mode==='references'?'':'none';sourcesButton.disabled=root.__radarCatalogPersistence?.status?.().importedCatalogs!==1||root.__radarApplicationProfile?.allows('catalog.declareReference')!==true;}
   for(const btn of mount?.querySelectorAll('[data-standard-source-shortcut]')||[]){
     btn.disabled=root.__radarCatalogPersistence?.status?.().importedCatalogs!==1||root.__radarApplicationProfile?.allows('catalog.declareReference')!==true;
     btn.title=btn.disabled?tr('sourceNeedsCatalog'):btn.textContent;
   }
   for(const btn of mount?.querySelectorAll('[data-catalog-mode]')||[]){
     const active=btn.dataset.catalogMode===mode;
     btn.setAttribute('aria-pressed',String(active));btn.style.fontWeight=active?'bold':'normal';
   }
   updateToolbar();
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
         if(status&&isoModes.includes(mode)&&p.processed%3000===0)status.textContent=tr('sortLabel')+' : '+p.processed;
       }});
     }
     const result=await provider.page(options);
     if(token!==windowToken||mode!==view)return;
     windowNext=result.next;
     const projected=root.__radarIsoFullGrid.project(result.records,'');
     grid.clear(true);grid.records=projected;grid.total=projected.length;grid.buffered=projected.length;selected=null;grid.refresh();updateToolbar();
     if(status&&isoModes.includes(mode))status.textContent='ISO '+result.release+' · '+scopeLabel()+' · '+
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
     grid.clear(true);grid.records=combined;grid.total=combined.length;grid.buffered=combined.length;selected=null;grid.refresh();updateToolbar();
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
   if(root.__radarApplicationProfile?.viewer)mode='references';
   if(!grid)return;
   if(isDocumentary()){renderDocumentary();return;}
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
       {field:'stage',text:tr('colStage'),size:'80px'}
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
       {field:'stage',text:tr('colStage'),size:'75px'}
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
       {field:'reference',text:tr('colRef'),size:'170px',sortable:true,editable:{}},
       {field:'dataset',text:tr('colProvenance'),size:'110px',sortable:true,editable:{}},
       {field:'kindLabel',text:tr('changesKind'),size:'260px',sortable:true,editable:{}},
       {field:'fields',text:tr('changesFields'),size:'45%'}
     ];
     const found=q?changeRows.filter(x=>norm([x.reference,x.dataset,x.kindLabel,x.fields,x.id].join(' ')).includes(q)):changeRows;
     grid.clear(true);grid.records=found.map((r,i)=>({...r,recid:'change:'+i}));grid.total=grid.records.length;grid.buffered=grid.records.length;
     if(status)status.textContent=changeMessage||tr('changesEmpty');
   } else if(mode==='rss'){
     const q=norm(term);
     grid.columns=[
       {field:'published',text:tr('rssDate'),size:'160px',sortable:true,editable:{}},
       {field:'title',text:tr('colTitle'),size:'48%',sortable:true,editable:{}},
       {field:'feedName',text:tr('rssFeed'),size:'28%'},
       {field:'linkLabel',text:tr('rssOpen'),size:'85px',render:r=>r.url?{html:'<button type="button" data-rss-open="'+escapeHtml(r.url)+'">'+escapeHtml(tr('rssOpen'))+'</button>'}:''}
     ];
     const found=q?rssRows.filter(x=>norm([x.title,x.description,x.feedName,x.published].join(' ')).includes(q)):rssRows;
     grid.clear(true);grid.records=found.map((r,i)=>({...r,recid:'rss:'+i}));grid.total=grid.records.length;grid.buffered=grid.records.length;
     if(status)status.textContent=(rssMessage||(!rssRows.length?tr('rssEmpty'):rssRows.length+' RSS'));
   } else {
     refreshSidebar();
     grid.columns=[
       {field:'designation',text:tr('colRef'),size:'170px',sortable:true,editable:{},render:r=>({html:escapeHtml(r.designation)})},
       {field:'name',text:tr('colTitle'),size:'40%',sortable:true,editable:{},render:r=>({html:escapeHtml(r.name)})},
       {field:'edition',text:tr('colEdition'),size:'90px',sortable:true,editable:{},render:r=>({html:escapeHtml(r.edition)})},
       {field:'issuer',text:tr('nativeIssuer'),size:'110px',sortable:true,editable:{},render:r=>({html:escapeHtml(r.issuer)})},
       {field:'sourceName',text:tr('nativeSource'),size:'150px',sortable:true,editable:{},render:r=>({html:escapeHtml(r.sourceName)})},
       {field:'verification',text:tr('colProvenance'),size:'160px',sortable:true,editable:{},render:r=>({html:escapeHtml(tr(({unverified:'nativeUnverified','source-verified':'nativeVerified'})[r.verification]||'nativeUnknown'))})}
     ];
     const found=referenceRows(term,nativeOriginFilter?.value||'all');
     grid.clear(true);
     grid.records=found.map((r,i)=>({recid:r.standardId||String(i+1),standardId:str(r.standardId),designation:str(r.designation||r.name),name:str(r.isoDocument?.title||r.name),edition:str(r.editionDesignation),issuer:str(r.issuer),sourceName:str(r.sourceName),verification:str(r.verification),isoDocument:r.isoDocument||null}));
                   grid.total=grid.records.length;grid.buffered=grid.records.length;
       if(status)status.textContent=tr(root.__radarApplicationProfile?.viewer?'publishedReferenceCount':'nativeReferenceCount',{count:found.length});
   }
   const nav=mount?.querySelector('[data-iso-window-navigator]');if(nav)nav.style.display=windowedActive&&['ics','committees','iso-list'].includes(mode)?'inline-flex':'none';
   if(status&&localSyncMessage)status.textContent+=' · '+localSyncMessage;
   selected=null;
   grid.refresh();updateModeButtons();
   if(nativeOriginFilter)nativeOriginFilter.style.display=mode==='references'?'':'none';
   const declareButton=mount?.querySelector('[data-native-declare]');
   if(declareButton){declareButton.style.display=mode==='references'?'':'none';declareButton.disabled=root.__radarCatalogPersistence?.status?.().importedCatalogs!==1||root.__radarApplicationProfile?.allows('catalog.declareReference')!==true;}
   const importBtn=mount?.querySelector('[data-iso-import]');if(importBtn){importBtn.disabled=mode==='references'||mode==='rss'||mode==='changes';importBtn.title=mode==='committees'?'Importer iso_technical_committees (JSONLines)':mode==='ics'||mode==='iso-list'?'Importer iso_deliverables_metadata (JSONLines)':'Sélectionner une vue ISO pour importer';}
   updateToolbar();
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
   const api=root.__radarIsoRss;
   if(!api){
     rssMessage='Module RSS indisponible';
     refresh();
     return;
   }

   rssMessage=force
     ? 'Actualisation des flux RSS locaux…'
     : 'Lecture des flux RSS enregistrés…';

   if(mode==='rss')refresh();

   try{
     // No optional network request during application startup.
     // Explicit source-manager refresh remains available.
     const outcome=force?await api.syncLocal(true):null;
     rssRows=await api.readAll();

     rssMessage=outcome?.reason==='not-configured'
       ? tr('rssEmpty')
       : rssRows.length
         ? rssRows.length+' événements RSS en cache'
         : tr('rssEmpty');
   }catch(error){
     rssMessage='RSS : '+String(error?.message||error);
   }

   if(mode==='rss')refresh();
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
       // A8.1-R4: use embedded CSV through the standalone fetch adapter.
         let csvInput=url;
         const standalone=!!root.__radarStandalone;
         if(standalone){
           const response=await root.fetch(url);
           if(!response.ok)throw Error('ICS HTTP '+response.status);
           csvInput=await response.text();
         }
         const rows=await new Promise((resolve,reject)=>root.Papa.parse(csvInput,{download:!standalone,header:true,skipEmptyLines:true,
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
   const nativeOnly=!!root.__radarApplicationProfile?.viewer;
   if(nativeOnly){root.__radarApplicationProfile.require('radar.consult');mode='references';if(standardsToolbar){standardsToolbar.destroy?.();standardsToolbar=null;toolbarState.clear();}}
   registerI18n();
   graphProvider=typeof getGraph==='function'?getGraph:null;
   if(!node||!root.document)return false;
   mount=node;mount.replaceChildren();const d=root.document;
   const box=d.createElement('div');box.style.cssText='height:100%;display:flex;flex-direction:column;min-height:0;font:13px Arial,sans-serif';
   const toolbarHost=d.createElement('div');toolbarHost.id='standards-toolbar';toolbarHost.style.cssText='flex:0 0 auto;min-width:0';
   const bar=d.createElement('div');bar.style.cssText='display:flex;flex:0 0 auto;flex-wrap:wrap;align-items:center;gap:8px;padding:6px;border-bottom:1px solid #ddd';
   function modeButton(id,label){const btn=d.createElement('button');btn.type='button';btn.textContent=label;btn.dataset.isoTranslation=({ics:'modeIcs',committees:'modeCommittees','iso-list':'modeIsoList',references:'modeReferences',rss:'modeRss',changes:'modeChanges'})[id];btn.dataset.catalogMode=id;btn.addEventListener('click',()=>navigateMode(id));bar.appendChild(btn);}
   modeButton('ics',tr('modeIcs'));modeButton('committees',tr('modeCommittees'));modeButton('iso-list',tr('modeIsoList'));modeButton('references',tr('modeReferences'));modeButton('rss',tr('modeRss'));modeButton('changes',tr('modeChanges'));
   search=d.createElement('input');search.type='search';search.placeholder='Code ou libellé ICS…';search.setAttribute('aria-label',tr('searchAccessible'));search.style.cssText='flex:1;min-width:180px;padding:5px';bar.appendChild(search);
   advancedButton=d.createElement('button');advancedButton.type='button';advancedButton.dataset.isoTranslation='advancedSearch';advancedButton.textContent=tr('advancedSearch');advancedButton.title=tr('advancedTitle');advancedButton.addEventListener('click',openAdvancedDialog);bar.appendChild(advancedButton);
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

   const filterDetails=d.createElement('details');
   filterDetails.dataset.isoMoreFilters='true';
   filterDetails.style.cssText=
     'border:1px solid #ccc;border-radius:5px;padding:4px 7px;max-width:100%';

   const filterSummary=d.createElement('summary');
   filterSummary.dataset.isoTranslation='moreFilters';filterSummary.textContent=tr('moreFilters');
   filterSummary.style.cssText='cursor:pointer;font-weight:600';
   filterDetails.appendChild(filterSummary);

   const filterContent=d.createElement('div');
   filterContent.style.cssText=
     'display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:8px 0 3px';
   filterDetails.appendChild(filterContent);

   bar.insertBefore(filterDetails,sortLabel);
   filterContent.appendChild(sortLabel);
   filterContent.appendChild(icsFacet.parentElement);
   filterContent.appendChild(committeeFacet.parentElement);
   const reload=d.createElement('button');reload.type='button';reload.textContent=tr('refresh');reload.dataset.isoTranslation='refresh';reload.dataset.r2LegacyAction='reload';bar.appendChild(reload);
   const syncButton=d.createElement('button');syncButton.type='button';syncButton.textContent=tr('sync');syncButton.dataset.isoTranslation='sync';syncButton.title='Charger les fichiers ISO téléchargés localement dans IndexedDB';syncButton.addEventListener('click',()=>syncLocalIso());syncButton.dataset.r2LegacyAction='sync';bar.appendChild(syncButton);
   const remote=d.createElement('button');remote.type='button';remote.dataset.catalogDistribution='true';remote.dataset.isoTranslation='distributedSync';remote.textContent=tr('distributedSync');remote.title=tr('distributedSync');
   // S14.1-B1: one awaited operation for startup and manual refresh.
   let distributedSyncPromise=null;
   async function synchronizeDistributedIso(origin){
     if(distributedSyncPromise)return distributedSyncPromise;

     distributedSyncPromise=(async()=>{
       remote.disabled=true;
       if(origin==='startup'){
         root.__radarIsoStartup={status:'running'};
       }
       try{
         await import('./radar-iso-ics-extension.js');
         await import('./radar-iso-catalog-client.js');

         const result=await root.__radarIsoCatalogClient.sync({
           onProgress:p=>{
             if(status&&isoModes.includes(mode))status.textContent='ISO '+
               (p.dataset||'')+' : '+(p.count||0)+' enregistrements';
           }
         });

         await loadIsoCache();
         await loadIcs(true);
         refresh();

         root.__radarLastCatalogSync=result;
         if(origin==='startup'){
           root.__radarIsoStartup={
             status:'ready',
             release:result.release
           };
         }
         if(status&&isoModes.includes(mode))status.textContent='Catalogue '+result.release+
           ' : ISO '+result.iso.status+', ICS '+result.ics.status+
           (result.warnings.length?' · '+result.warnings.join('; '):'');
         return result;
       }catch(error){
         const message=String(error?.message||error);
         root.__radarLastCatalogSync={
           operation:'S14-S-CATALOG-SYNC',
           status:'error',
           message
         };
         if(origin==='startup'){
           root.__radarIsoStartup={
             status:'failed',
             message
           };
         }
         if(status&&isoModes.includes(mode))status.textContent=
           tr('distributedError')+' : '+message;
         throw error;
       }finally{
         remote.disabled=false;
       }
     })();

     try{return await distributedSyncPromise;}
     finally{distributedSyncPromise=null;}
   }

   remote.addEventListener('click',()=>{
     void synchronizeDistributedIso('manual').catch(()=>{});
   });bar.appendChild(remote);
   const changesReload=d.createElement('button');changesReload.type='button';changesReload.dataset.isoTranslation='changesLoad';changesReload.textContent=tr('changesLoad');changesReload.addEventListener('click',()=>loadChanges());changesReload.dataset.r2LegacyAction='changesLoad';bar.appendChild(changesReload);
   const rssReload=d.createElement('button');rssReload.type='button';rssReload.textContent=tr('rssSync');rssReload.dataset.isoTranslation='rssSync';rssReload.addEventListener('click',()=>loadRssCache(true));rssReload.dataset.r2LegacyAction='rssLoad';bar.appendChild(rssReload);
   const add=d.createElement('button');add.type='button';add.textContent=tr('add');add.dataset.isoTranslation='add';add.dataset.r2LegacyAction='addRadar';bar.appendChild(add);
   if(!nativeOnly){
     // Optional documentary sources are consulted only on explicit user action.
     const sourceButton=d.createElement('button');sourceButton.type='button';sourceButton.style.display='none';sourceButton.dataset.standardSources='true';sourceButton.dataset.isoTranslation='standardSources';sourceButton.textContent=tr('standardSources');
     function openStandardSources(row){
       root.__radarStandardSourceDialog?.open({graphProvider:()=>graphProvider?.(),sourceId:row?.origin==='iso-open-data'?'iso-open-data':row?.externalDocument?.sourceId,query:row?.designation||'',openIso(){mount.querySelector('[data-catalog-mode="iso-list"]')?.click();},openIsoAdmin:root.__radarApplicationProfile?.allows('catalog.admin')?()=>root.__radarS14Z?.open?.():null,onIntegrated(result){
         mode='references';nativeOriginFilter.value='all';search.value='';refresh();
         const index=grid.records.findIndex(r=>r.standardId===result.standardId);
         if(index>=0){grid.select?.(result.standardId);selected=result.standardId;grid.scrollIntoView?.(index,null,true);updateToolbar();}
         if(status)status.textContent=tr(({existing:'externalExisting',refresh:'referenceUpdated',reconcile:'referenceReconciled'})[result.action]||'externalAdded');
       }});
     }
     sourceButton.addEventListener('click',()=>openStandardSources());bar.appendChild(sourceButton);
     // S16-A: explicit external-source entry points, not additional ISO grid modes.
     for(const [sourceId,label] of [['rfc-editor','browseRfc'],['w3c','browseW3c']]){
       const shortcut=d.createElement('button');shortcut.type='button';shortcut.dataset.standardSourceShortcut=sourceId;shortcut.dataset.isoTranslation=label;shortcut.textContent=tr(label);
       shortcut.addEventListener('click',()=>{
         if(root.__radarApplicationProfile?.allows('catalog.declareReference')!==true||root.__radarCatalogPersistence?.status?.().importedCatalogs!==1)return;
         openStandardSources({externalDocument:{sourceId}});
       });
       bar.insertBefore(shortcut,bar.querySelector('[data-catalog-mode="references"]'));
     }
     const lifecycleButton=d.createElement('button');lifecycleButton.type='button';lifecycleButton.style.display='none';lifecycleButton.dataset.referenceLifecycle='true';lifecycleButton.dataset.isoTranslation='referenceLifecycle';lifecycleButton.textContent=tr('referenceLifecycle');
     lifecycleButton.addEventListener('click',()=>{const id=grid.getSelection?.()[0]||selected;if(!id){if(status)status.textContent=tr('selectReference');return;}try{root.__radarStandardRegistry.openLifecycle(()=>graphProvider?.(),id,{onRemoved(){refresh();if(status)status.textContent=tr('referenceRemoved');},onSources:openStandardSources});}catch(e){root.console?.warn?.('Reference lifecycle rejected',e);if(status)status.textContent=tr('referenceLifecycleError');}});bar.appendChild(lifecycleButton);
     const declareButton=d.createElement('button');declareButton.type='button';declareButton.style.display='none';declareButton.dataset.nativeDeclare='true';declareButton.dataset.isoTranslation='declareLocal';declareButton.textContent=tr('declareLocal');
     declareButton.addEventListener('click',()=>{
       try{root.__radarStandardRegistry.open(graphProvider?.(),{declaration:true,onDeclared(result){
         // Use the same native row and selection as an integrated ISO reference.
         mode='references';nativeOriginFilter.value='all';search.value='';refresh();
         const index=grid.records.findIndex(r=>r.standardId===result.standardId);
         if(index>=0){grid.select?.(result.standardId);selected=result.standardId;grid.scrollIntoView?.(index,null,true);updateToolbar();}
         if(status)status.textContent=tr('declaredFeedback');
       }});}catch(e){if(status)status.textContent=String(e.message||e);}
     });bar.appendChild(declareButton);
   }
   nativeOriginFilter=d.createElement('select');nativeOriginFilter.style.cssText='box-sizing:border-box;width:190px;min-width:0;max-width:100%;height:30px;min-height:30px;max-height:30px;margin:0;padding:2px 5px;flex:0 0 auto;align-self:center';nativeOriginFilter.size=1;nativeOriginFilter.style.display=mode==='references'?'':'none';nativeOriginFilter.setAttribute('aria-label',tr('nativeOrigin'));nativeOriginFilter.dataset.nativeOriginFilter='true';
   for(const [value,key] of [['all','nativeAll'],['iso-open-data','nativeIso'],['manual','nativeManual'],['rfc-editor','nativeRfc'],['w3c','nativeW3c'],['legacy','nativeLegacy']]){const option=d.createElement('option');option.value=value;option.dataset.isoTranslation=key;option.textContent=tr(key);nativeOriginFilter.appendChild(option);}
   nativeOriginFilter.value='all';nativeOriginFilter.addEventListener('change',refresh);bar.insertBefore(nativeOriginFilter,advancedButton);
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
   if(!nativeOnly){
     omgFile=d.createElement('input');omgFile.type='file';omgFile.accept='.html,.htm,.json,text/html,application/json';omgFile.style.display='none';omgFile.dataset.omgFile='true';bar.appendChild(omgFile);
     async function handleOmgFile(input){const chosen=input.files?.[0];input.value='';if(!chosen||mode!=='omg-specifications'||documentBusy)return;
       const token=++documentToken;documentBusy=true;documentMessage='';renderDocumentary();try{if(chosen.size>8*1024*1024)throw Error('File exceeds size limit');const raw=await chosen.text();if(token!==documentToken||mode!=='omg-specifications')return;
         const payload= /\.json$/i.test(chosen.name)?JSON.parse(raw):null;
         if(payload?.sourceId==='omg-formal-history'){
           const imported=await sourceApi().importOmgHistory(raw);
           if(token===documentToken){documentOmgFamily=imported.family;documentOmgAdoptions=false;documentOffset=0;selected=null;search.value='';documentMessage=tr('resourceOmgHistoryImported')+' : '+imported.family+' ('+imported.count+')';}
         }else{
           await sourceApi().importOmg(raw,{format:/\.html?$/i.test(chosen.name)?'html':'json'});
           if(token===documentToken){documentOmgFamily=null;documentOffset=0;selected=null;}
         }
       }catch(error){if(token===documentToken)documentMessage=tr('resourceError')+' : '+String(error.message||error);}finally{if(token===documentToken&&mode==='omg-specifications'){documentBusy=false;renderDocumentary();}}}
     omgFile.addEventListener('change',()=>void handleOmgFile(omgFile));
   }
   const target=d.createElement('div');target.id='standard-references-grid';target.style.cssText='flex:1 1 0;min-height:100px';
   status=d.createElement('div');status.style.cssText='padding:3px 7px;color:#555';status.setAttribute('role','status');
   if(!nativeOnly)box.appendChild(toolbarHost);
   box.append(bar,target,status);mount.appendChild(box);
   if(typeof root.w2grid!=='function'){status.textContent='w2ui grid indisponible';return false;}
   grid=new root.w2grid({name:'standardReferencesGrid',recordHeight:28,show:{toolbar:false,footer:true,expandColumn:false},multiSelect:false,records:[],columns:[],onDblClick(event){
     // The Viewer has no Creator toolbar. Preserve read-only record consultation
     // without reintroducing the ISO-specific detail column.
     if(!root.__radarApplicationProfile?.viewer)return;
     const recid=event.recid||event.detail?.recid;
     if(!recid||!grid.records.some(r=>r.recid===recid))return;
     selected=recid;void openSelectedDocumentaryRecord();
   },onClick(event){selected=event.recid||event.detail?.recid||null;
     if(standardsToolbar)Promise.resolve().then(()=>updateToolbar());
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
   target.addEventListener('click',e=>{const rss=e.target?.closest?.('[data-rss-open]');if(rss){const url=rss.getAttribute('data-rss-open');try{const u=new URL(url);if(u.protocol==='https:'&&u.hostname.endsWith('.iso.org'))root.open(u.href,'_blank','noopener,noreferrer');}catch(_){/* invalid url */}}});
   let isoSearchDebounce=null;search.addEventListener('input',()=>{if(isDocumentary()){documentOffset=0;selected=null;}if(isoSearchDebounce)clearTimeout(isoSearchDebounce);if(mode!=='iso-list'){isoSearchDebounce=setTimeout(()=>{isoSearchDebounce=null;refresh();},180);return;}isoSearchDebounce=setTimeout(()=>{isoSearchDebounce=null;refresh();},180);});reload.addEventListener('click',()=>{if(mode==='ics')loadIcs(true);loadIsoCache();});
   add.addEventListener('click',()=>{
     if(mode!=='references'){status.textContent=tr('addFromReferences');return;}
     if(!selected){status.textContent=tr('selectReference');return;}
     const group=root.__radarRevisionSession?.status?.().activeGroup;
     const revision=root.__radarCatalogAdapter?.getRevision?.(group);
     if(!revision||revision.status!=='draft'){status.textContent=tr('selectDraft');return;}
     try{root.__radarCatalogCreateForm.open(graphProvider?.(),'existing',selected);}
     catch(e){status.textContent=root.__radarCatalogCreateForm.errorMessage(e);}
   });
   if(nativeOnly){
     preparePublishedReferences();
     const label=d.createElement('span');
     label.dataset.isoTranslation='publishedReferences';
     label.textContent=tr('publishedReferences');
     bar.replaceChildren(label,search,nativeOriginFilter);
     return true; // no global ISO, RSS or changes initialization in Viewer
   }
   initializeToolbar(toolbarHost);
   // Creator startup retains the R5 optional-source contract.
   bindLocale();updateStaticLabels();refresh();
   void loadIcs();
   void loadIsoCache().then(async()=>{
     if(windowedActive){
       root.__radarIsoStartup={status:'existing'};
       return;
     }

     const active=await root.__radarIsoWindowed?.current?.();
     if(active){
       root.__radarIsoStartup={status:'existing'};
       return;
     }

     if(status&&isoModes.includes(mode))status.textContent=
       'Installation initiale du catalogue ISO…';

     await synchronizeDistributedIso('startup');
   }).catch(error=>{
     const message=String(error?.message||error);
     if(root.__radarIsoStartup?.status!=='failed'){
       root.__radarIsoStartup={status:'failed',message};
     }
     if(status&&isoModes.includes(mode))status.textContent=
       'Initialisation du catalogue ISO : '+message;
   });

   // Read existing RSS cache without network access.
   // Change journals are fetched only on explicit user request.
   void loadRssCache();
   return true;
 }
 function open(){if(root.__radarPublishedPresentation?.references===false)throw Error('Publication references panel disabled');if(!mount)initialize(root.document?.getElementById('standard-references-panel'));const layout=root.w2ui?.mainLayout;if(layout?.show)layout.show('bottom');if(layout?.sizeTo)layout.sizeTo('bottom',240);refresh();search?.focus();}
 // Initialize the shared consultation UI without starting source services.
 function preparePublishedReferences(){
   bindLocale();
   updateStaticLabels();
   refresh();
 }
 function resetWorkspace(){
   root.__radarStandardRegistry?.close?.();
   root.__radarStandardSourceDialog?.close?.();
   if(activeDetailRecord||root.w2ui?.standardsDocumentDetail)root.w2popup?.close?.();
   activeDetailCleanup?.();
   activeDetailRecord=null;
   selected=null;documentToken++;documentBusy=false;documentOffset=0;documentSeries=null;documentOmgFamily=null;documentMessage='';windowToken++;windowHistory=[null];windowPosition=0;windowBasePosition=0;windowNext=null;
   if(search)search.value='';
   if(nativeOriginFilter)nativeOriginFilter.value='all';
   refresh();
 }
 function openReferences(){
   root.__radarApplicationProfile?.require('radar.consult');
   if(root.__radarPublishedPresentation?.references===false)throw Error('Publication references panel disabled');
   if(mode!=='references'){documentToken++;documentBusy=false;documentSeries=null;documentOmgFamily=null;documentOffset=0;documentMessage='';}
   mode='references';
   const layout=root.w2ui?.mainLayout;
   layout?.show?.('bottom');layout?.sizeTo?.('bottom',240);
   if(!mount){
     let node=root.document?.getElementById('standard-references-panel');
     if(!node&&layout?.html){
       layout.html('bottom','<div id="standard-references-panel" style="height:100%"></div>');
       node=root.document?.getElementById('standard-references-panel');
     }
     if(!node)throw Error('Standards panel unavailable');
     root.__radarStandardsPanel.initialize(node,()=>root.__radarWorkspaceExplorer?.graph?.());
   }
   const button=mount?.querySelector('[data-catalog-mode="references"]');
   if(button)button.click();else refresh();
   search?.focus();
 }
 root.__radarStandardsPanel=Object.freeze({initialize,refresh,open,openReferences,resetWorkspace,icsTree,enrichedIcsTree});
})(window);
