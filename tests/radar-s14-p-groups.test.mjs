import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import vm from 'node:vm';
const root=resolve(import.meta.dirname,'..');
const dbSource=readFileSync(resolve(root,'js/radar-iso-windowed-db.js'),'utf8');
const panel=readFileSync(resolve(root,'js/radar-standards-panel.js'),'utf8');
const scope={};vm.runInNewContext(dbSource,{window:scope,globalThis:scope});
const match=scope.__radarIsoWindowed.groupMatches;
test('ICS selection includes descendants and deduplicates records logically',()=>{
 const selectors=new Set(['01','01.020','01.020.10']);
 assert.equal(match({icsCodes:['01.020.10','01.020.10']},'ics',selectors),true);
 assert.equal(match({icsCodes:['03.100']},'ics',selectors),false);
});
test('TC/SC membership matches by published reference, not sidebar technical ID',()=>{
 assert.equal(match({ownerCommittee:'ISO/TC 176/SC 2'},'committee',new Set(['ISO/TC 176','ISO/TC 176/SC 2'])),true);
 assert.equal(match({ownerCommittee:'ISO/TC 45'},'committee',new Set(['ISO/TC 176'])),false);
});
test('unclassified records are explicitly recognized',()=>{
 assert.equal(match({icsCodes:[]},'ics',new Set(['__unclassified__'])),true);
 assert.equal(match({icsCodes:['01']},'ics',new Set(['__unclassified__'])),false);
 assert.equal(match({ownerCommittee:null},'committee',new Set(['__unclassified__'])),true);
});
test('no norms readAll when windowed active',()=>{
 const a=panel.indexOf('async function loadIsoCache()'), b=panel.indexOf('function referenceRows(',a);
 const code=panel.slice(a,b);
 assert.match(code,/if\(windowedActive\)\{/);
 assert.match(code,/isoDeliverables=\[\];/);
 assert.match(code,/if\(provider\)\[isoDeliverables,isoCommittees,isoSync\]=await Promise\.all/);
});
test('all three standard views use windows and group selection',()=>{
 assert.match(panel,/if\(windowedActive\)\{\s*grid\.clear\(true\);/);
 assert.match(panel,/const options=\{type:'deliverables',limit:windowSize/);
 assert.match(panel,/options\.dimension=view==='ics'\?'ics':'committee'/);
 assert.match(panel,/options\.values=values/);
 assert.match(panel,/if\(windowedActive&&root\.__radarIsoWindowed\?\.get\)/);
});
test('windowed result handling does not materialize full result arrays',()=>{
 const segment=panel.slice(panel.indexOf('async function windowPage('),panel.indexOf('function refresh(){'));
 assert.doesNotMatch(segment,/readAll\(|\.list\(mode/);
 assert.match(segment,/grid\.records=projected/);
});
test('group memory bounded with many synthetic inputs',()=>{
 const group=new Set(['01','01.020']);let hits=0;
 for(let i=0;i<81768;i++)if(match({icsCodes:[i%2?'01.020':'03.100']},'ics',group))hits++;
 assert.equal(hits,40884);
});

function mockIndexedDb(records){
 const gen='g1';
 const stored=records.map(row=>({...row,generation:gen,type:'deliverables'}));
 const links=stored.flatMap(row=>[
   ...(row.icsCodes||[]).map(value=>({generation:gen,dimension:'ics',value,id:row.id})),
   ...(row.ownerCommittee?[{generation:gen,dimension:'committee',value:row.ownerCommittee,id:row.id}]:[])
 ]);
 const cmp=(a,b)=>{for(let i=0;i<Math.max(a.length,b.length);i++){
   const x=String(a[i]??''),y=String(b[i]??'');if(x<y)return -1;if(x>y)return 1;
 }return 0;};
 const keyFor=(store,byValue,row)=>store==='links'?[row.generation,row.dimension,row.value,row.id]:byValue?[row.generation,row.type,row.reference,row.id]:[row.generation,row.type,row.id];
 const call=(cb,data)=>queueMicrotask(()=>cb?.({target:data}));
 const request=(value)=>{const r={};queueMicrotask(()=>{r.result=value;call(r.onsuccess,r);});return r;};
 const db={close(){},transaction(names){return {objectStore(name){return {
   get(key){return request(name==='meta'?{generation:gen,summary:{release:'test',datasets:{deliverables:{count:stored.length}}}}:stored.find(row=>cmp(keyFor('records',false,row),key)===0)||null);},
   index(){return {openCursor(range){return createCursor(name,true,range);}};},
   openCursor(range){return createCursor(name,false,range);}
   };}};}};
 function createCursor(store,byValue,range){
   const rows=(store==='links'?links:stored).map(value=>({value,key:keyFor(store,byValue,value)}))
     .filter(row=>!range||cmp(row.key,range.low)>=(range.lowOpen?1:0)&&cmp(row.key,range.high)<=(range.highOpen?-1:0))
     .sort((a,b)=>cmp(a.key,b.key));
   const r={};let at=0;
   function send(){queueMicrotask(()=>{const row=rows[at];r.result=row?{key:row.key,value:row.value,continue(){at++;send();}}:null;r.onsuccess?.();});}
   send();return r;
 }
 const indexedDB={open(){const r={result:db};queueMicrotask(()=>r.onsuccess?.());return r;}};
 const IDBKeyRange={bound(low,high,lowOpen=false,highOpen=false){return {low,high,lowOpen,highOpen};}};
 return {indexedDB,IDBKeyRange};
}
test('functional: page() traverses ICS leaf by link index and parent by bounded cursor',async()=>{
 const source=[
  {id:'a',reference:'ISO 100',title:'Alpha',icsCodes:['01.020'],ownerCommittee:'ISO/TC 1'},
  {id:'b',reference:'ISO 200',title:'Beta',icsCodes:['01.020','01.020.10'],ownerCommittee:'ISO/TC 1/SC 2'},
  {id:'c',reference:'ISO 300',title:'Gamma',icsCodes:['03.100'],ownerCommittee:'ISO/TC 3'},
  {id:'d',reference:'ISO 400',title:'Delta',icsCodes:[],ownerCommittee:''}
 ];
 const fake=mockIndexedDb(source),win={};vm.runInNewContext(dbSource,{window:win,globalThis:win,...fake});
 const api=win.__radarIsoWindowed;
 const a=await api.page({limit:1,dimension:'ics',value:'01.020'});
 assert.deepEqual(a.records.map(x=>x.id).join(','),'a');
 const b=await api.page({limit:1,dimension:'ics',value:'01.020',after:a.next});
 assert.deepEqual(b.records.map(x=>x.id).join(','),'b');
 const parent=await api.page({limit:100,dimension:'ics',values:['01.020','01.020.10']});
 assert.deepEqual(parent.records.map(x=>x.id).join(','),'a,b');
 const unclassified=await api.page({dimension:'ics',values:['__unclassified__']});
 assert.deepEqual(unclassified.records.map(x=>x.id).join(','),'d');
 const c=await api.page({dimension:'committee',values:['ISO/TC 1','ISO/TC 1/SC 2']});
 assert.deepEqual(c.records.map(x=>x.id).join(','),'a,b');
});


test('S14-P hierarchical membership deduplicates ICS ancestors',()=>{
 const h=scope.__radarIsoWindowed.hierarchy;
 assert.equal(h('ics',{icsCodes:['01.020','01.020.10','01.020.10']}).join(','),'01,01.020,01.020.10');
 assert.equal(h('ics',{icsCodes:[]}).join(','),'__unclassified__');
});
test('S14-P committee reference materializes TC parent membership',()=>{
 const h=scope.__radarIsoWindowed.hierarchy;
 assert.equal(h('committee',{ownerCommittee:'ISO/TC 176/SC 2'}).join(','),'ISO/TC 176/SC 2,ISO/TC 176');
 assert.equal(h('committee',{ownerCommittee:''}).join(','),'__unclassified__');
});
test('S14-P never recreates old IndexedDB stores during version upgrade',()=>{
 assert.match(dbSource,/VERSION=3/);
 assert.match(dbSource,/if\(!db\.objectStoreNames\.contains\('records'\)\)/);
 assert.match(dbSource,/if\(!db\.objectStoreNames\.contains\('meta'\)\)/);
 assert.match(dbSource,/db\.createObjectStore\('groupLinks'/);
});
test('S14-P migration marks index ready only after completed batches',()=>{
 const func=dbSource.slice(dbSource.indexOf('async function ensureGroupIndex('),dbSource.indexOf('async function groupIndexStatus('));
 assert.match(func,/await done;/);
 assert.match(func,/if\(result\.exhausted\|\|!result\.count\)break;/);
 assert.match(func,/ready:true,completedAt/);
 assert.doesNotMatch(func,/readAll\(/);
});
test('S14-P panel requests direct groupKey plus S14-O fallback',()=>{
 assert.match(panel,/options\.groupKey=view==='ics'/);
 assert.match(panel,/options\.values=values/);
 assert.match(panel,/ensureGroupIndex\(\{batchSize:300/);
});

test('functional: ready parent-index pages by group without scanning every deliverable',async()=>{
 const generation='g-parent';
 const rows=[
  {id:'a',reference:'ISO 100',title:'A',icsCodes:['01.020','01.020.10'],ownerCommittee:'ISO/TC 176/SC 2'},
  {id:'b',reference:'ISO 200',title:'B',icsCodes:['01.040'],ownerCommittee:'ISO/TC 176/SC 1'},
  {id:'c',reference:'ISO 300',title:'C',icsCodes:['03.100'],ownerCommittee:'ISO/TC 5'}
 ].map(row=>({...row,generation,type:'deliverables'}));
 const links=rows.flatMap(row=>['ics','committee'].flatMap(dimension=>scope.__radarIsoWindowed.hierarchy(dimension,row).map(value=>({generation,dimension,value,reference:row.reference,id:row.id}))));
 const key=(l)=>[l.generation,l.dimension,l.value,l.reference,l.id];
 const cmp=(a,b)=>{for(let i=0;i<a.length;i++){if(a[i]<b[i])return -1;if(a[i]>b[i])return 1;}return 0;};
 let groupCursors=0,recordScans=0;
 const schedule=(fn)=>queueMicrotask(fn);
 const makeRequest=(value)=>{const request={};schedule(()=>{request.result=value;request.onsuccess?.();});return request;};
 function cursor(openRange,source,selector){
   const list=source.map(value=>({key:selector(value),value})).filter(x=>!openRange||(
     cmp(x.key,openRange.low)>=(openRange.lowOpen?1:0)&&cmp(x.key,openRange.high)<=(openRange.highOpen?-1:0)
   )).sort((a,b)=>cmp(a.key,b.key));
   let position=0;const req={};const step=()=>schedule(()=>{
     const item=list[position];req.result=item?{...item,continue(){position++;step();}}:null;req.onsuccess?.();
   });step();return req;
 }
 const db={close(){},transaction(){return {objectStore(name){
   if(name==='meta')return {get(k){return makeRequest(k==='active'?{generation,summary:{release:'test',datasets:{deliverables:{count:3}}}}:{ready:true});}};
   if(name==='records')return {get(k){return makeRequest(rows.find(x=>x.id===k[2])||null);},index(){return {openCursor(r){recordScans++;return cursor(r,rows,x=>[generation,'deliverables',x.reference,x.id]);}};}};
   if(name==='groupLinks')return {index(){return {openCursor(r){groupCursors++;return cursor(r,links,key);}};}};
   throw Error('store '+name);
  }};}};
 const fake={window:{},indexedDB:{open(){const req={result:db};schedule(()=>req.onsuccess?.());return req;}},
   IDBKeyRange:{bound(low,high,lowOpen=false,highOpen=false){return {low,high,lowOpen,highOpen};}}};
 vm.runInNewContext(dbSource,{...fake,globalThis:fake.window});
 const api=fake.window.__radarIsoWindowed;
 const first=await api.page({dimension:'ics',groupKey:'01',values:['01','01.020','01.040'],limit:1});
 assert.equal(first.records.map(x=>x.id).join(','),'a');
 const second=await api.page({dimension:'ics',groupKey:'01',values:['01','01.020','01.040'],limit:1,after:first.next});
 assert.equal(second.records.map(x=>x.id).join(','),'b');
 const tc=await api.page({dimension:'committee',groupKey:'ISO/TC 176',values:['ISO/TC 176'],limit:100});
 assert.equal(tc.records.map(x=>x.id).join(','),'a,b');
 assert.equal(recordScans,0);
 assert.equal(groupCursors,3);
});
