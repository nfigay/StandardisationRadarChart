/* S14-K — Read-only correlation of ISO catalogue changes with followed references.
 * Never rewrites radar revisions, blips or registry records.
 */
(function(root){'use strict';
 const str = value=>String(value??'').trim();
 const canonical = value=>str(value).toUpperCase().replace(/\s+/g,' ').replace(/\s*\/\s*/g,'/');
 function followedReferences(registry){
   if(!Array.isArray(registry))return [];
   return registry.map(x=>({standardId:str(x.standardId||x.id),sourceRecordId:str(x.sourceRecordId||x.isoId||x.provenance?.sourceRecordId),reference:canonical(x.designation||x.reference||x.isoReference)})).filter(x=>x.standardId);
 }
 function correlate(changes, registry){
   if(!Array.isArray(changes))throw Error('Journal ISO invalide');
   const refs=followedReferences(registry),byId=new Map(),byRef=new Map();
   for(const r of refs){if(r.sourceRecordId){const arr=byId.get(r.sourceRecordId)||[];arr.push(r);byId.set(r.sourceRecordId,arr);}if(r.reference){const arr=byRef.get(r.reference)||[];arr.push(r);byRef.set(r.reference,arr);}}
   return changes.map(change=>{
     const sourceId=str(change.id),reference=canonical(change.reference);
     const direct=byId.get(sourceId)||[];
     // A textual match alone is a candidate, never a verified identity match.
     const tentative=direct.length?[]:(byRef.get(reference)||[]);
     return {...change,followed:direct.map(x=>({standardId:x.standardId,confidence:'source-id'})),candidates:tentative.map(x=>({standardId:x.standardId,confidence:'designation-only'}))};
   });
 }
 function fieldDetails(change){return (change.fields||[]).map(field=>({field,before:change.before?.[field]??null,after:change.after?.[field]??null}));}
 root.__radarCatalogFollowed=Object.freeze({correlate,fieldDetails,followedReferences});
})(window);
