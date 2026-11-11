/* S14-X — Search-result driven ICS / TC-SC tree, bounded record windows. */
(function(root){
 'use strict';
 const str=value=>String(value??'').trim();
 const norm=value=>str(value).toLocaleLowerCase().replace(/\s+/g,' ');
 function prune(nodes, matched){
   return (nodes||[]).map(node=>{
     const children=prune(node.nodes||[],matched);
     if(!matched.has(str(node.id))&&!children.length)return null;
     return {...node,nodes:children,expanded:children.length>0?true:!!node.expanded};
   }).filter(Boolean);
 }
 function addAncestors(matched,mode,key,model){
   let node=model.get(mode,key),depth=0;
   const visited=new Set();
   while(node&&depth++<30&&!visited.has(node.id)){
     visited.add(node.id);matched.add(mode+':'+node.id);
     node=node.parent?model.get(mode,node.parent):null;
   }
 }
 function committeeLookup(model,committees){
   const byReference=new Map();
   for(const item of committees||[]){
     const reference=str(item.reference);
     if(reference)byReference.set(norm(reference),str(item.id));
   }
   return byReference;
 }
 async function collect({page,model,mode,query,advancedQuery=null,icsFilter=null,committeeFilter=null,committees=[],cancelled=()=>false,onProgress=()=>{},limit=250}={}){
   if(typeof page!=='function'||!model||!['ics','committees'].includes(mode))throw Error('S14-X: invalid tree search');
   const matched=new Set();const byReference=committeeLookup(model,committees);
   let cursor=null,scanned=0,windows=0;
   const seenCursors=new Set();
   do{
     if(cancelled())return {cancelled:true,matched,scanned,windows};
     const result=await page({type:'deliverables',limit:Math.min(500,Math.max(1,limit)),after:cursor,search:query,advancedQuery,icsFilter,committeeFilter,sortField:'reference',sortDirection:'asc'});
     if(cancelled())return {cancelled:true,matched,scanned,windows};
     const rows=Array.isArray(result?.records)?result.records:[];
     scanned+=rows.length;windows++;
     for(const item of rows){
       if(mode==='ics'){
         const codes=Array.isArray(item.icsCodes)?item.icsCodes:[];
         if(!codes.length)addAncestors(matched,mode,'__unclassified__',model);
         for(const code of codes){
           const value=str(code);let current=value;
           while(current){
             if(model.get(mode,current)){addAncestors(matched,mode,current,model);break;}
             const cut=current.lastIndexOf('.');current=cut<0?'':current.slice(0,cut);
           }
         }
       }else{
         const committee=str(item.ownerCommittee),id=byReference.get(norm(committee));
         if(id)addAncestors(matched,mode,id,model);
         else addAncestors(matched,mode,'__unclassified__',model);
       }
     }
     onProgress({scanned,windows,groups:matched.size});
     const next=result?.next??null;
     if(next==null||!rows.length)break;
     const token=JSON.stringify(next);
     if(seenCursors.has(token))throw Error('S14-X: repeated catalogue cursor');
     seenCursors.add(token);cursor=next;
     // Yield to the UI between windows and allow cancellation of obsolete searches.
     await new Promise(resolve=>setTimeout(resolve,0));
   }while(true);
   return {cancelled:false,matched,scanned,windows};
 }
 root.__radarIsoTreeFilter=Object.freeze({collect,prune,addAncestors});
})(typeof window!=='undefined'?window:globalThis);
