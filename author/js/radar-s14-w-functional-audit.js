/* S14-W: verify functional catalogue queries against actual nonempty data.
 * No full-catalogue arrays, no catalogue writes except the derived sortKeys index.
 */
(function(root){
 'use strict';
 const now=()=>typeof performance!=='undefined'?performance.now():Date.now();
 const normalize=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase();
 const sortedValue=(row,field)=>{
   const v=field==='titleEn'?(row.titleI18n?.en||row.titleEn||row.title||row.reference):
     field==='title'?(row.titleI18n?.fr||row.titleI18n?.en||row.title||row.reference):
     field==='stage'?(row.currentStage||row.stage||''):row.reference;
   return normalize(typeof v==='string'?v:Array.isArray(v)?v.join(' '):v&&typeof v==='object'?Object.values(v).find(x=>typeof x==='string')||'':v);
 };
 async function run({limit=40,buildSortIndex=true,onProgress}={}){
  if(!Number.isInteger(limit)||limit<1||limit>100)throw Error('limit must be 1..100');
  const report={operation:'S14-W-FUNCTIONAL-CATALOGUE-AUDIT',startedAt:new Date().toISOString(),status:'error',checks:{},warnings:[]};
  const api=root.__radarIsoWindowed;
  const measured=async(name,fn)=>{const t=now();try{const result=await fn();report.checks[name]={status:'passed',ms:Math.round(now()-t),...result};return result;}catch(error){report.checks[name]={status:'failed',ms:Math.round(now()-t),error:String(error?.message??error)};return null;}};
  const pair=async(query)=>{
   const first=await api.page({...query,limit});
   const second=first.next?await api.page({...query,limit,after:first.next}):{records:[],next:null};
   const firstIds=first.records.map(r=>String(r.id)),secondIds=second.records.map(r=>String(r.id));
   return {first,second,distinct:new Set(firstIds.concat(secondIds)).size===firstIds.length+secondIds.length};
  };
  try{
   if(!api?.current||!api?.page||!api?.ensureSortIndex||!api?.sortIndexStatus)throw Error('S14-V windowed API unavailable');
   const active=await api.current();if(!active)throw Error('No active ISO generation');
   report.release=active.summary?.release;report.generation=active.generation;
   // Pick an actual row with both classifications; never assume ICS 07 intersects ISO/TC 121.
   const sample=await measured('discoverExistingCombination',async()=>{
    let after=null,examined=0;
    for(let i=0;i<12;i++){
     const page=await api.page({type:'deliverables',limit:100,after});
     examined+=page.records.length;
     const row=page.records.find(r=>Array.isArray(r.icsCodes)&&r.icsCodes.some(Boolean)&&String(r.ownerCommittee||'').trim());
     if(row)return {found:true,examined,sample:{id:String(row.id),ics:String(row.icsCodes.find(Boolean)),committee:String(row.ownerCommittee),reference:String(row.reference||'')}};
     if(!page.next)break;after=page.next;
    }
    return {found:false,examined};
   });
   if(sample?.found){
    const {ics,committee,id,reference}=sample.sample;
    await measured('combinedFiltersNonEmpty',async()=>{
     const p=await pair({type:'deliverables',icsFilter:ics,committeeFilter:committee});
     const ids=p.first.records.concat(p.second.records).map(r=>String(r.id));
     if(!ids.includes(id))throw Error('Known matching ISO record missing from combined filters');
     if(!p.distinct)throw Error('Overlapping window results');
     return {first:p.first.records.length,second:p.second.records.length,knownIdFound:true,distinct:true,ics,committee};
    });
    if(reference){
     await measured('combinedFiltersAndTextSearch',async()=>{
      const p=await api.page({type:'deliverables',limit,icsFilter:ics,committeeFilter:committee,search:reference});
      if(!p.records.some(r=>String(r.id)===id))throw Error('Known matching record missing from text search');
      return {rows:p.records.length,knownIdFound:true};
     });
    }
   }else report.warnings.push('No row with both ICS and committee found in sampled 1200 records; cannot validate a non-empty intersection');
   report.sortIndexBefore=await api.sortIndexStatus();
   if(!report.sortIndexBefore.ready&&buildSortIndex){
    report.sortBuild=await measured('buildSortIndex',async()=>{
     let last=0;
     const result=await api.ensureSortIndex({batchSize:300,onProgress:p=>{
      if(p.processed-last>=5000){last=p.processed;onProgress?.({phase:'sortIndex',processed:p.processed});}
     }});
     return {ready:result.ready,processed:result.processed??null,alreadyBuilt:result.alreadyBuilt??false};
    });
   }
   report.sortIndexAfter=await api.sortIndexStatus();
   if(report.sortIndexAfter.ready){
    for(const field of ['title','titleEn','stage'])for(const direction of ['asc','desc']){
     await measured('sort_'+field+'_'+direction,async()=>{
      const p=await pair({type:'deliverables',sortField:field,sortDirection:direction});
      const values=p.first.records.concat(p.second.records).map(r=>sortedValue(r,field));
      const ordered=values.every((v,i)=>i===0||(direction==='asc'?values[i-1]<=v:values[i-1]>=v));
      if(!ordered||!p.distinct)throw Error('Sort order or window uniqueness failed');
      return {first:p.first.records.length,second:p.second.records.length,ordered,distinct:p.distinct};
     });
    }
   }else report.warnings.push('Global title/stage sort index is not ready');
   report.ui={gridRows:root.w2ui?.standardReferencesGrid?.records?.length??null,
     bounded:(root.w2ui?.standardReferencesGrid?.records?.length??0)<=1000};
   if(!report.ui.bounded)report.warnings.push('w2grid currently contains >1000 rows');
   const failed=Object.values(report.checks).some(c=>c.status==='failed');
   report.status=failed?'failed':report.sortIndexAfter?.ready&&sample?.found?'passed':'partial';
  }catch(error){report.error=String(error?.message??error);}
  report.completedAt=new Date().toISOString();return report;
 }
 root.__radarS14W=Object.freeze({run});
 if(typeof module!=='undefined'&&module.exports)module.exports=root.__radarS14W;
})(typeof window!=='undefined'?window:globalThis);
