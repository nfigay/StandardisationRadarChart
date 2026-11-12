/* S14-R: reversible runtime audit. No catalog writes. */
(function(root){
 'use strict';
 let running=null;
 const now=()=>root.performance?.now?.()??Date.now();
 const heap=()=>Number.isFinite(root.performance?.memory?.usedJSHeapSize)?root.performance.memory.usedJSHeapSize:null;
 const clamp=(n,lo,hi,def)=>Number.isInteger(n)?Math.min(hi,Math.max(lo,n)):def;
 const keyOf=r=>String(r?.id??'');
 function summarizeState(state){return {startedAt:state.startedAt,elapsedMs:Math.round(now()-state.startMs),readAllCalls:state.calls.slice(),totalReadAllCalls:state.calls.length,trackedBy:state.wrapped,heapSamples:state.heapSamples.slice(),gridRows:root.w2ui?.standardReferencesGrid?.records?.length??null};}
 function start({blockLegacy=false}={}){
   if(running)throw Error('S14-R audit already running');
   const provider=root.__radarIsoOpenData,original=provider?.readAll;
   const state={startMs:now(),startedAt:new Date().toISOString(),calls:[],wrapped:false,provider,original,wrapper:null,heapSamples:[],blockLegacy:Boolean(blockLegacy)};
   // Guard only in an explicitly requested audit; automatically restore on stop().
   if(typeof original==='function'){
     state.wrapper=function(...args){state.calls.push({atMs:Math.round(now()-state.startMs),dataset:String(args[0]??'unknown')});
       if(state.blockLegacy&&String(args[0])==='deliverables')throw Error('S14-R guard: legacy readAll(deliverables) during windowed audit');
       return original.apply(this,args);
     };
     try{provider.readAll=state.wrapper;state.wrapped=provider.readAll===state.wrapper;}catch(_e){state.wrapped=false;}
   }
   state.heapSamples.push({atMs:0,bytes:heap()});running=state;
   return {started:true,wrapped:state.wrapped,blockLegacy:state.blockLegacy};
 }
 function sample(){if(!running)throw Error('S14-R audit not running');const entry={atMs:Math.round(now()-running.startMs),bytes:heap()};running.heapSamples.push(entry);return entry;}
 function stop(){if(!running)return {running:false};const state=running;running=null;
   if(state.wrapped&&state.provider.readAll===state.wrapper)state.provider.readAll=state.original;
   state.heapSamples.push({atMs:Math.round(now()-state.startMs),bytes:heap()});
   return {running:false,...summarizeState(state),restored:!state.wrapped||state.provider.readAll===state.original};
 }
 async function stress({cycles=30,limit=50}={}){
   if(running)throw Error('Stop the manual audit before stress()');
   cycles=clamp(cycles,1,200,30);limit=clamp(limit,1,100,50);
   const report={operation:'S14-R-REPEATED-WINDOW-AUDIT',createdAt:new Date().toISOString(),cyclesRequested:cycles,limit,status:'running',series:[],warnings:[]};
   const api=root.__radarIsoWindowed;
   if(typeof api?.page!=='function'||typeof api?.current!=='function'){
     report.status='error';report.error='Windowed API unavailable';return report;
   }
   const active=await api.current();if(!active?.generation){report.status='error';report.error='No active windowed generation';return report;}
   report.release=active.summary?.release??null;
   const scenarios=[{type:'deliverables'},{type:'committees'},{type:'deliverables',dimension:'ics',groupKey:'01'},{type:'deliverables',dimension:'committee',groupKey:'ISO/TC 121'}];
   const maxRows=limit*2;
   let minMs=Infinity,maxMs=0,totalMs=0,requests=0;
   start({blockLegacy:false});
   try{
     for(let i=0;i<cycles;i++){
       const opts=scenarios[i%scenarios.length],before=now(),first=await api.page({...opts,limit});
       if(first.records.length>limit)throw Error('Window exceeds limit');
       let overlap=false,count=first.records.length;
       if(first.next!=null){const second=await api.page({...opts,limit,after:first.next});
         if(second.records.length>limit)throw Error('Second window exceeds limit');
         const ids=new Set(first.records.map(keyOf));overlap=second.records.some(r=>ids.has(keyOf(r)));
         count+=second.records.length;
       }
       if(overlap)throw Error('Overlapping windows: '+JSON.stringify(opts));
       if(count>maxRows)throw Error('Unbounded response');
       const ms=Math.round(now()-before);minMs=Math.min(minMs,ms);maxMs=Math.max(maxMs,ms);totalMs+=ms;requests++;
       if(i===0||(i+1)%5===0||i===cycles-1){const s=sample();report.series.push({cycle:i+1,view:opts.dimension??opts.type,ms,rows:count,heapBytes:s.bytes});}
     }
     report.status='passed';
   }catch(err){report.status='failed';report.error=String(err?.message??err);}
   finally{report.runtime=stop();}
   report.performance={measuredCycles:requests,minMs:requests?minMs:null,maxMs:requests?maxMs:null,meanMs:requests?Math.round(totalMs/requests):null};
   const heaps=report.runtime.heapSamples.map(s=>s.bytes).filter(Number.isFinite);
   report.memory={available:heaps.length>0,firstBytes:heaps[0]??null,lastBytes:heaps.at(-1)??null,observedMaxBytes:heaps.length?Math.max(...heaps):null,note:'Chrome JS heap samples only; not peak allocations, GC-normalized leak proof, or IndexedDB process memory'};
   if(report.runtime.totalReadAllCalls>0)report.warnings.push('Legacy readAll executed during the measured operations');
   root.__radarDiagnosticReport=JSON.stringify(report,null,2);
   return report;
 }
 root.__radarS14R=Object.freeze({start,sample,stop,stress});
 if(typeof module!=='undefined'&&module.exports)module.exports={createAudit:()=>root.__radarS14R};
})(typeof window!=='undefined'?window:globalThis);
