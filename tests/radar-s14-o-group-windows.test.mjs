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
