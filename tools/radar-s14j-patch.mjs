// Targeted, fail-closed patches for S14-I sources. No wholesale HTML replacement.
export function patchRadar(s){if(s.includes('src="./js/radar-catalog-changes.js"'))return s;const anchor='<script src="./js/radar-catalog-distribution.js"></script>';if(s.split(anchor).length!==2)throw Error('Ancrage distribution absent ou ambigu');return s.replace(anchor,anchor+'\n    <script src="./js/radar-catalog-changes.js"></script>');}
export function patchPanel(input){let s=input;if(s.includes('/* S14-J change journal */'))return s;
 function one(a,b){const n=s.split(a).length-1;if(n!==1)throw Error('Ancre panneau S14-I absente ou ambiguë : '+a.slice(0,60)+' ('+n+')');s=s.replace(a,b);}
 one('"distributedSync":"Synchroniser le catalogue distribué"','"modeChanges":"Évolutions ISO","changesLoad":"Charger les évolutions","changesSearch":"Référence, champ, changement…","changesFrom":"Depuis","changesTo":"Vers","changesKind":"Évolution","changesFields":"Champs modifiés","changesMissing":"Absente du nouveau jeu (retrait non confirmé)","changesAdded":"Nouvelle dans le jeu","changesChanged":"Métadonnées modifiées","changesEmpty":"Aucun journal publié. Comparer deux releases ISO pour produire des évolutions.","distributedSync":"Synchroniser le catalogue distribué"');
 one('"distributedSync":"Sync distributed catalogue"','"modeChanges":"ISO changes","changesLoad":"Load changes","changesSearch":"Reference, field, change…","changesFrom":"From","changesTo":"To","changesKind":"Change","changesFields":"Changed fields","changesMissing":"Missing from new snapshot (withdrawal unconfirmed)","changesAdded":"New in snapshot","changesChanged":"Metadata changed","changesEmpty":"No published journal. Compare two ISO releases to generate changes.","distributedSync":"Sync distributed catalogue"');
 one("rssRows=[],rssMessage='';","rssRows=[],rssMessage='',changeRows=[],changeMessage='',changeRelease='';");
 one("mode==='rss'?tr('rssSearch'):tr('searchLocal')","mode==='rss'?tr('rssSearch'):mode==='changes'?tr('changesSearch'):tr('searchLocal')");
 const anchor="   } else if(mode==='rss'){";
 one(anchor,`   } else if(mode==='changes'){
     const q=norm(term);
     grid.columns=[
       {field:'reference',text:tr('colRef'),size:'170px',sortable:true},
       {field:'dataset',text:tr('colProvenance'),size:'110px',sortable:true},
       {field:'kindLabel',text:tr('changesKind'),size:'260px',sortable:true},
       {field:'fields',text:tr('changesFields'),size:'45%'}
     ];
     const found=q?changeRows.filter(x=>norm([x.reference,x.dataset,x.kindLabel,x.fields,x.id].join(' ')).includes(q)):changeRows;
     grid.records=found.slice(0,MAX_ROWS).map((r,i)=>({...r,recid:'change:'+i}));
     if(status)status.textContent=changeMessage||tr('changesEmpty');
${anchor}`);
 one("modeButton('rss',tr('modeRss'));","modeButton('rss',tr('modeRss'));modeButton('changes',tr('modeChanges'));");
 one("rss:'modeRss'})[id]","rss:'modeRss',changes:'modeChanges'})[id]");
 one("mode==='references'||mode==='rss'","mode==='references'||mode==='rss'||mode==='changes'");
 const button="   const rssReload=d.createElement('button');";
 one(button,`   const changesReload=d.createElement('button');changesReload.type='button';changesReload.dataset.isoTranslation='changesLoad';changesReload.textContent=tr('changesLoad');changesReload.addEventListener('click',()=>loadChanges());bar.appendChild(changesReload);
${button}`);
 one("   bindLocale();updateStaticLabels();refresh();loadIcs();loadIsoCache().then(()=>syncLocalIso());loadRssCache();return true;",
 "   bindLocale();updateStaticLabels();refresh();loadIcs();loadIsoCache().then(()=>syncLocalIso());loadRssCache();loadChanges();return true;");
 const before=' function loadIcs(){';
 one(before,` /* S14-J change journal */
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
${before}`);
 return s;
}
