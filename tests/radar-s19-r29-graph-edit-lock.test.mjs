import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
const repo=process.env.S19_REPO||path.resolve(import.meta.dirname,'..');
const source=fs.readFileSync(path.join(repo,'js/radar-rationale-panel.js'),'utf8');
function extract(name){
 const start=source.indexOf('function '+name+'(');assert.ok(start>=0,name);
 const open=source.indexOf('{',start);let depth=0;
 for(let i=open;i<source.length;i++){
  if(source[i]==='{')depth++;
  if(source[i]==='}'&&!--depth)return source.slice(start,i+1);
 }
 throw Error('Unterminated function '+name);
}
function harness(){
 const log=[];
 const nodes=['T019','T023','T024','nonselectable'].map((id,i)=>({
  name:id, selectableValue:i!==3, selectedValue:i===0, removedValue:false,
  id(){return id;},data(key){return key==='radarchart'&&i!==3?{standardId:id}:null;},selectable(){return this.selectableValue;},selected(){return this.selectedValue;},
  removed(){return this.removedValue;},selectify(){this.selectableValue=true;log.push('unlock:'+id);},
  unselectify(){this.selectableValue=false;log.push('lock:'+id);},
  select(){if(this.selectableValue){this.selectedValue=true;log.push('select:'+id);}}
 }));
 const graph={nodes:()=>nodes};nodes.forEach(node=>node.cy=()=>graph);
 const context={currentNode:nodes[0],s19SelectionLockedNodes:[],s19SelectionLockGraph:null};
 vm.createContext(context);
 vm.runInContext(extract('s19SetSelectionLock')+'\nthis.lock=s19SetSelectionLock;',context);
 return {nodes,graph,log,ctx:context,lock:context.lock};
}
test('entering edition makes OTHER blips unselectable, leaves edited blip selectable',()=>{
 const h=harness();h.lock(true);
 assert.equal(h.nodes[0].selectable(),true);
 assert.equal(h.nodes[1].selectable(),false);
 assert.equal(h.nodes[2].selectable(),false);
 assert.equal(h.nodes[3].selectable(),false);
 assert.deepEqual(h.log,['lock:T023','lock:T024']);
});
test('repeated refresh does not change the lock twice, nor unlock previously nonselectable nodes',()=>{
 const h=harness();h.lock(true);h.lock(true);h.lock(false);
 assert.deepEqual(h.log,['lock:T023','lock:T024','unlock:T023','unlock:T024']);
 assert.equal(h.nodes[3].selectable(),false);
});
test('switching to view restores other blips to selectable status',()=>{
 const h=harness();h.lock(true);h.lock(false);
 assert.equal(h.nodes[1].selectable(),true);
 assert.equal(h.nodes[2].selectable(),true);
});
test('graph switch unlocks old graph and locks only new graph',()=>{
 const h=harness();h.lock(true);
 const oldLog=h.log.length;
 const node={id:()=> 'X',selectable:()=>true,selected:()=>true,unselectify(){},selectify(){},removed:()=>false};
 const next={nodes:()=>[node]};node.cy=()=>next;
 h.ctx.currentNode=node;h.lock(true);
 assert.equal(h.log.length,oldLog+2);
 assert.equal(h.nodes[1].selectable(),true);
});
test('removal during edition does not re-selectify removed blips',()=>{
 const h=harness();h.lock(true);h.nodes[1].removedValue=true;h.lock(false);
 assert.ok(!h.log.includes('unlock:T023'));
});
test('edit and view toolbar handlers call the lock synchronously',()=>{
 const toolbar=extract('updateToolbar');
 assert.match(toolbar,/mode='edit';s19SetSelectionLock\(true\);refresh\(\)/);
 assert.match(toolbar,/mode='view';s19SetSelectionLock\(false\);refresh\(\)/);
 const refresh=extract('refresh');assert.match(refresh,/s19SetSelectionLock\(mode==='edit'\)/);
});
test('showNode keeps R28 guard against tap on another blip while editing',()=>{
 const show=extract('showNode');assert.match(show,/if\(mode==='edit'\)/);
 assert.match(show,/node\.unselect\?\.\(\)/);
 assert.match(show,/return false/);
});
test('preview is inert DOM, without iframe or scripts',()=>{
 const section=extract('renderSection');
 assert.match(section,/s19WorkspacePreview\(doc,renderer\)/);
 assert.doesNotMatch(section,/iframe|srcdoc|allow-scripts/);
});
