/* S19-R7 foundation: pure revision-scoped rationale operations.
   No UI, storage, network or file side effects. Integration requires an explicit
   active-draft decision by the existing catalogue adapter. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root)root.__radarRationaleRevision=api;
})(typeof globalThis!=='undefined'?globalThis:null,function(){
 'use strict';
 const EXTENSION_KEY='radarRationales';
 const FORMAT='s19-revision-rationales-v1';
 const clone=value=>JSON.parse(JSON.stringify(value));
 const str=value=>typeof value==='string'?value.trim():'';
 function checkRecord(record){
   if(!record||typeof record!=='object'||Array.isArray(record))throw Error('rationale must be an object');
   if(!str(record.rationaleId))throw Error('rationaleId required');
   if(!str(record.standard?.id))throw Error('standard.id required: explicit registry binding');
   if(!str(record.organization?.id))throw Error('organization.id required: explicit ownership');
   if(!record.sections||typeof record.sections!=='object'||Array.isArray(record.sections))throw Error('sections required');
   for(const [key,value] of Object.entries(record.sections)){
     if(!key||!value||value.type!=='doc'||(value.content!==undefined&&!Array.isArray(value.content)))throw Error('invalid Tiptap JSON for '+key);
   }
   if(record.relatedReferences!==undefined){if(!Array.isArray(record.relatedReferences)||record.relatedReferences.length>100)throw Error('invalid related references');const links=typeof module==='object'&&module.exports?require('./radar-rationale-links.js'):globalThis?.__radarRationaleLinks; if(links)record.relatedReferences.forEach(links.validate);else throw Error('reference validator unavailable');}
   return true;
 }
 function assertDraft(options){
   if(options?.draft!==true)throw Error('refusing to modify revision without explicit active-draft confirmation');
 }
 function read(revision){
   if(!revision||typeof revision!=='object')throw Error('revision required');
   const e=revision.extensions?.[EXTENSION_KEY];
   if(e===undefined)return [];
   if(!e||e.schemaVersion!==FORMAT||!Array.isArray(e.items))throw Error('unknown rationale extension format: preserve without modification');
   return clone(e.items);
 }
 function list(revision){return read(revision);}
 function get(revision,rationaleId){return read(revision).find(x=>x.rationaleId===rationaleId)||null;}
 function put(revision,record,options){
   assertDraft(options);checkRecord(record);
   const previous=read(revision);
   const idx=previous.findIndex(x=>x.rationaleId===record.rationaleId);
   if(idx!==-1&&!options?.replace)throw Error('existing dossier: explicit replacement required');
   if(idx!==-1){
      const old=previous[idx];
      if(old.standard.id!==record.standard.id||old.organization.id!==record.organization.id)throw Error('cannot rebind existing rationale to another standard or organization');
   }
   if(previous.some((x,i)=>i!==idx&&x.standard?.id===record.standard.id&&x.organization?.id===record.organization.id))throw Error('another dossier already exists for standard and organization');
   const updated=clone(record);
   if(idx===-1)previous.push(updated);else previous[idx]=updated;
   const result=clone(revision);
   result.extensions={...(result.extensions||{}),[EXTENSION_KEY]:{schemaVersion:FORMAT,items:previous}};
   return result;
 }
 function remove(revision,rationaleId,options){
   assertDraft(options);
   const previous=read(revision);
   if(!previous.some(x=>x.rationaleId===rationaleId))throw Error('rationale not found');
   if(options.confirm!==true)throw Error('explicit deletion confirmation required');
   const result=clone(revision);
   result.extensions={...(result.extensions||{}),[EXTENSION_KEY]:{schemaVersion:FORMAT,items:previous.filter(x=>x.rationaleId!==rationaleId)}};
   return result;
 }
 return Object.freeze({EXTENSION_KEY,FORMAT,checkRecord,list,get,put,remove});
});
