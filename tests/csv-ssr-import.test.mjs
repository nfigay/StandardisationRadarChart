import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareCSVSSRImport, applyCSVSSRImport } from '../src/domain/csv-ssr-import.mjs';
const fields = ['id','working_group','label','ring','quadrant','x'];
const parse = rows => ({ meta:{fields},data:rows,errors:[] });
const row = (id,label='Alpha') => ({id,working_group:'PLM',label,ring:'Track',quadrant:'Available',x:'12'});
test('same node is unchanged on import',()=>{
 const p=prepareCSVSSRImport(parse([row('1')]),[{id:'1',working_group:'PLM',label:'Alpha',ring:'Track',quadrant:'Available',x:12}]);
 assert.deepEqual([p.additions.length,p.updates.length,p.unchanged.length],[0,0,1]);
});
test('update and addition are explicit; missing nodes never deleted',()=>{
 const p=prepareCSVSSRImport(parse([row('1','New'),row('2')]),[{id:'1',label:'Old'},{id:'3',label:'Retained'}]);
 assert.equal(p.updates.length,1);assert.equal(p.additions.length,1);assert.equal(p.total,2);
});
test('reject duplicate and missing identifiers',()=>{
 assert.throws(()=>prepareCSVSSRImport(parse([row('1'),row('1')])),/dupliqué/);
 assert.throws(()=>prepareCSVSSRImport(parse([row('')])),/identifiant/);
});
test('reject invalid columns, parser errors, bad number',()=>{
 assert.throws(()=>prepareCSVSSRImport({...parse([row('1')]),meta:{fields:['id']} }),/Colonne/);
 assert.throws(()=>prepareCSVSSRImport({...parse([row('1')]),errors:[{row:0,message:'bad'}]}),/Erreur CSV/);
 assert.throws(()=>prepareCSVSSRImport(parse([row('1')].map(x=>({...x,x:'wrong'})))),/non numérique/);
});
test('preserve unknown fields and skip blank cells',()=>{
 const p=prepareCSVSSRImport({meta:{fields:[...fields,'custom']},data:[{...row('1'),custom:''}],errors:[]});
 assert.equal(Object.hasOwn(p.additions[0].data,'custom'),false);
});
test('apply updates, additions and preserves unrelated graph nodes',()=>{
 const records=new Map([['1',{id:'1',label:'Old'}],['3',{id:'3',label:'Retained'}]]);
 const wrap=id=>({ length:records.has(id)?1:0,isNode:()=>true,data(value){if(value)records.set(id,value);return records.get(id);}});
 const graph={batch(f){f()},getElementById(id){return wrap(id)},add({data}){records.set(data.id,data);return {remove(){records.delete(data.id)}}}};
 const p=prepareCSVSSRImport(parse([row('1','New'),row('2')]),[...records.values()]);
 assert.deepEqual(applyCSVSSRImport(p,graph),{added:1,updated:1,unchanged:0});
 assert.equal(records.get('1').label,'New'); assert.equal(records.get('3').label,'Retained');
});
