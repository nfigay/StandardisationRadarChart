/* S14-M: versioned IndexedDB, stage-then-activate. Separate from legacy cache. */
(function(root){
 'use strict';
 const NAME='standardisation-radar-iso-windowed', VERSION=1;
 const request=req=>new Promise((yes,no)=>{req.onsuccess=()=>yes(req.result);req.onerror=()=>no(req.error||Error('IndexedDB request failed'));});
 const complete=tx=>new Promise((yes,no)=>{tx.oncomplete=()=>yes();tx.onabort=()=>no(tx.error||Error('IndexedDB aborted'));tx.onerror=()=>{};});
 const range=(low,high)=>IDBKeyRange.bound(low,high);
 function open(){return new Promise((yes,no)=>{const r=indexedDB.open(NAME,VERSION);r.onerror=()=>no(r.error);r.onupgradeneeded=()=>{
   const db=r.result;
   const records=db.createObjectStore('records',{keyPath:['generation','type','id']});
   records.createIndex('byReference',['generation','type','reference','id']);
   const links=db.createObjectStore('links',{keyPath:['generation','dimension','value','id']});
   links.createIndex('byValue',['generation','dimension','value','id']);
   db.createObjectStore('meta',{keyPath:'key'});
 };r.onsuccess=()=>yes(r.result);});}
 async function batch(db,generation,type,items){if(!items.length)return;
   const tx=db.transaction(['records','links'],'readwrite'),done=complete(tx),records=tx.objectStore('records'),links=tx.objectStore('links');
   try{for(const r of items){const id=String(r.id),reference=String(r.reference||'');records.add({...r,id,reference,generation,type});
    if(type==='deliverables'){
     for(const ics of new Set(r.icsCodes||[]))links.put({generation,dimension:'ics',value:String(ics),id});
     if(r.ownerCommittee)links.put({generation,dimension:'committee',value:String(r.ownerCommittee),id});
    }
   }}catch(e){tx.abort();throw e;}await done;
 }
 async function meta(db,key){const tx=db.transaction('meta','readonly');return request(tx.objectStore('meta').get(key));}
 async function activate(db,generation,summary){const tx=db.transaction('meta','readwrite'),done=complete(tx);
   tx.objectStore('meta').put({key:'active',generation,summary,activatedAt:new Date().toISOString()});await done;return summary;}
 async function importRelease({datasets,release,normalize,onProgress,signal}){
   if(!Array.isArray(datasets)||!datasets.length||!release)throw Error('Invalid release import');
   if(!root.__radarIsoStreamCore)throw Error('Streaming core not loaded');
   // One generation is immutable once written. Never reuse a previous generation.
   const generation=String(release)+'-'+(root.crypto?.randomUUID?.()||String(Date.now())+'-'+Math.random());
   const db=await open(),summary={release,generation,datasets:{}};
   let failure=null;try{for(const item of datasets){if(!['deliverables','committees','ics'].includes(item.type))throw Error('Unsupported dataset '+item.type);
      const stream=item.openStream?await item.openStream():item.stream;
      const result=await root.__radarIsoStreamCore.ingestStream({stream,entry:item.entry,signal,
        normalize:raw=>normalize(item.type,raw),writeBatch:rows=>batch(db,generation,item.type,rows),
        onProgress:p=>onProgress?.({type:item.type,...p})});summary.datasets[item.type]=result;
    }
    if(!summary.datasets.deliverables||!summary.datasets.committees)throw Error('Incomplete release');
    // The only operation changing active data is this short atomic metadata transaction.
    await activate(db,generation,summary);return summary;
   }catch(e){failure=e;throw e;}finally{db.close();if(failure){try{await purgeGeneration(generation);}catch(_){/* staging can be purged later */}}}
 }
 async function current(){const db=await open();try{return (await meta(db,'active'))||null;}finally{db.close();}}
 async function page({type='deliverables',limit=100,after=null,dimension=null,value=null,search=null}={}){
   if(!Number.isInteger(limit)||limit<1||limit>500)throw Error('Limit must be 1..500');
   const db=await open();try{
    const active=await meta(db,'active');if(!active)return {records:[],next:null,total:0,release:null};
    const generation=active.generation;const matching=dimension&&value!=null;
    if(matching&&!['ics','committee'].includes(dimension))throw Error('Unknown dimension');
    const tx=db.transaction(matching?['links','records']:['records'],'readonly');
    const index=matching?tx.objectStore('links').index('byValue'):tx.objectStore('records').index('byReference');
    const lo=matching?[generation,dimension,String(value),'']:[generation,type,'',''];
    const hi=matching?[generation,dimension,String(value),'\uffff']:[generation,type,'\uffff','\uffff'];
    const normalized=String(search||'').trim().toLocaleLowerCase();
    return await new Promise((resolve,reject)=>{
      const output=[];let bookmark=null,finished=false;
      const start=after?IDBKeyRange.bound(after,hi,true,false):range(lo,hi);
      const query=index.openCursor(start);query.onerror=()=>reject(query.error||Error('Cursor failed'));
      query.onsuccess=()=>{if(finished)return;const cursor=query.result;
       if(!cursor){finished=true;resolve({records:output,next:null,release:active.summary.release,total:matching||normalized?null:active.summary.datasets[type]?.count??null});return;}
       const processItem=item=>{
        if(item&&(!normalized||[item.reference,item.title,item.scope].some(v=>String(v||'').toLocaleLowerCase().includes(normalized)))){
          output.push(item);bookmark=cursor.key;
          if(output.length>=limit){finished=true;resolve({records:output,next:bookmark,release:active.summary.release,total:matching||normalized?null:active.summary.datasets[type]?.count??null});return;}
        }
        cursor.continue();
       };
       if(matching){const itemReq=tx.objectStore('records').get([generation,type,cursor.value.id]);itemReq.onerror=()=>reject(itemReq.error);itemReq.onsuccess=()=>processItem(itemReq.result);}
       else processItem(cursor.value);
      };
      tx.onabort=()=>{if(!finished){finished=true;reject(tx.error||Error('Cursor aborted'));}};
     });
   }finally{db.close();}
 }
 // Cleanup is explicit; a failed import does not change the active generation.
 async function purgeGeneration(generation,{batchSize=500}={}){
  const db=await open();try{if((await meta(db,'active'))?.generation===generation)throw Error('Cannot purge active generation');
   for(const storeName of ['records','links']){
    for(;;){const keys=await new Promise((resolve,reject)=>{const tx=db.transaction(storeName,'readonly'),req=tx.objectStore(storeName).openKeyCursor();const found=[];
      req.onerror=()=>reject(req.error);req.onsuccess=()=>{const c=req.result;if(!c||found.length===batchSize){resolve(found);return;}if(c.key[0]===generation)found.push(c.key);c.continue();};});
      if(!keys.length)break;
      const tx=db.transaction(storeName,'readwrite'),done=complete(tx),store=tx.objectStore(storeName);for(const k of keys)store.delete(k);await done;
    }
   }
  }finally{db.close();}
 }
 root.__radarIsoWindowed=Object.freeze({open,importRelease,page,current,purgeGeneration});
 if(typeof module!=='undefined'&&module.exports)module.exports=root.__radarIsoWindowed;
})(typeof window!=='undefined'?window:globalThis);
