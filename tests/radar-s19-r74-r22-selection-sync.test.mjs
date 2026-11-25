import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const repo=process.env.S19_REPO||path.resolve(here,'..');
const panel=fs.readFileSync(path.join(repo,'js/radar-rationale-panel.js'),'utf8');
const first=panel.indexOf('let s19SelectionGraph=null;');
const last=panel.indexOf('function s19FullscreenLabel()',first);
assert.ok(first>=0&&last>first,'R22 selection bridge must exist');
const source=panel.slice(first,last);
function fixture(){
 const events=new Map();
 const graph={on(event,kind,handler){events.set(event+':'+kind,handler);},off(event,kind,handler){if(events.get(event+':'+kind)===handler)events.delete(event+':'+kind);},emit(node,event='select'){events.get(event+':node')?.({target:node});},count(){return events.size}};
 const nodes=id=>({isNode:()=>true,data:k=>k==='radarchart'?{standardId:'standard-'+id}:null,visible:()=>true,id:()=>id,cy:()=>graph});
 const calls=[];
 const context={root:{generateFormFromCytoscapeElement:node=>({id:node.id()})},currentNode:null,showNode:(node)=>{calls.push([node.id()]);context.currentNode=node;}};
 vm.createContext(context);vm.runInContext(source+'\nthis.bind=s19BindGraphSelection; this.onSelected=s19SelectedNode;',context);
 return {graph,nodes,calls,context};
}
test('selection event switches blips without requiring a tap or changing tab',()=>{
 const f=fixture();f.context.bind(f.graph);
 f.graph.emit(f.nodes('A'));f.graph.emit(f.nodes('B'));
 assert.deepEqual(f.calls,[['A'],['B']]);
});
test('duplicate select events do not reconstruct a dossier',()=>{
 const f=fixture();f.context.bind(f.graph);f.graph.emit(f.nodes('A'));f.graph.emit(f.nodes('A'));
 assert.equal(f.calls.length,1);
});
test('subscription is not duplicated and switches graphs safely',()=>{
 const f=fixture();f.context.bind(f.graph);f.context.bind(f.graph);assert.equal(f.graph.count(),2);
 const other={on(){},off(){}};f.context.bind(other);assert.equal(f.graph.count(),0);
});
test('tap selects a different dossier when no select event is emitted',()=>{
 const f=fixture();f.context.bind(f.graph);
 f.graph.emit(f.nodes('A'),'select');
 f.graph.emit(f.nodes('B'),'tap');
 assert.deepEqual(f.calls,[['A'],['B']]);
});
test('tap and select for same node perform only one update',()=>{
 const f=fixture();f.context.bind(f.graph);
 f.graph.emit(f.nodes('B'),'tap');f.graph.emit(f.nodes('B'),'select');
 assert.equal(f.calls.length,1);
});
test('unknown or hidden selections are ignored',()=>{
 const f=fixture();f.context.bind(f.graph);
 f.graph.emit({isNode:()=>true,data:()=>({standardId:'x'}),visible:()=>false});
 f.graph.emit({isNode:()=>false});assert.equal(f.calls.length,0);
});
test('live showNode preserves active tab and guards failed saves',()=>{
 assert.match(panel,/s19BindGraphSelection\(node\.cy\?\.\(\)\)/);
 assert.match(panel,/if\(mode==='edit'\)\{/);
 assert.match(panel,/if\(node.selected\?\.\(\)\)node.unselect\?\.\(\)/);
 assert.match(panel,/Keep the top-level tab, but always show the new dossier in preview mode/);
});
