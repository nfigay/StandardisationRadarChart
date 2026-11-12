/* S14-Q: read-only, bounded diagnostics for the active windowed ISO generation. */
(function(root){
 'use strict';
 const bounded = n => Math.max(1, Math.min(100, Number.isInteger(n) ? n : 50));
 const elapsed = start => Math.round((root.performance?.now?.() ?? Date.now()) - start);
 const clock = () => root.performance?.now?.() ?? Date.now();
 const unique = rows => new Set(rows.map(r=>String(r.id))).size===rows.length;
 function heap(){
   const h=root.performance?.memory;
   if(!h||!Number.isFinite(h.usedJSHeapSize))return {available:false,reason:'Chrome performance.memory unavailable or disabled; no memory conclusion'};
   return {available:true,usedJSHeapBytes:h.usedJSHeapSize,jsHeapLimitBytes:h.jsHeapSizeLimit,qualification:'Chrome estimate only; does not measure full browser/IndexedDB memory'};
 }
 async function probe(api,label,options,limit){
   const firstStarted=clock();const first=await api.page({...options,limit});
   const firstMs=elapsed(firstStarted);
   const result={label,first:{rows:first.records.length,ms:firstMs,next:first.next!=null},uniqueFirst:unique(first.records)};
   const nextStarted=clock();
   if(first.next!=null){
     const second=await api.page({...options,after:first.next,limit});
     const ids=new Set(first.records.map(r=>String(r.id)));
     result.second={rows:second.records.length,ms:elapsed(nextStarted),next:second.next!=null};
     result.noOverlap=second.records.every(r=>!ids.has(String(r.id)));
     result.uniqueSecond=unique(second.records);
     result.sampleIds=second.records.slice(0,2).map(r=>String(r.id));
   }else result.second={skipped:true,reason:'no continuation token'};
   result.sampleIdsFirst=first.records.slice(0,2).map(r=>String(r.id));
   return {result,firstRows:first.records};
 }
 async function run({limit=50}={}){
  const report={operation:'S14-Q-WINDOWED-END-TO-END',createdAt:new Date().toISOString(),status:'running',checks:{},warnings:[],memory:{before:heap()}};
  limit=bounded(limit);
  try{
   const api=root.__radarIsoWindowed;
   if(!api?.current||!api?.page||!api?.groupIndexStatus)throw Error('S14-OP API not loaded');
   const active=await api.current(),index=await api.groupIndexStatus();
   report.active={present:!!active,release:active?.summary?.release??null,generation:active?.generation??null,
    deliverables:active?.summary?.datasets?.deliverables?.count??null,committees:active?.summary?.datasets?.committees?.count??null};
   report.index={ready:index.ready===true,generation:index.generation??null};
   if(!active)throw Error('No active windowed generation');
   if(!index.ready)report.warnings.push('Hierarchical index not ready; group scans may be slower');
   const all=await probe(api,'deliverables', {type:'deliverables'},limit); report.checks.deliverables=all.result;
   const committees=await probe(api,'committees', {type:'committees'},limit); report.checks.committees=committees.result;
   const ics=await probe(api,'ICS 01',{type:'deliverables',dimension:'ics',groupKey:'01'},limit);
   report.checks.icsParent=ics.result;
   report.checks.icsParent.membershipValid=ics.firstRows.every(r=>
      (api.hierarchy?.('ics',r)||[]).includes('01'));
   const candidates=all.firstRows.map(r=>String(r.ownerCommittee||'')).filter(Boolean);
   const fullSc=candidates.find(s=>/ISO\/TC\s*\d+\/SC\s*\d+/i.test(s));
   const candidate=fullSc||candidates.find(s=>/ISO\/TC\s*\d+/i.test(s));
   const match=candidate?.match(/ISO\/TC\s*\d+/i);
   if(match){
     const tc=match[0];report.checks.tcParent=(await probe(api,tc,{type:'deliverables',dimension:'committee',groupKey:tc},limit)).result;
     // Check membership using first page once, without collecting a full group.
     const check=await api.page({type:'deliverables',dimension:'committee',groupKey:tc,limit});
     report.checks.tcParent.membershipValid=check.records.every(r=>(api.hierarchy?.('committee',r)||[]).includes(tc));
   }else report.warnings.push('No ISO/TC identifier found in sampled records; TC parent skipped');
   const example=all.firstRows[0];
   if(example?.id!=null&&api.get){const record=await api.get({type:'deliverables',id:example.id});report.checks.detail={found:!!record,idMatches:String(record?.id)===String(example.id)};}
   const grid=root.w2ui?.standardReferencesGrid;
   report.ui={gridPresent:!!grid,loadedGridRows:Array.isArray(grid?.records)?grid.records.length:null,
      note:'UI snapshot only; does not prove that all legacy readAll paths are unreachable'};
   if(grid?.records?.length>500)report.warnings.push('Grid contains more than 500 rows; verify current selected view and legacy fallback');
   report.memory.after=heap();
   if(report.memory.before.available&&report.memory.after.available){report.memory.deltaUsedJSHeapBytes=report.memory.after.usedJSHeapBytes-report.memory.before.usedJSHeapBytes;report.memory.qualification='Before/after sample is not a peak or a leak test; garbage collection and IndexedDB memory are not measured';}
   const checkResults=Object.values(report.checks);
   const fail=checkResults.some(c=>c.noOverlap===false||c.uniqueFirst===false||c.uniqueSecond===false||c.membershipValid===false||c.idMatches===false);
   report.status=fail?'failed':'passed';
  }catch(e){report.status='error';report.error=String(e?.message??e);}
  root.__radarDiagnosticReport=JSON.stringify(report,null,2);
  return report;
 }
 root.__radarS14Q=Object.freeze({run});
 if(typeof module!=='undefined'&&module.exports)module.exports={run};
})(typeof window!=='undefined'?window:globalThis);
