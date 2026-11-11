/* S14-V read-only functional probe. Run from Chrome; no catalogue reimport. */
(function(root){
 'use strict';
 async function run({limit=40}={}){
   const report={operation:'S14-V-FUNCTIONAL-CATALOGUE',timestamp:new Date().toISOString(),status:'error',checks:{}};
   const api=root.__radarIsoWindowed;
   const ids=r=>r.records.map(x=>String(x.id));
   const sample=async(name,options)=>{
     const started=performance.now();
     const first=await api.page({...options,limit});
     const second=first.next?await api.page({...options,limit,after:first.next}):{records:[],next:null};
     const a=ids(first),b=ids(second);
     report.checks[name]={first:a.length,second:b.length,noOverlap:a.every(x=>!b.includes(x)),ms:Math.round(performance.now()-started),next:!!first.next};
     return first;
   };
   try{
     if(!api?.page||!api?.current)throw Error('Windowed ISO API unavailable');
     const active=await api.current();if(!active)throw Error('No active catalogue');
     report.release=active.summary?.release;report.generation=active.generation;
     report.sortIndex=await api.sortIndexStatus?.();
     await sample('referenceAsc',{type:'deliverables',sortField:'reference',sortDirection:'asc'});
     await sample('referenceDesc',{type:'deliverables',sortField:'reference',sortDirection:'desc'});
     await sample('icsParent07',{type:'deliverables',dimension:'ics',groupKey:'07'});
     await sample('combinedIcsAndTc',{type:'deliverables',icsFilter:'07',committeeFilter:'ISO/TC 121'});
     if(report.sortIndex?.ready){
       const title=await sample('titleAsc',{type:'deliverables',sortField:'title',sortDirection:'asc'});
       const values=title.records.map(x=>{
         const v=x.titleI18n?.fr||x.titleI18n?.en||x.title||x.reference||'';
         return String(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
       });
       report.checks.titleAsc.inOrder=values.every((x,i)=>i===0||x>=values[i-1]);
     }
     const grid=root.w2ui?.standardReferencesGrid;
     report.ui={gridPresent:!!grid,gridRecords:grid?.records?.length??null,
       bounded:!!grid&&grid.records.length<=1000,
       sortVisible:!!root.document?.querySelector('select[aria-label="'+(root.i18next?.language?.startsWith('en')?'Sort by':'Trier par')+'"]'),
       icsFilterVisible:!!root.document?.querySelector('input[placeholder="07 / 01.040"]'),
       committeeFilterVisible:!!root.document?.querySelector('input[placeholder="ISO/TC 121"]')};
     report.status=Object.values(report.checks).every(v=>v.noOverlap&&v.inOrder!==false)?'passed':'failed';
   }catch(error){report.error=String(error?.message||error);}
   return report;
 }
 root.__radarS14V=Object.freeze({run});
})(typeof window!=='undefined'?window:globalThis);
