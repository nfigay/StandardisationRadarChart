/* S19-R21 — Internationalized, metadata-derived SVG title. No synthetic save timestamps. */
(function(root){
 'use strict';
 const labels={
  fr:{status:{draft:'Brouillon',published:'Publiée',archived:'Archivée'},version:'Version',saved:'Dernière sauvegarde',modified:'Dernière modification',unknown:'non disponible',unsaved:'Modifications non enregistrées'},
  en:{status:{draft:'Draft',published:'Published',archived:'Archived'},version:'Version',saved:'Last saved',modified:'Last modified',unknown:'unavailable',unsaved:'Unsaved changes'}
 };
 const FIXED='Strategic Standard Chart';
 function locale(){return String(root.i18next?.language||'fr').toLowerCase().startsWith('fr')?'fr':'en';}
 function validDate(v){if(typeof v!=='string'||!/^\d{4}-\d\d-\d\dT/.test(v))return null;const d=new Date(v);return Number.isFinite(d.getTime())?d:null;}
 function formatDate(v,language){const d=validDate(v);return d?new Intl.DateTimeFormat(language==='fr'?'fr-FR':'en-GB',{dateStyle:'short',timeStyle:'short'}).format(d):null;}
 function metadata(){
  const active=root.__radarRevisionSession?.status?.().activeGroup;
  const revision=active?root.__radarCatalogAdapter?.getRevision?.(active):null;
  const info=root.__radarWorkspaceExplorer?.describeActive?.()||{};
  const graph=root.__radarWorkspaceExplorer?.graph?.();
  let dirty=false;
  if(revision&&graph&&root.__radarCatalogPersistence?.status?.().importedCatalogs===1){
   try{dirty=!!root.__radarCatalogPersistence.isDirty(graph);}catch(_){dirty=false;}
  }
  return {organization:info.organization||null,radar:revision?(root.__radarCatalogPersistence?.getRadarName?.(revision.radarId)||revision.title||revision.radarId):info.radar||null,
   version:revision?.version||null,status:revision?.status||null,
   savedAt:revision?.extensions?.administration?.lastSavedAt||null,
   modifiedAt:revision?.updatedAt||null,dirty};
 }
 function compose(data,language=locale()){
  const lang=language==='en'?'en':'fr',l=labels[lang],m=data||{};
  const line2=[m.organization,m.radar].filter(Boolean).map(String).join(' — ');
  const line3=[m.version?l.version+' '+m.version:null,m.status?(l.status[m.status]||m.status):null].filter(Boolean).join(' · ');
  let date=m.savedAt?formatDate(m.savedAt,lang):null;
  const modification=!date&&m.modifiedAt?formatDate(m.modifiedAt,lang):null;
  let line4=(date?l.saved+': '+date:modification?l.modified+': '+modification:l.saved+': '+l.unknown);
  if(m.dirty)line4+=' · '+l.unsaved;
  return [FIXED,line2,line3,line4].filter(Boolean);
 }
 // Keep metadata untouched; format only the SVG presentation.
 function wrapName(value,max=58){
  const words=String(value||'').trim().split(/\s+/).filter(Boolean),out=[];
  let line='';
  for(const word of words){
   if(line&&[...line+' '+word].length>max){out.push(line);line=word;}else line=line?line+' '+word:word;
  }
  if(line)out.push(line);
  return out.length?out:[''];
 }
 function visualLines(data,language=locale()){
  const m=data||{},l=labels[language==='en'?'en':'fr'];
  const lines=[{text:FIXED,kind:'brand'}];
  if(m.organization)lines.push({text:String(m.organization),kind:'identity'});
  if(m.radar){for(const part of wrapName(m.radar))lines.push({text:part,kind:'identity'});}
  const details=[m.version?l.version+' '+m.version:null,m.status?(l.status[m.status]||m.status):null].filter(Boolean).join(' · ');
  if(details)lines.push({text:details,kind:'meta'});
  const date=m.savedAt?formatDate(m.savedAt,language):null;
  const modified=!date&&m.modifiedAt?formatDate(m.modifiedAt,language):null;
  let last=date?l.saved+': '+date:modified?l.modified+': '+modified:l.saved+': '+l.unknown;
  if(m.dirty)last+=' · '+l.unsaved;
  lines.push({text:last,kind:'date'});
  return lines;
 }
 // The visible header must be OUTSIDE the radar viewport. Both SVG and Cytoscape
 // use #radar-container and must keep exactly the same available area.
 function refreshWorkspaceHeader(lines){
  const doc=root.document;
  const svgHost=doc?.getElementById?.('svg-container');
  const viewport=doc?.getElementById?.('radar-container');
  const main=doc?.getElementById?.('main-container');
  if(!svgHost||!viewport||!main||viewport.parentNode!==main||!doc.createElement)return false;
  const styleId='s19-radar-title-header-style';
  let css=doc.getElementById(styleId);
  if(!css){css=doc.createElement('style');css.id=styleId;(doc.head||doc.documentElement)?.appendChild(css);}
  // Override R21-R2's previous injected stylesheet in place. Never stack styles.
  css.textContent=[
   '#main-container.s19-title-layout{display:flex!important;flex-direction:column!important;min-width:0;min-height:0;overflow:hidden}',
   '#main-container.s19-title-layout > #radar-container{position:relative;flex:1 1 0!important;height:auto!important;min-height:0;width:100%;overflow:hidden}',
   '#main-container.s19-title-layout #svg-container{display:block!important;position:absolute;top:0;left:0;width:100%;height:100%;overflow:hidden}',
   '#main-container.s19-title-layout #svg-container > svg{display:block;width:100%;height:100%;min-height:0}',
   '#main-container.s19-title-layout #svgTitle{visibility:hidden}',
   '#s19-radar-title-header{flex:0 0 auto;box-sizing:border-box;width:100%;padding:12px 20px 12px;background:#fff;text-align:center;line-height:1.4;font-family:Arial,sans-serif;color:#182230;overflow-wrap:anywhere;pointer-events:none}',
   '#s19-radar-title-header .s19-radar-title-brand{font-size:19px;font-weight:700}',
   '#s19-radar-title-header .s19-radar-title-identity{font-size:13px;font-weight:500}',
   '#s19-radar-title-header .s19-radar-title-meta{font-size:12px;color:#334155}',
   '#s19-radar-title-header .s19-radar-title-date{font-size:11px;color:#46566b}'
  ].join('\n');
  let header=doc.getElementById('s19-radar-title-header');
  if(!header){header=doc.createElement('div');header.id='s19-radar-title-header';}
  if(header.parentNode!==main){main.insertBefore(header,viewport);}
  main.classList?.add('s19-title-layout');
  // The legacy class put a flex column INSIDE the SVG overlay. Remove it.
  svgHost.classList?.remove('s19-title-host');
  header.replaceChildren();
  for(const line of lines){
   const entry=doc.createElement('div');
   entry.className='s19-radar-title-'+line.kind;
   entry.textContent=line.text;
   header.appendChild(entry);
  }
  // W2UI sizes the outer panel. Synchronize SVG/Cytoscape after layout has
  // assigned the remaining space to the radar viewport. Do not alter nodes.
  if(typeof root.requestAnimationFrame==='function'){
   root.requestAnimationFrame(()=>root.__radarViewportSync?.());
  }
  return true;
 }
 function refresh(){
  const node=root.document?.getElementById?.('svgTitle');if(!node)return false;
  const lines=visualLines(metadata());
  refreshWorkspaceHeader(lines);
  const ns='http://www.w3.org/2000/svg';
  // SVG viewBox reserves a distinct 120-unit header above the 800-unit radar.
  // Keep the last line safely above the outer ring (whose top is near y=50).
  const lineHeight=19,first=-92;
  node.replaceChildren();node.setAttribute('x','0');node.setAttribute('y',String(first-400));node.setAttribute('text-anchor','middle');
  node.setAttribute('font-family','Arial, sans-serif');node.setAttribute('font-size','13');node.setAttribute('font-weight','normal');
  lines.forEach((line,i)=>{
   const span=root.document.createElementNS(ns,'tspan');span.setAttribute('x','0');span.setAttribute('dy',i===0?'0':String(lineHeight));
   if(line.kind==='brand'){span.setAttribute('font-size','19');span.setAttribute('font-weight','700');}
   else if(line.kind==='identity'){span.setAttribute('font-size','13');span.setAttribute('font-weight','500');}
   else if(line.kind==='date'){span.setAttribute('font-size','11');span.setAttribute('fill','#46566b');}
   else {span.setAttribute('font-size','12');span.setAttribute('fill','#334155');}
   span.textContent=line.text;node.appendChild(span);
  });
  node.setAttribute('aria-label',lines.map(x=>x.text).join(' — '));return true;
 }

 if(root.i18next?.on)root.i18next.on('languageChanged',refresh);
 root.__radarTitle=Object.freeze({compose,metadata,refresh,locale});
})(window);
