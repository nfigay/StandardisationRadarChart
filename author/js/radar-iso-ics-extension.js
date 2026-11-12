/* S14-S: separately versioned ICS taxonomy, staged then activated in IndexedDB.
 * No changes to the active ISO deliverable generation or radar graph.
 */
(function(root){
 'use strict';
 const DB='standardisation-radar-ics-extension-v1';
 const req=r=>new Promise((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error||Error('ICS IndexedDB request failed'));});
 const done=t=>new Promise((resolve,reject)=>{t.oncomplete=resolve;t.onabort=()=>reject(t.error||Error('ICS transaction aborted'));});
 function open(){return new Promise((resolve,reject)=>{
   const r=indexedDB.open(DB,1);
   r.onupgradeneeded=()=>{const db=r.result;db.createObjectStore('records',{keyPath:['generation','id']});db.createObjectStore('meta',{keyPath:'key'});};
   r.onerror=()=>reject(r.error);r.onblocked=()=>reject(Error('Close other application tabs to update ICS cache'));
   r.onsuccess=()=>{r.result.onversionchange=()=>r.result.close();resolve(r.result);};
 });}
 async function active(){const db=await open();try{return await req(db.transaction('meta','readonly').objectStore('meta').get('active'))||null;}finally{db.close();}}
 function normalize(raw){const id=String(raw.identifier||raw.id||'').trim();if(!/^\d{2}(?:\.\d{3})?(?:\.\d{2})?$/.test(id))throw Error('Invalid ICS identifier: '+id);
   const titleFr=String(raw.titleFr||'').trim(),titleEn=String(raw.titleEn||'').trim();if(!titleFr&&!titleEn)throw Error('ICS label missing: '+id);
   return {id,identifier:id,titleFr,titleEn,parent:String(raw.parent||''),description:String(raw.description||''),source:raw.source||''};}
 async function importStream({entry,openStream,release,onProgress,signal}){
   if(!root.__radarIsoStreamCore?.ingestStream)throw Error('ISO streaming engine unavailable');
   if(!release||!entry||typeof openStream!=='function')throw Error('Invalid ICS extension import');
   const old=await active();if(old?.release===release&&old?.sha256===entry.uncompressedSha256)return {status:'unchanged',release,count:old.count};
   const generation=release+'-'+(root.crypto?.randomUUID?.()||String(Date.now()));const db=await open();
   try{
     const seen=new Set(); // bounded by the ICS taxonomy size, not the 81,768 ISO standards
     const result=await root.__radarIsoStreamCore.ingestStream({stream:await openStream(),entry,signal,normalize,writeBatch:async rows=>{
       const tx=db.transaction('records','readwrite'),completed=done(tx),store=tx.objectStore('records');
       for(const item of rows){if(seen.has(item.id)){tx.abort();throw Error('Duplicate ICS identifier: '+item.id);}seen.add(item.id);store.add({...item,generation});}
       await completed;
     },onProgress});
     const tx=db.transaction('meta','readwrite'),completed=done(tx);
     tx.objectStore('meta').put({key:'active',generation,release,count:result.count,sha256:entry.uncompressedSha256,updatedAt:new Date().toISOString()});
     await completed;
     return {status:'updated',release,count:result.count};
   }finally{db.close();}
 }
 async function list({limit=5000}={}){
   if(!Number.isInteger(limit)||limit<1||limit>5000)throw Error('Invalid ICS listing limit');
   const db=await open();try{const selected=await req(db.transaction('meta','readonly').objectStore('meta').get('active'));if(!selected)return {status:'not-installed',records:[]};
     const tx=db.transaction('records','readonly'),store=tx.objectStore('records'),items=[];
     const range=IDBKeyRange.bound([selected.generation,''],[selected.generation,'\uffff']);
     await new Promise((resolve,reject)=>{const cursor=store.openCursor(range);cursor.onerror=()=>reject(cursor.error);cursor.onsuccess=()=>{const c=cursor.result;if(!c){resolve();return;}if(items.length>=limit){reject(Error('ICS taxonomy exceeds safe metadata limit'));return;}const {generation,...record}=c.value;items.push(record);c.continue();};});
     return {status:'ready',release:selected.release,records:items};
   }finally{db.close();}
 }
 root.__radarIsoIcsExtension=Object.freeze({active,normalize,importStream,list});
 if(typeof module!=='undefined'&&module.exports)module.exports=root.__radarIsoIcsExtension;
})(typeof window!=='undefined'?window:globalThis);
