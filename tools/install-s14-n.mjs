#!/usr/bin/env node
import {readFileSync,writeFileSync,existsSync,mkdirSync,copyFileSync} from 'node:fs';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const folder=dirname(fileURLToPath(import.meta.url));
const mode=process.argv[2],repo=resolve(process.argv[3]||'.');
const marker='/* S14-N WINDOWED ISO VIEW */';
const assert=(ok,msg)=>{if(!ok)throw Error(msg)};
function once(source,from,to,which){const count=source.split(from).length-1;assert(count===1,`${which}: expected exactly one anchor (${count} found): ${from.slice(0,65)}`);return source.replace(from,to)}
export function patchPanel(source){
 if(source.includes(marker)){assert(source.includes('windowPage('),'Partial S14-N panel patch');return source;}
 assert(source.includes('/* S14-L1 FULL ISO GRID */'),'S14-L1 panel required');
 assert(source.includes("const item=record.kind==='standard'?findDeliverable(record.isoId)"),'S14-L3 detail signature required');
 let s=once(source," let mode='ics',icsRows=null", `${marker}\n let windowHistory=[null],windowPosition=0,windowToken=0,windowSearch='',windowNext=null;\n let previousWindowButton=null,nextWindowButton=null;\n let mode='ics',icsRows=null`,'panel-state');
 s=once(s," const item=record.kind==='standard'?findDeliverable(record.isoId):record.kind==='committee'?findCommittee(record.committeeId):null;", " const item=record.kind==='standard'?(record.isoItem||findDeliverable(record.isoId)):record.kind==='committee'?findCommittee(record.committeeId):null;",'panel-detail');
 const functionBlock=`
 async function windowPage(direction='reset'){
   if(!grid||mode!=='iso-list')return;
   const token=++windowToken,provider=root.__radarIsoWindowed;
   if(direction==='reset'||windowSearch!==(search?.value||'')){
     windowHistory=[null];windowPosition=0;windowSearch=search?.value||'';windowNext=null;
   }else if(direction==='next'&&windowNext){
     windowHistory=windowHistory.slice(0,windowPosition+1);
     windowHistory.push(windowNext);windowPosition++;
   }else if(direction==='previous'&&windowPosition>0){windowPosition--;}
   const updateButtons=()=>{if(previousWindowButton)previousWindowButton.disabled=windowPosition===0;if(nextWindowButton)nextWindowButton.disabled=!windowNext;};
   if(!provider?.current||!provider?.page){
     const projected=root.__radarIsoFullGrid.project(isoDeliverables,windowSearch);
     grid.clear(true);grid.records=projected;grid.total=projected.length;grid.buffered=projected.length;grid.refresh();
     if(status)status.textContent='Cache historique : '+projected.length+' normes (chargement global)';
     windowNext=null;updateButtons();return;
   }
   try{
     if(status)status.textContent='Lecture fenêtrée IndexedDB…';
     const active=await provider.current();
     if(token!==windowToken||mode!=='iso-list')return;
     if(!active){
       const projected=root.__radarIsoFullGrid.project(isoDeliverables,windowSearch);
       grid.clear(true);grid.records=projected;grid.total=projected.length;grid.buffered=projected.length;grid.refresh();
       if(status)status.textContent='Ancien catalogue : '+projected.length+' normes · importer d’abord dans S14-M';
       windowNext=null;updateButtons();return;
     }
     const result=await provider.page({type:'deliverables',limit:100,after:windowHistory[windowPosition],search:windowSearch});
     if(token!==windowToken||mode!=='iso-list')return;
     windowNext=result.next;
     const projected=root.__radarIsoFullGrid.project(result.records,'');
     grid.clear(true);grid.records=projected;grid.total=projected.length;grid.buffered=projected.length;grid.refresh();
     if(status)status.textContent='ISO '+result.release+' · fenêtre '+(windowPosition+1)+' · '+projected.length+' normes chargées · '+(result.total??'résultats filtrés')+' au catalogue';
     updateButtons();
   }catch(e){if(token!==windowToken)return;if(status)status.textContent='Consultation fenêtrée impossible : '+e.message;windowNext=null;updateButtons();}
 }
`;
 s=once(s,' function refresh(){',functionBlock+'\n function refresh(){','panel-function');
 const old="     /* S14-L1 FULL ISO GRID */ const fullGrid=root.__radarIsoFullGrid;if(!fullGrid?.project)throw Error('S14-L1: projection ISO manquante');\n     grid.clear(true);const projected=fullGrid.project(isoDeliverables,term);grid.records=projected;grid.total=projected.length;grid.buffered=projected.length;\n     if(status)status.textContent=grid.records.length+\" résultats ISO sur \"+isoDeliverables.length+\" références en cache · w2grid virtualisée · ISO Open Data (ODC-By 1.0)\";";
 const replacement="     /* S14-L1 FULL ISO GRID */ const fullGrid=root.__radarIsoFullGrid;if(!fullGrid?.project)throw Error('S14-L1: projection ISO manquante');\n     grid.clear(true);grid.records=[];grid.total=0;grid.buffered=0;\n     Promise.resolve().then(()=>windowPage('reset'));";
 s=once(s,old,replacement,'panel-grid');
 s=once(s,"   const reload=d.createElement('button');", "   previousWindowButton=d.createElement('button');previousWindowButton.type='button';previousWindowButton.textContent='◀ 100';previousWindowButton.disabled=true;previousWindowButton.title='Fenêtre précédente de normes ISO';previousWindowButton.addEventListener('click',()=>windowPage('previous'));bar.appendChild(previousWindowButton);\n   nextWindowButton=d.createElement('button');nextWindowButton.type='button';nextWindowButton.textContent='100 ▶';nextWindowButton.disabled=true;nextWindowButton.title='Fenêtre suivante de normes ISO';nextWindowButton.addEventListener('click',()=>windowPage('next'));bar.appendChild(nextWindowButton);\n   const reload=d.createElement('button');",'panel-nav');
 s=once(s,"     const id=btn.getAttribute('data-iso-detail');const record={kind:'standard',isoId:id};showDetail(record);", "     const id=btn.getAttribute('data-iso-detail');const record={kind:'standard',isoId:id};\n     if(mode==='iso-list'&&root.__radarIsoWindowed?.get){root.__radarIsoWindowed.get({type:'deliverables',id}).then(item=>{if(item)showDetail({...record,isoItem:item});else showDetail(record);}).catch(err=>{if(status)status.textContent=err.message;});}\n     else showDetail(record);",'panel-details');
 return s;
}
export function patchDatabase(source){
 if(source.includes('/* S14-N BY-ID LOOKUP */'))return source;
 const before=" root.__radarIsoWindowed=Object.freeze({open,importRelease,page,current,purgeGeneration});";
 const after=` /* S14-N BY-ID LOOKUP */\n async function get({type='deliverables',id}={}){\n   if(!['deliverables','committees','ics'].includes(type)||id==null)throw Error('Invalid ISO record lookup');\n   const db=await open();try{const active=await meta(db,'active');if(!active)return null;const tx=db.transaction('records','readonly');return (await request(tx.objectStore('records').get([active.generation,type,String(id)])))||null;}finally{db.close();}\n }\n root.__radarIsoWindowed=Object.freeze({open,importRelease,page,current,purgeGeneration,get});`;
 return once(source,before,after,'windowed-db');
}
async function main(){
 assert(['--check','--apply'].includes(mode),'Usage: node install-s14-n.mjs --check|--apply <repo>');
 const files=['js/radar-standards-panel.js','js/radar-iso-windowed-db.js'];
 const old=files.map(f=>{const path=join(repo,f);assert(existsSync(path),'Missing S14-M/L3 module: '+f);return readFileSync(path,'utf8')});
 const revised=[patchPanel(old[0]),patchDatabase(old[1])];
 const additions=['tools/install-s14-n.mjs','tests/radar-s14-n-windowed.test.mjs','tests/fixtures/s14-n-panel.js','tests/fixtures/s14-n-db.js','docs/architecture/45-S14-N-FENETRAGE-W2GRID.md'];
 for(const f of additions){const target=join(repo,f);if(existsSync(target))assert(readFileSync(target).equals(readFileSync(join(folder,'payload',f))),'Refusing to overwrite '+f);}
 const report={operation:'S14-N-WINDOWED-ISO-GRID',mode,repository:repo,files:files.map((f,i)=>({path:f,willChange:old[i]!==revised[i]})),ok:true,backup:null,applied:[]};
 if(mode==='--apply'){
   if(revised.every((s,i)=>s===old[i])&&additions.every(f=>existsSync(join(repo,f)))){console.log(JSON.stringify(report,null,2));return;}
   const backup=join(repo,'.s14-n-backups',new Date().toISOString().replace(/[:.]/g,'-'));mkdirSync(backup,{recursive:true});report.backup=backup;
   files.forEach((f,i)=>{if(old[i]!==revised[i]){const destination=join(repo,f);copyFileSync(destination,join(backup,f.split('/').at(-1)));writeFileSync(destination,revised[i]);report.applied.push(f);}});
   for(const f of additions){const target=join(repo,f);if(!existsSync(target)){mkdirSync(dirname(target),{recursive:true});copyFileSync(join(folder,'payload',f),target);report.applied.push(f);}}
 }
 console.log(JSON.stringify(report,null,2));
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(e=>{console.error(JSON.stringify({operation:'S14-N-WINDOWED-ISO-GRID',ok:false,error:e.message},null,2));process.exitCode=1});
