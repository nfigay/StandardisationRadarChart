/* S14-L2 — Indexed tree projection over the complete ISO cache.
 * Read-only source data. Branch pages are materialized only on user request.
 * The indexed source currently lives in memory after the application's IndexedDB readAll().
 */
(function(root){
 'use strict';
 const str=x=>String(x??'').trim();
 const fold=x=>str(x).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const committeeKey=x=>fold(x).replace(/\s*\/\s*/g,'/').replace(/\s+/g,' ');
 const PAGE=100;
 function create(ics,committees,standards){
   const byIcs=new Map(),byCommittee=new Map(),icsNodes=new Map(),committeeNodes=new Map();
   const rows=Array.isArray(standards)?standards:[];
   for(const s of rows){
     for(const code of new Set(Array.isArray(s.icsCodes)&&s.icsCodes.length?s.icsCodes:[''])){
       const key=str(code);if(!byIcs.has(key))byIcs.set(key,[]);byIcs.get(key).push(s);
     }
     const key=committeeKey(s.ownerCommittee);if(!byCommittee.has(key))byCommittee.set(key,[]);byCommittee.get(key).push(s);
   }
   for(const i of ics||[]){const id=str(i.identifier);if(id&&!icsNodes.has(id))icsNodes.set(id,{id,parent:str(i.parent),label:str(i.titleFr||i.titleEn),en:str(i.titleEn),raw:i});}
   for(const c of committees||[]){const id=str(c.id);if(id&&!committeeNodes.has(id))committeeNodes.set(id,{id,parent:str(c.parentId),label:str(c.title),en:str(c.titleI18n?.en),reference:str(c.reference),raw:c});}
   const loaded=new Map();
   const filters={ics:'',committees:''};
   const catalogKey=(mode,id)=>mode+':'+id;
   function matchStandard(s,q){return !q||fold([s.reference,s.title,s.titleI18n?.en,s.scope,s.scopeI18n?.en,s.currentStage,s.ownerCommittee,(s.icsCodes||[]).join(' ')].join(' ')).includes(q);}
   function setFilter(mode,term){const q=fold(term);if(filters[mode]!==q){filters[mode]=q;for(const k of loaded.keys())if(k.startsWith(mode+':'))loaded.delete(k);}}
   function more(mode,id){const key=catalogKey(mode,id);loaded.set(key,(loaded.get(key)||0)+PAGE);}
   function leaf(s,mode,id){return {recid:'iso-tree:'+mode+':'+id+':'+str(s.id),kind:'standard',isoId:str(s.id),identifier:str(s.reference),title:str(s.title),titleEn:str(s.titleI18n?.en),description:str(s.scope),stage:str(s.currentStage),committee:str(s.ownerCommittee)};}
   function makeTree(mode,term=''){
     if(mode!=='ics'&&mode!=='committees')throw Error('Arborescence non reconnue');
     setFilter(mode,term);const q=filters[mode],collection=mode==='ics'?icsNodes:committeeNodes;
     const nodes=new Map(),children=new Map();
     for(const n of collection.values()){
       nodes.set(n.id,{recid:mode+':'+n.id,kind:mode==='ics'?'ics':'committee',identifier:mode==='ics'?n.id:n.reference,title:n.label,titleEn:n.en,description:mode==='ics'?'':str(n.raw.scope),_id:n.id,w2ui:{children:[],expanded:false}});
       if(n.parent&&n.parent!==n.id&&collection.has(n.parent)){
         if(!children.has(n.parent))children.set(n.parent,[]);children.get(n.parent).push(n.id);
       }
     }
     const visible=new Set();let matches=0,renderedStandards=0;
     const qMatches=(node)=>fold([node.identifier,node.title,node.titleEn,node.description].join(' ')).includes(q);
     const visited=new Set();
     function walk(id,parents,ancestorMatches){
       if(parents.has(id))return null;
       const n=nodes.get(id),info=collection.get(id);if(!n)return null;
       const next=new Set(parents);next.add(id);
       const ownMatch=Boolean(q)&&qMatches(n);
       const bucket=mode==='ics'?(byIcs.get(id)||[]):(byCommittee.get(committeeKey(info.reference))||[]);
       // Search the entire dataset, then materialize only a page of matching standards.
       const list=q&&!ancestorMatches&&!ownMatch?bucket.filter(s=>matchStandard(s,q)):bucket;
       const directMatches=list.length;matches+=directMatches;
       const descendants=(children.get(id)||[]).map(child=>walk(child,next,ancestorMatches||ownMatch)).filter(Boolean);
       if(q&&!ancestorMatches&&!ownMatch&&!directMatches&&!descendants.length)return null;
       visible.add(id);const key=catalogKey(mode,id),count=Math.min(loaded.get(key)||0,list.length);
       n.w2ui.children=[...descendants,...list.slice(0,count).map(s=>leaf(s,mode,id))];renderedStandards+=count;
       if(count<list.length)n.w2ui.children.push({recid:'iso-more:'+mode+':'+encodeURIComponent(id),kind:'more',_mode:mode,_id:id,identifier:'+',title:'Afficher les normes ('+count+' / '+list.length+')',remaining:list.length-count});
       n.w2ui.expanded=count>0||descendants.some(child=>Boolean(child.w2ui?.expanded))||Boolean(q&&descendants.length);
       return n;
     }
     const roots=[];
     for(const info of collection.values())if(!info.parent||!collection.has(info.parent)||info.parent===info.id){const node=walk(info.id,new Set(),false);if(node)roots.push(node);}
     // Cyclic or disconnected input must not hide documents.
     for(const info of collection.values())if(!visible.has(info.id)){const node=walk(info.id,new Set(),false);if(node)roots.push(node);}
     if(mode==='ics'&&byIcs.has('')){
       const docs=byIcs.get('');const list=q?docs.filter(s=>matchStandard(s,q)):docs;
       if(list.length){const key=catalogKey(mode,'__unclassified__');const count=Math.min(loaded.get(key)||0,list.length);
         roots.push({recid:'ics:__unclassified__',kind:'ics',identifier:'—',title:'Sans classification ICS',_id:'__unclassified__',w2ui:{children:[...list.slice(0,count).map(s=>leaf(s,mode,'__unclassified__')),...(count<list.length?[{recid:'iso-more:ics:__unclassified__',kind:'more',_mode:'ics',_id:'__unclassified__',identifier:'+',title:'Afficher les normes ('+count+' / '+list.length+')'}]:[])],expanded:count>0}});
       }
     }
     return {records:roots,sourceTotal:rows.length,renderedStandards,matches,groups:collection.size};
   }
   function loadMore(recid){const parts=/^iso-more:(ics|committees):(.+)$/.exec(str(recid));if(!parts)return false;more(parts[1],decodeURIComponent(parts[2]));return true;}
   return {tree:makeTree,loadMore,count:rows.length};
 }
 root.__radarIsoTreeIndex=Object.freeze({create,PAGE});
})(typeof window!=='undefined'?window:globalThis);
