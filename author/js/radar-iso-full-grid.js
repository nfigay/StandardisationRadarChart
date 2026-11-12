/* S14-L1: full-catalogue projection for w2grid virtual scrolling.
 * Work is done over the complete locally loaded ISO dataset, never the displayed first N.
 * No duplicate registry, no mutation of ISO source objects.
 */
(function(root){'use strict';
 function norm(v){return String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();}
 function project(standards,term=''){
  const q=norm(term),out=[];
  for(const s of standards||[]){
   if(q&&!norm([s.reference,s.title,s.titleI18n?.en,s.scope,s.scopeI18n?.en,s.currentStage,s.ownerCommittee,(s.icsCodes||[]).join(' ')].join(' ')).includes(q))continue;
   out.push({recid:'iso-list:'+s.id,kind:'standard',isoId:s.id,identifier:s.reference,title:s.title,titleEn:s.titleI18n?.en||'',icsCodes:(s.icsCodes||[]).join(', '),committee:s.ownerCommittee,stage:s.currentStage});
  }
  return out;
 }
 const api=Object.freeze({project});root.__radarIsoFullGrid=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
