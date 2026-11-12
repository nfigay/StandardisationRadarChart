/* S14-A — Offline ISO Open Data importer and IndexedDB read cache.
 * Source: ISO Open Data JSONLines datasets. No RSS or network access here.
 * Keep this cache distinct from the user-authored standards registry and blips.
 */
(function (root) {
  'use strict';
  const DB_NAME = 'standardisation-radar-iso-cache';
  const DB_VERSION = 1;
  const types = Object.freeze({deliverables:'iso_deliverables_metadata',committees:'iso_technical_committees'});
  const clean = x => String(x ?? '').trim();
  const localized = v => typeof v === 'string' ? v : clean(v?.fr || v?.en || '');
  const textOnly = v => clean(v).replace(/<\s*br\s*\/?>/gi,'\n').replace(/<\/(?:p|div|li|h[1-6])>/gi,'\n').replace(/<[^>]*>/g,'').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'\"').replace(/\n[ \t]+/g,'\n').trim();
  const translations = v => v && typeof v==='object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).map(([k,val])=>[k,textOnly(val)])) : (typeof v==='string'?{und:textOnly(v)}:{});
  const flatten = v => textOnly(localized(v));
  const ids = v => Array.isArray(v) ? v.map(clean).filter(Boolean) : [];
  const norm = v => clean(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  function normalize(type, item) {
    if (!item || typeof item !== 'object' || !Number.isFinite(Number(item.id))) return null;
    const id = String(item.id);
    if (type === 'deliverables') return {
      id, reference:clean(item.reference), title:localized(item.title), scope:flatten(item.scope),
      titleI18n:translations(item.title),scopeI18n:translations(item.scope),
      icsCodes:Array.isArray(item.icsCode)?[...new Set(item.icsCode.map(clean).filter(Boolean))]:[],
      ownerCommittee:clean(item.ownerCommittee), currentStage:item.currentStage==null?'':clean(item.currentStage),
      edition:item.edition==null?'':clean(item.edition), publicationDate:clean(item.publicationDate),
      replaces:ids(item.replaces),replacedBy:ids(item.replacedBy),languages:ids(item.languages),
      deliverableType:clean(item.deliverableType),supplementType:clean(item.supplementType),pages:item.pages??null,
      sourceData:item, source:'iso_deliverables_metadata', sourceRecordId:id
    };
    if (type === 'committees') return {
      id,reference:clean(item.reference),title:localized(item.title),scope:flatten(item.scope),
      titleI18n:translations(item.title),scopeI18n:translations(item.scope),sourceData:item,
      parentId:item.parentId==null?'':clean(item.parentId),status:clean(item.status),
      source:'iso_technical_committees',sourceRecordId:id
    };
    throw new Error('Jeu de données non reconnu');
  }
  function openDB() {
    return new Promise((resolve,reject)=>{
      if (!root.indexedDB) { reject(new Error('IndexedDB indisponible')); return; }
      const r=root.indexedDB.open(DB_NAME,DB_VERSION);
      r.onupgradeneeded=()=>{
        const db=r.result;
        for(const name of ['deliverables','committees']){
          if(!db.objectStoreNames.contains(name)){
            const s=db.createObjectStore(name,{keyPath:'id'});
            s.createIndex('reference','reference',{unique:false});
          }
        }
        if(!db.objectStoreNames.contains('sync'))db.createObjectStore('sync',{keyPath:'type'});
      };
      r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error||new Error('IndexedDB impossible à ouvrir'));
    });
  }
  function transaction(db,store,mode,operation){return new Promise((resolve,reject)=>{
    const tx=db.transaction(store,mode);const s=tx.objectStore(store);
    try{operation(s);}catch(e){tx.abort();reject(e);return;}
    tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error||new Error('Transaction IndexedDB échouée'));
    tx.onabort=()=>reject(tx.error||new Error('Transaction IndexedDB annulée'));
  });}
  async function* lines(file){
    if(typeof file.stream==='function' && typeof TextDecoder!=='undefined'){
      const reader=file.stream().getReader();const decoder=new TextDecoder();let partial='';
      try{for(;;){const {done,value}=await reader.read();if(done)break;partial+=decoder.decode(value,{stream:true});let pos;
        while((pos=partial.indexOf('\n'))!==-1){yield partial.slice(0,pos).replace(/\r$/,'');partial=partial.slice(pos+1);}}
        partial+=decoder.decode();if(partial.trim())yield partial;
      }finally{reader.releaseLock();}return;
    }
    for(const line of (await file.text()).split(/\r?\n/))yield line;
  }
  async function importJsonLines(type,file,onProgress){
    if(!types[type])throw new Error('Type de données ISO non reconnu');
    if(!file || typeof file.text!=='function')throw new Error('Fichier JSONLines requis');
    const db=await openDB(); let count=0, lineNumber=0, batch=[];
    try{
      // Explicitly replaces the selected *cache dataset*, never user-authored references.
      await transaction(db,type,'readwrite',s=>s.clear());
      for await(const line of lines(file)){
        lineNumber++;if(!line.trim())continue;
        let item;try{item=JSON.parse(line);}catch(e){throw new Error(`JSONL invalide, ligne ${lineNumber}: ${e.message}`);}
        const normalized=normalize(type,item);if(!normalized)throw new Error(`Enregistrement ISO invalide, ligne ${lineNumber}`);
        batch.push(normalized);count++;
        if(batch.length>=400){const block=batch;batch=[];await transaction(db,type,'readwrite',s=>block.forEach(r=>s.put(r)));onProgress?.(count);}
      }
      if(batch.length)await transaction(db,type,'readwrite',s=>batch.forEach(r=>s.put(r)));
      await transaction(db,'sync','readwrite',s=>s.put({type,source:types[type],count,updatedAt:new Date().toISOString(),filename:clean(file.name)}));
      onProgress?.(count);return {type,count};
    }catch(e){
      // Failed partial import is cleared to prevent a partial dataset being presented as complete.
      await transaction(db,type,'readwrite',s=>s.clear());
      await transaction(db,'sync','readwrite',s=>s.delete(type));throw e;
    }finally{db.close();}
  }
  async function readAll(type){
    if(!types[type])throw new Error('Type ISO inconnu');const db=await openDB();
    try{return await new Promise((resolve,reject)=>{
      const r=db.transaction(type,'readonly').objectStore(type).getAll();
      r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
    });}finally{db.close();}
  }
  async function syncInfo(){const db=await openDB();try{return await new Promise((resolve,reject)=>{
    const r=db.transaction('sync','readonly').objectStore('sync').getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
  });}finally{db.close();}}
  function committeeTree(committees,standards,term=''){
    const q=norm(term),nodes=new Map(),byRef=new Map();
    for(const c of committees||[])if(c.id&&!nodes.has(String(c.id))){
      const n={recid:'committee:'+c.id,kind:'committee',identifier:c.reference,title:c.title,description:c.scope,status:c.status,w2ui:{children:[],expanded:false},_parent:c.parentId};
      nodes.set(String(c.id),n);byRef.set(norm(c.reference).replace(/\s*\/\s*/g,'/').replace(/\s+/g,' '),n);
    }
    for(const s of standards||[]){const ref=norm(s.ownerCommittee).replace(/\s*\/\s*/g,'/').replace(/\s+/g,' ');const n=byRef.get(ref);if(!n)continue;
      n.w2ui.children.push({recid:`committee-standard:${n.recid}:${s.id}`,kind:'standard',isoId:s.id,identifier:s.reference,title:s.title,titleEn:s.titleI18n?.en||'',description:s.scope,stage:s.currentStage});}
    const roots=[];
    for(const n of nodes.values()){const parent=nodes.get(String(n._parent));if(parent&&parent!==n){parent.w2ui.children.push(n);}else roots.push(n);delete n._parent;}
    const visited=new Set();
    function filter(n,stack=new Set(),keepAll=false){
      if(stack.has(n.recid))return null;const next=new Set(stack);next.add(n.recid);
      const ownMatch=norm([n.identifier,n.title,n.description,n.status,n.stage].join(' ')).includes(q);
      const children=(n.w2ui?.children||[]).map(c=>filter(c,next,keepAll||ownMatch)).filter(Boolean);
      if(q&&!keepAll&&!ownMatch&&!children.length)return null;
      return {...n,w2ui:n.kind==='committee'?{children,expanded:Boolean(q&&children.length)}:undefined};
    }
    const out=roots.map(r=>filter(r)).filter(Boolean);
    // Disconnected or invalid parent graphs are shown, rather than silently omitted.
    function mark(n){if(visited.has(n.recid))return;visited.add(n.recid);for(const c of n.w2ui?.children||[])mark(c);}
    roots.forEach(mark);
    for(const n of nodes.values())if(!visited.has(n.recid)){const x=filter(n);if(x)out.push(x);mark(n);}
    return out;
  }
  root.__radarIsoOpenData=Object.freeze({normalize,committeeTree,importJsonLines,readAll,syncInfo,types});
})(window);
