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
 throw Error('Unterminated '+name);
}
function harness(edit=true){
 const graph={};let calls=[];
 const makeNode=(id,initial)=>({
  _selected:initial,id(){return id;},cy(){return graph;},isNode(){return true;},
  selected(){return this._selected;},select(){this._selected=true;calls.push('select:'+id);},
  unselect(){this._selected=false;calls.push('unselect:'+id);}
 });
 const first=makeNode('T019',false),next=makeNode('T023',true),notice={textContent:'dossier T019'};
 const context={root:{w2ui:{mainLayout:{}},w2tabs:{}},mode:edit?'edit':'view',tab:'rationale',
  currentNode:first,currentId:'rationale:T019',editor:{},s19PropertiesForm:null,
  s19PreferredPropertiesTab:'Blip',s19RenderedPropertiesNodeId:'T019',saveError:'',
  byId:id=>id==='s19-shell'?{}:id==='s19-selected'?notice:null,
  s19BindGraphSelection:()=>calls.push('bind'),
   s19SetSelectionLock:value=>calls.push('lock:'+value),
  s19PropertiesTab:()=> 'Context',s19RenderPropertiesForm:()=>calls.push('form'),
  tr:fr=>fr,killEditor:()=>calls.push('kill'),
  mount:()=>calls.push('mount'),match:()=>({rationaleId:'rationale:T023'}),
  refresh:()=>calls.push('refresh'),
  calls};
 vm.createContext(context);vm.runInContext(extract('showNode')+'\nthis.invoke=showNode;',context);
 return {context,first,next,notice,calls,invoke:()=>context.invoke(next)};
}
test('editing rejects click, restores prior selected blip, leaves editor and dossier intact',()=>{
 const h=harness(true);assert.equal(h.invoke(),false);
 assert.deepEqual(h.calls,['bind','unselect:T023','select:T019']);
 assert.equal(h.context.currentNode,h.first);assert.equal(h.context.currentId,'rationale:T019');
 assert.equal(h.context.mode,'edit');assert.ok(h.context.editor);
 assert.match(h.notice.textContent,/Visualisation/);
 assert.equal(h.next.selected(),false);assert.equal(h.first.selected(),true);
});
test('second tap/select does not cause a dossier switch while editing',()=>{
 const h=harness(true);h.invoke();h.invoke();
 assert.equal(h.context.currentNode,h.first);
 assert.ok(!h.calls.includes('kill'));assert.ok(!h.calls.includes('refresh'));
 assert.ok(!h.calls.includes('mount'));
});
test('after explicit View switch a new blip opens in preview and current dossier changes',()=>{
 const h=harness(true);h.invoke();h.context.mode='view';h.next.select();
 assert.equal(h.invoke(),true);
 assert.equal(h.context.currentNode,h.next);assert.equal(h.context.currentId,'rationale:T023');
 assert.equal(h.context.mode,'view');assert.ok(h.calls.includes('refresh'));
 assert.ok(!h.calls.includes('form'));
});

test('dossier preview delegates to filtered DOM reconstruction',()=>{
 const section=extract('renderSection');
 assert.match(section,/s19WorkspacePreview\(doc,renderer\)/);
 assert.match(section,/preview refused/);
 assert.doesNotMatch(section,/innerHTML|srcdoc/);
});

test('R27 lazily renders properties only when visible',()=>{
 const fn=extract('s19RenderPropertiesForm');
 assert.match(fn,/tab!=='properties'/);
 assert.match(fn,/s19-body-properties/);
});
