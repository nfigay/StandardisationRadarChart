/* S14-M: versioned IndexedDB, stage-then-activate. Separate from legacy cache. */
(function(root){
 'use strict';
 const NAME='standardisation-radar-iso-windowed', VERSION=3;
 // Stable sort keys for the *whole* catalogue, not w2grid's displayed records.
 function sortText(row,field){
   const v=field==='titleEn'?(row.titleI18n?.en||row.titleEn||row.title||row.reference):
     field==='title'?(row.titleI18n?.fr||row.titleI18n?.en||row.title||row.reference):
     field==='stage'?(row.currentStage||row.stage||''):row.reference;
   const text=typeof v==='string'?v:Array.isArray(v)?v.join(' '):v&&typeof v==='object'?Object.values(v).find(x=>typeof x==='string')||'':String(v??'');
   return text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase();
 }
 const SORT_FIELDS=['title','titleEn','stage'];
 function hierarchy(dimension,row){
   if(dimension==='ics'){
     const codes=Array.isArray(row.icsCodes)?row.icsCodes.filter(Boolean).map(String):[];
     if(!codes.length)return ['__unclassified__'];
     const output=new Set();
     for(const code of codes){const parts=code.split('.');for(let i=1;i<=parts.length;i++)output.add(parts.slice(0,i).join('.'));}
     return [...output];
   }
   const code=String(row.ownerCommittee||'').trim();
   if(!code)return ['__unclassified__'];
   const output=new Set([code]);
   // Preserve the ISO/TC parent for ISO/TC n/SC m; no assumption about other prefixes.
   const m=code.match(/^(ISO\/TC\s*\d+)(?:\/SC\s*\d+)(?:\b|$)/i);
   if(m)output.add(m[1]);
   return [...output];
 }
 function groupMatches(item,dimension,selectorSet){
   if(dimension==='ics'){
     const codes=Array.isArray(item.icsCodes)?item.icsCodes.map(String):[];
     return (selectorSet.has('__unclassified__')&&!codes.length)||codes.some(c=>selectorSet.has(c));
   }
   const committee=String(item.ownerCommittee||'');
   return (selectorSet.has('__unclassified__')&&!committee)||selectorSet.has(committee);
 }
 const request=req=>new Promise((yes,no)=>{req.onsuccess=()=>yes(req.result);req.onerror=()=>no(req.error||Error('IndexedDB request failed'));});
 const complete=tx=>new Promise((yes,no)=>{tx.oncomplete=()=>yes();tx.onabort=()=>no(tx.error||Error('IndexedDB aborted'));tx.onerror=()=>{};});
 const range=(low,high)=>IDBKeyRange.bound(low,high);
 function open(){return new Promise((yes,no)=>{const r=indexedDB.open(NAME,VERSION);r.onerror=()=>no(r.error);r.onblocked=()=>no(Error('IndexedDB upgrade blocked: close other radar tabs and reload'));r.onupgradeneeded=()=>{
   const db=r.result;
   if(!db.objectStoreNames.contains('records')){const records=db.createObjectStore('records',{keyPath:['generation','type','id']});records.createIndex('byReference',['generation','type','reference','id']);}
   if(!db.objectStoreNames.contains('links')){const links=db.createObjectStore('links',{keyPath:['generation','dimension','value','id']});links.createIndex('byValue',['generation','dimension','value','id']);}
   if(!db.objectStoreNames.contains('meta'))db.createObjectStore('meta',{keyPath:'key'});
   if(!db.objectStoreNames.contains('sortKeys'))db.createObjectStore('sortKeys',{keyPath:['generation','type','field','value','id']});
   if(!db.objectStoreNames.contains('groupLinks')){
     const groups=db.createObjectStore('groupLinks',{keyPath:['generation','dimension','value','reference','id']});
     groups.createIndex('byGroupReference',['generation','dimension','value','reference','id']);
   }
 };r.onsuccess=()=>{r.result.onversionchange=()=>r.result.close();yes(r.result);};});}
 async function batch(db,generation,type,items){if(!items.length)return;
   const tx=db.transaction(['records','links','groupLinks','sortKeys'],'readwrite'),done=complete(tx),records=tx.objectStore('records'),links=tx.objectStore('links'),groups=tx.objectStore('groupLinks'),sortKeys=tx.objectStore('sortKeys');
   try{for(const r of items){const id=String(r.id),reference=String(r.reference||'');records.add({...r,id,reference,generation,type});
    if(type==='deliverables'){
     for(const field of SORT_FIELDS)sortKeys.put({generation,type,field,value:sortText(r,field),id});
     for(const ics of new Set(r.icsCodes||[]))links.put({generation,dimension:'ics',value:String(ics),id});
     if(r.ownerCommittee)links.put({generation,dimension:'committee',value:String(r.ownerCommittee),id});
     for(const dimension of ['ics','committee'])for(const value of hierarchy(dimension,r))groups.put({generation,dimension,value,reference,id});
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
    {const tx=db.transaction('meta','readwrite'),done=complete(tx);tx.objectStore('meta').put({key:'groups:'+generation,ready:true,completedAt:new Date().toISOString()});tx.objectStore('meta').put({key:'sorts:'+generation,ready:true,completedAt:new Date().toISOString()});await done;}
    await activate(db,generation,summary);return summary;
   }catch(e){failure=e;throw e;}finally{db.close();if(failure){try{await purgeGeneration(generation);}catch(_){/* staging can be purged later */}}}
 }
 async function current(){const db=await open();try{return (await meta(db,'active'))||null;}finally{db.close();}}
 // S14-P: build the persistent hierarchical inverted index for already-active S14-M/O generations.
 // Each transaction reads and writes at most batchSize deliverables. The active pointer is untouched.
 async function ensureGroupIndex({batchSize=300,onProgress}={}){
   if(!Number.isInteger(batchSize)||batchSize<1||batchSize>1000)throw Error('batchSize must be 1..1000');
   const db=await open();
   try{
     const active=await meta(db,'active');if(!active)return {ready:false,reason:'no-active-generation'};
     const generation=active.generation,key='groups:'+generation;
     if((await meta(db,key))?.ready)return {ready:true,alreadyBuilt:true,generation};
     const low=[generation,'deliverables',''], high=[generation,'deliverables','\uffff'];
     let cursorAfter=null,processed=0,linksWritten=0;
     for(;;){
       // Cursor and writes share a transaction, so no async network or await inside it.
       const tx=db.transaction(['records','groupLinks'],'readwrite'),done=complete(tx);
       const store=tx.objectStore('records'),groups=tx.objectStore('groupLinks');
       const start=cursorAfter?IDBKeyRange.bound(cursorAfter,high,true,false):range(low,high);
       const result=await new Promise((resolve,reject)=>{
         let count=0,created=0,last=null,exhausted=false;
         const req=store.openCursor(start);
         req.onerror=()=>reject(req.error||Error('ISO group index cursor failed'));
         req.onsuccess=()=>{
           const cur=req.result;
           if(!cur){exhausted=true;resolve({count,created,last,exhausted});return;}
           if(count>=batchSize){resolve({count,created,last,exhausted:false});return;}
           const row=cur.value,reference=String(row.reference||''),id=String(row.id);
           for(const dimension of ['ics','committee'])for(const value of hierarchy(dimension,row)){
             groups.put({generation,dimension,value,reference,id});created++;
           }
           count++;last=cur.key;cur.continue();
         };
         tx.addEventListener('abort',()=>reject(tx.error||Error('ISO group index transaction aborted')),{once:true});
       });
       await done;
       processed+=result.count;linksWritten+=result.created;
       onProgress?.({generation,processed,linksWritten});
       if(result.exhausted||!result.count)break;
       cursorAfter=result.last;
     }
     // Mark READY only after ALL batches committed; an interrupted build never becomes queryable.
     const tx=db.transaction('meta','readwrite'),done=complete(tx);
     tx.objectStore('meta').put({key,ready:true,completedAt:new Date().toISOString(),processed,linksWritten});await done;
     return {ready:true,alreadyBuilt:false,generation,processed,linksWritten};
   }finally{db.close();}
 }
 // Backfill sort indexes for already-installed S14-M/S14-OP generations; no ISO redownload.
 async function ensureSortIndex({batchSize=300,onProgress}={}){
   if(!Number.isInteger(batchSize)||batchSize<1||batchSize>1000)throw Error('Invalid sort batch size');
   const db=await open();try{
     const active=await meta(db,'active');if(!active)return {ready:false,reason:'no-active-generation'};
     const generation=active.generation,key='sorts:'+generation;
     if((await meta(db,key))?.ready)return {ready:true,alreadyBuilt:true,generation};
     const low=[generation,'deliverables',''],high=[generation,'deliverables','\uffff'];
     let after=null,processed=0;
     for(;;){
       const tx=db.transaction(['records','sortKeys'],'readwrite'),done=complete(tx),store=tx.objectStore('records'),sortKeys=tx.objectStore('sortKeys');
       const start=after?IDBKeyRange.bound(after,high,true,false):range(low,high);
       const batchResult=await new Promise((resolve,reject)=>{
         let count=0,last=null,exhausted=false;
         const req=store.openCursor(start);
         req.onerror=()=>reject(req.error||Error('Sort index cursor failed'));
         req.onsuccess=()=>{
           const cursor=req.result;if(!cursor){exhausted=true;resolve({count,last,exhausted});return;}
           if(count>=batchSize){resolve({count,last,exhausted:false});return;}
           const row=cursor.value,id=String(row.id);
           for(const field of SORT_FIELDS)sortKeys.put({generation,type:'deliverables',field,value:sortText(row,field),id});
           count++;last=cursor.key;cursor.continue();
         };
         tx.addEventListener('abort',()=>reject(tx.error||Error('Sort index transaction aborted')),{once:true});
       });
       await done;processed+=batchResult.count;onProgress?.({generation,processed});
       if(batchResult.exhausted||!batchResult.count)break;after=batchResult.last;
     }
     const tx=db.transaction('meta','readwrite'),done=complete(tx);tx.objectStore('meta').put({key,ready:true,processed,completedAt:new Date().toISOString()});await done;
     return {ready:true,alreadyBuilt:false,processed,generation};
   }finally{db.close();}
 }
 async function sortIndexStatus(){const db=await open();try{const a=await meta(db,'active');if(!a)return {ready:false,reason:'no-active-generation'};
   return {generation:a.generation,ready:Boolean((await meta(db,'sorts:'+a.generation))?.ready)};
 }finally{db.close();}}
 async function groupIndexStatus(){const db=await open();try{const a=await meta(db,'active');if(!a)return {ready:false,reason:'no-active-generation'};
   return {generation:a.generation,release:a.summary?.release,ready:Boolean((await meta(db,'groups:'+a.generation))?.ready)};
 }finally{db.close();}}

 async function page({type='deliverables',limit=100,after=null,dimension=null,value=null,values=null,search=null,groupKey=null,sortField='reference',sortDirection='asc',icsFilter=null,committeeFilter=null,advancedQuery=null}={}){
   if(!Number.isInteger(limit)||limit<1||limit>500)throw Error('Limit must be 1..500');
   const db=await open();try{
    const active=await meta(db,'active');if(!active)return {records:[],next:null,total:0,release:null};
    const generation=active.generation;
    if(!['reference','title','titleEn','stage'].includes(sortField)||!['asc','desc'].includes(sortDirection))throw Error('Unsupported global sort');
    const sorted=type==='deliverables'&&sortField!=='reference';
    if(sorted&&!((await meta(db,'sorts:'+generation))?.ready))throw Error('Global sort index not ready');
    const backwards=sortDirection==='desc';
    const selectors=Array.isArray(values)?[...new Set(values.map(String))]:null;
    const groupReady=Boolean((await meta(db,'groups:'+generation))?.ready);
    // For combined filters, start from the narrower hierarchy index when possible.
    if(!dimension&&icsFilter&&groupReady){dimension='ics';groupKey=String(icsFilter).trim();}
    else if(!dimension&&committeeFilter&&groupReady){dimension='committee';groupKey=String(committeeFilter).trim();}
    const grouped=dimension&&groupKey!=null&&type==='deliverables'&&groupReady&&!sorted;
    const matching=!grouped&&dimension&&value!=null&&!selectors;
    const scanGroup=dimension&&selectors!==null;
    if((matching||scanGroup)&&!['ics','committee'].includes(dimension))throw Error('Unknown dimension');
    if(selectors&&selectors.length>2000)throw Error('Too many group selectors');
    const selectorSet=selectors?new Set(selectors):null;
    const groupAccept=item=>{
      if(!item)return false;
      const selected=sorted&&groupKey!=null&&dimension?hierarchy(dimension,item).includes(String(groupKey)):
        grouped||!scanGroup||groupMatches(item,dimension,selectorSet);
      return selected&&(!icsFilter||hierarchy('ics',item).includes(String(icsFilter).trim()))&&
        (!committeeFilter||hierarchy('committee',item).includes(String(committeeFilter).trim()));
    };
    const tx=db.transaction(sorted?['sortKeys','records']:grouped?['groupLinks','records']:matching?['links','records']:['records'],'readonly');
    const index=sorted?tx.objectStore('sortKeys'):grouped?tx.objectStore('groupLinks').index('byGroupReference'):matching?tx.objectStore('links').index('byValue'):tx.objectStore('records').index('byReference');
    const lo=sorted?[generation,type,sortField,'','']:grouped?[generation,dimension,String(groupKey),'','']:matching?[generation,dimension,String(value),'']:[generation,type,'',''];
    const hi=sorted?[generation,type,sortField,'\uffff','\uffff']:grouped?[generation,dimension,String(groupKey),'\uffff','\uffff']:matching?[generation,dimension,String(value),'\uffff']:[generation,type,'\uffff','\uffff'];
    const engine=advancedQuery?root.__radarIsoAdvancedQuery:null;
    if(advancedQuery){if(!engine?.validate)throw Error('Advanced query evaluator unavailable');engine.validate(advancedQuery);}
    const normalized=String(search||'').trim().toLocaleLowerCase();
    return await new Promise((resolve,reject)=>{
      const output=[];let bookmark=null,finished=false;
      const start=after?(backwards?IDBKeyRange.bound(lo,after,false,true):IDBKeyRange.bound(after,hi,true,false)):range(lo,hi);
      const query=index.openCursor(start,backwards?'prev':'next');query.onerror=()=>reject(query.error||Error('Cursor failed'));
      query.onsuccess=()=>{if(finished)return;const cursor=query.result;
       if(!cursor){finished=true;resolve({records:output,next:null,release:active.summary.release,total:grouped||matching||scanGroup||normalized||advancedQuery||icsFilter||committeeFilter?null:active.summary.datasets[type]?.count??null});return;}
       const processItem=item=>{
        if(item&&groupAccept(item)&&(!advancedQuery||engine.matches(item,advancedQuery))&&(!normalized||[item.reference,item.title,item.scope,item.titleI18n?.en,item.scopeI18n?.en,item.ownerCommittee,(item.icsCodes||[]).join(' ')].some(v=>String(v||'').toLocaleLowerCase().includes(normalized)))){
          output.push(item);bookmark=cursor.key;
          if(output.length>=limit){finished=true;resolve({records:output,next:bookmark,release:active.summary.release,total:grouped||matching||scanGroup||normalized||advancedQuery||icsFilter||committeeFilter?null:active.summary.datasets[type]?.count??null});return;}
        }
        cursor.continue();
       };
       if(sorted||grouped||matching){const itemReq=tx.objectStore('records').get([generation,type,cursor.value.id]);itemReq.onerror=()=>reject(itemReq.error);itemReq.onsuccess=()=>processItem(itemReq.result);}
       else processItem(cursor.value);
      };
      tx.onabort=()=>{if(!finished){finished=true;reject(tx.error||Error('Cursor aborted'));}};
     });
   }finally{db.close();}
 }
 // Cleanup is explicit; a failed import does not change the active generation.
 async function purgeGeneration(generation,{batchSize=500}={}){
  const db=await open();try{if((await meta(db,'active'))?.generation===generation)throw Error('Cannot purge active generation');
   for(const storeName of ['records','links','groupLinks','sortKeys']){
    for(;;){const keys=await new Promise((resolve,reject)=>{const tx=db.transaction(storeName,'readonly'),req=tx.objectStore(storeName).openKeyCursor();const found=[];
      req.onerror=()=>reject(req.error);req.onsuccess=()=>{const c=req.result;if(!c||found.length===batchSize){resolve(found);return;}if(c.key[0]===generation)found.push(c.key);c.continue();};});
      if(!keys.length)break;
      const tx=db.transaction(storeName,'readwrite'),done=complete(tx),store=tx.objectStore(storeName);for(const k of keys)store.delete(k);await done;
    }
   }
  }finally{db.close();}
 }
 /* S14-O GROUP WINDOWS: index for direct links; bounded cursor scan for descendant groups */
 /* S14-N BY-ID LOOKUP */
 async function get({type='deliverables',id}={}){
   if(!['deliverables','committees','ics'].includes(type)||id==null)throw Error('Invalid ISO record lookup');
   const db=await open();try{const active=await meta(db,'active');if(!active)return null;const tx=db.transaction('records','readonly');return (await request(tx.objectStore('records').get([active.generation,type,String(id)])))||null;}finally{db.close();}
 }
 root.__radarIsoWindowed=Object.freeze({open,importRelease,page,current,purgeGeneration,get,groupMatches,hierarchy,ensureGroupIndex,groupIndexStatus,ensureSortIndex,sortIndexStatus});
 if(typeof module!=='undefined'&&module.exports)module.exports=root.__radarIsoWindowed;
})(typeof window!=='undefined'?window:globalThis);
