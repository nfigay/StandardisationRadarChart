/* S19-R75-R3 — structured dossier links; pure validation/resolution, no external data reads. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.__radarRationaleLinks=api;})(typeof window==='object'?window:null,function(){
'use strict';
const TYPES=Object.freeze(['blip','standard','source','url']);
// Legacy entries remain readable for lossless catalog round-trips, but cannot be added.
const LEGACY_TYPES=Object.freeze(['radar','revision','organization','dossier']);
const str=x=>typeof x==='string'?x.trim():'';
function validate(entry){
 if(!entry||typeof entry!=='object'||Array.isArray(entry)||!TYPES.includes(entry.type)&&!LEGACY_TYPES.includes(entry.type))throw Error('invalid related reference type');
 if(!str(entry.id)||entry.id.length>500||!str(entry.label)||entry.label.length>500)throw Error('related reference id and label required');
 if(entry.type==='url'&&!/^https?:\/\/[^\s<>"']+$/i.test(entry.id))throw Error('unsafe external URL');
 if(entry.type==='blip'&&!str(entry.standardId))throw Error('blip reference requires standardId');
 if(entry.type==='revision'&&!str(entry.radarId))throw Error('revision reference requires radarId');
 if(entry.type==='source'&&!str(entry.provider))throw Error('source reference requires provider');
 return {type:entry.type,id:entry.id,label:entry.label,...(entry.standardId?{standardId:entry.standardId}:{}),...(entry.radarId?{radarId:entry.radarId}:{}),...(entry.provider?{provider:entry.provider}:{})};
}
function list(record){return Array.isArray(record?.relatedReferences)?record.relatedReferences.map(validate):[];}
function add(record,entry){const link=validate(entry);if(!TYPES.includes(link.type))throw Error('related reference type no longer available');const items=list(record);if(items.length>=100)throw Error('reference limit reached');if(items.some(x=>x.type===link.type&&x.id===link.id&&x.standardId===link.standardId&&x.radarId===link.radarId&&x.provider===link.provider))throw Error('duplicate reference');return {...record,relatedReferences:[...items,link]};}
function remove(record,index){const items=list(record);if(!Number.isInteger(index)||index<0||index>=items.length)throw Error('invalid reference index');items.splice(index,1);return {...record,relatedReferences:items};}
function resolve(link,revision,record){const r=validate(link);if(!revision||typeof revision!=='object')return null;
 if(r.type==='blip'){const hits=(revision.blips||[]).filter(x=>x.blipId===r.id&&x.standardId===r.standardId);return hits.length===1?{...r,object:hits[0]}:null;}
 if(r.type==='standard'){return (revision.blips||[]).some(x=>x.standardId===r.id)?r:null;}
 if(r.type==='radar')return revision.radarId===r.id?r:null;
 if(r.type==='revision')return revision.radarId===r.radarId&&revision.revisionId===r.id?r:null;
 if(r.type==='organization')return revision.ownerOrganizationId===r.id?r:null;
 if(r.type==='dossier')return record?.rationaleId===r.id?r:null;
 if(r.type==='url')return r;
 // A source must be resolved by a verified, scope-aware source service, never guessed from its label.
 return null;
}
return Object.freeze({TYPES,LEGACY_TYPES,validate,list,add,remove,resolve});
});
