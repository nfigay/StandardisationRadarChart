/* S14-H — RSS event cache for ISO feeds, separate from the authoritative standard registry. */
(function(root){'use strict';
 const DB='radar-iso-rss-cache-v1',STORE='events',META='meta';
 function openDB(){return new Promise((resolve,reject)=>{const req=indexedDB.open(DB,1);req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:'id'});if(!db.objectStoreNames.contains(META))db.createObjectStore(META,{keyPath:'key'});};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
 async function transact(mode,fn){const db=await openDB();try{return await new Promise((resolve,reject)=>{const tx=db.transaction([STORE,META],mode);let result;try{result=fn(tx);}catch(e){tx.abort();reject(e);return;}tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error);});}finally{db.close();}}
 const request=(tx,store,method,...args)=>new Promise((resolve,reject)=>{const r=tx.objectStore(store)[method](...args);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
 async function readAll(){const db=await openDB();try{return await new Promise((res,rej)=>{const r=db.transaction(STORE,'readonly').objectStore(STORE).getAll();r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});}finally{db.close();}}
 async function getMarker(){const db=await openDB();try{return await new Promise((res,rej)=>{const r=db.transaction(META,'readonly').objectStore(META).get('manifest');r.onsuccess=()=>res(r.result?.value||'');r.onerror=()=>rej(r.error);});}finally{db.close();}}
 const trim=x=>String(x||'').trim();
 function parse(xml,feed){
  const doc=new DOMParser().parseFromString(xml,'application/xml');
  if(doc.querySelector('parsererror'))throw Error('Flux XML invalide');
  const entries=[...doc.querySelectorAll('item, entry')];
  return entries.slice(0,1000).map((node,index)=>{
   const direct=(tag)=>{const child=[...node.children].find(c=>c.localName===tag);return trim(child?.textContent);};
   const linkEl=[...node.children].find(c=>c.localName==='link');
   const href=trim(linkEl?.getAttribute('href')||direct('link'));
   let link='';try{const u=new URL(href);if(u.protocol==='https:'&&u.hostname.endsWith('.iso.org'))link=u.href;}catch(_){/* no external link */}
   const guid=direct('guid')||direct('id')||link||String(index);
   return {id:feed.file+':'+guid,title:direct('title'),description:direct('description')||direct('summary'),published:direct('pubDate')||direct('published')||direct('updated'),url:link,feedUrl:feed.url,feedName:feed.name||feed.url,fetchedAt:feed.fetchedAt};
  });
 }
 async function syncLocal(force=false){
  const response=await fetch('./iso-rss-cache/manifest.json',{cache:'no-store'});
  if(response.status===404)return {updated:false,count:(await readAll()).length,reason:'not-configured'};
  if(!response.ok)throw Error('Manifeste RSS HTTP '+response.status);
  const data=await response.json();if(data.version!==1||!Array.isArray(data.feeds))throw Error('Manifeste RSS incompatible');
  const marker=data.feeds.map(f=>f.file+':'+f.sha256).join('|');
  if(!force&&marker===await getMarker())return {updated:false,count:(await readAll()).length};
  let entries=[];
  for(const f of data.feeds){
   if(!/^[a-f0-9]{24}\.xml$/.test(f.file)||!/^[a-f0-9]{64}$/.test(f.sha256))throw Error('Manifeste RSS invalide');
   const res=await fetch('./iso-rss-cache/'+f.file,{cache:'no-store'});if(!res.ok)throw Error('Flux local HTTP '+res.status);
   const xml=await res.text();entries.push(...parse(xml,f));
  }
  const db=await openDB();try{await new Promise((resolve,reject)=>{
   const tx=db.transaction([STORE,META],'readwrite');
   const store=tx.objectStore(STORE);store.clear();for(const e of entries)store.put(e);
   tx.objectStore(META).put({key:'manifest',value:marker});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
  });}finally{db.close();}
  return {updated:true,count:entries.length};
 }
 root.__radarIsoRss=Object.freeze({syncLocal,readAll,parse});
})(window);
