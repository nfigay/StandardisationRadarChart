/* S14-L3 — ISO sidebar navigation: view projections only, no additional store. */
(function(root){
 'use strict';
 const str=v=>String(v??'').trim();
 const norm=v=>str(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s*\/\s*/g,'/').replace(/\s+/g,' ');
 function create(ics,committees,standards){
   const documents=Array.isArray(standards)?standards:[];
   const nodes={ics:new Map(),committees:new Map()};
   const rows={ics:new Map(),committees:new Map()};
   for(const raw of ics||[]){const id=str(raw.identifier);if(id&&!nodes.ics.has(id))nodes.ics.set(id,{id,parent:str(raw.parent),reference:id,title:raw.titleFr||raw.titleEn||id,titleEn:raw.titleEn||'',description:'',raw});}
   for(const raw of committees||[]){const id=str(raw.id);if(id&&!nodes.committees.has(id))nodes.committees.set(id,{id,parent:str(raw.parentId),reference:str(raw.reference),title:raw.titleI18n?.fr||raw.title||raw.titleI18n?.en||str(raw.reference),titleEn:raw.titleI18n?.en||'',description:raw.scopeI18n?.fr||raw.scope||'',raw});}
   for(const mode of ['ics','committees'])for(const node of nodes[mode].values())node.children=[];
   for(const mode of ['ics','committees'])for(const node of nodes[mode].values())if(node.parent&&node.parent!==node.id&&nodes[mode].has(node.parent))nodes[mode].get(node.parent).children.push(node.id);
   const committeeRefs=new Map();for(const node of nodes.committees.values())committeeRefs.set(norm(node.reference),node.id);
   nodes.ics.set('__unclassified__',{id:'__unclassified__',parent:'',reference:'—',title:'Sans classification ICS',titleEn:'Unclassified',description:'',raw:{},children:[]});
   nodes.committees.set('__unclassified__',{id:'__unclassified__',parent:'',reference:'—',title:'Sans comité connu',titleEn:'Unassigned committee',description:'',raw:{},children:[]});
   function attach(mode,key,doc){if(!rows[mode].has(key))rows[mode].set(key,[]);rows[mode].get(key).push(doc);}
   for(const doc of documents){
     for(const code of new Set(Array.isArray(doc.icsCodes)&&doc.icsCodes.length?doc.icsCodes:['']))attach('ics',str(code)||'__unclassified__',doc);
     const committee=committeeRefs.get(norm(doc.ownerCommittee));attach('committees',committee||'__unclassified__',doc);
   }
   function descendants(mode,id){const found=new Set(),walk=(node)=>{if(found.has(node))return;found.add(node);for(const child of nodes[mode].get(node)?.children||[])walk(child);};walk(id);return found;}
   function list(mode,id,query='',withDescendants=true){
     if(mode!=='ics'&&mode!=='committees')return [];
     if(id==null){const q=norm(query);return documents.filter(doc=>!q||norm([doc.reference,doc.title,doc.titleI18n?.en,doc.scope,doc.scopeI18n?.en,doc.currentStage,(doc.icsCodes||[]).join(' '),doc.ownerCommittee].join(' ')).includes(q));}
     const ids=withDescendants?[...descendants(mode,id)]:[id];
     const result=[],seen=new Set(),q=norm(query);
     for(const key of ids){for(const doc of rows[mode].get(key)||[]){const identity=str(doc.id)||str(doc.reference);if(seen.has(identity))continue;seen.add(identity);if(!q||norm([doc.reference,doc.title,doc.titleI18n?.en,doc.scope,doc.scopeI18n?.en,doc.currentStage,(doc.icsCodes||[]).join(' '),doc.ownerCommittee].join(' ')).includes(q))result.push(doc);}}
     return result;
   }
   function sidebar(mode,language='fr'){
     const collection=nodes[mode];if(!collection)return [];
     const added=new Set();
     function build(id,ancestry){if(ancestry.has(id)||added.has(id))return null;const item=collection.get(id);if(!item)return null;added.add(id);const next=new Set(ancestry);next.add(id);
       const children=item.children.map(child=>build(child,next)).filter(Boolean);
       const title=(language==='en'&&item.titleEn?item.titleEn:item.title);
       return {id:mode+':'+id,text:str(item.reference)+' — '+str(title),nodes:children,expanded:false,group:false};
     }
     const roots=[];
     for(const item of collection.values())if(!item.parent||!collection.has(item.parent)||item.parent===item.id){const node=build(item.id,new Set());if(node)roots.push(node);}
     for(const item of collection.values())if(!added.has(item.id)){const node=build(item.id,new Set());if(node)roots.push(node);}
     return roots;
   }
   function get(mode,id){return nodes[mode]?.get(id)||null;}
   return {sidebar,list,get,count:documents.length,counts:{ics:nodes.ics.size,committees:nodes.committees.size}};
 }
 root.__radarIsoSidebarIndex=Object.freeze({create});
})(typeof window!=='undefined'?window:globalThis);
