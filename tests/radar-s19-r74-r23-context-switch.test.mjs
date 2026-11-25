import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const repo=process.env.S19_REPO||path.resolve(here,'..');
const panel=fs.readFileSync(path.join(repo,'js/radar-rationale-panel.js'),'utf8');
const helpers=panel.slice(panel.indexOf('let s19PropertiesForm=null;'),panel.indexOf('function s19SelectedNode('));
const show=panel.slice(panel.indexOf('function showNode(node,form){'),panel.indexOf('root.__radarRationalePanel=',panel.indexOf('function showNode(node,form){')));
assert.ok(helpers.startsWith('let s19PropertiesForm=null;'));
function fixture({mode='view',tab='rationale',existing='A',previous='Context',saveFails=false,hasDossier=true}={}){
 const calls=[];const notice={textContent:''};
 const graph={};
 const node=id=>({id:()=>id,cy:()=>graph,isNode:()=>true,isNodeFlag:true,selected:()=>true,unselect:()=>calls.push('unselect:'+id),select:()=>calls.push('select:'+id)});
 const current=node(existing);
 const old={tabs:{active:previous}};
 const next={tabs:{tabs:[{id:'Blip'},{id:'Context'},{id:'Extra'}],click:id=>calls.push('tab:'+id)},render:()=>calls.push('renderForm')};
 const root={w2ui:{mainLayout:{}},w2tabs:function(){},alert:()=>calls.push('alert')};
 const context={root,currentNode:current,currentId:'prior',mode,tab,editor:mode==='edit'?{}:null,saveError:'',s19PropertiesForm:old,
  byId:id=>id==='s19-selected'?notice:{replaceChildren:()=>{},appendChild:()=>{},querySelector:()=>null},document:{createElement:()=>({id:null})},s19BindGraphSelection:()=>calls.push('bind'),tr:fr=>fr,
  saveEditor:()=>{calls.push('save');if(saveFails)context.saveError='save failed';},killEditor:()=>calls.push('kill'),
  mount:()=>calls.push('mount'),match:()=>hasDossier?{rationaleId:'new'}:null,
  refresh:()=>calls.push('refresh')};
 vm.createContext(context);
 vm.runInContext(helpers.replace('let s19PropertiesForm=null;', '' )+show+'this.showNode=showNode;',context);
 return {context,calls,node,next};
}
test('switch in dossier edition preserves editor and rejects navigation',()=>{
 const f=fixture({mode:'edit'});
 assert.equal(f.context.showNode(f.node('B'),f.next),false);
 assert.equal(f.context.currentNode.id(),'A');
 assert.equal(f.context.currentId,'prior');
 assert.equal(f.context.mode,'edit');
 assert.ok(f.context.editor);
 assert.ok(!f.calls.includes('save'));
 assert.ok(!f.calls.includes('kill'));
 assert.ok(!f.calls.includes('mount'));
});

test('editing lock rejects navigation without attempting a failing save',()=>{
 const f=fixture({mode:'edit',saveFails:true});
 assert.equal(f.context.showNode(f.node('B'),f.next),false);
 assert.equal(f.context.currentNode.id(),'A');
 assert.equal(f.context.mode,'edit');
 assert.ok(f.calls.includes('unselect:B'));
 assert.ok(!f.calls.includes('save'));
 assert.ok(!f.calls.includes('mount'));
});

test('properties Context tab remains active when switching blips',()=>{
 const f=fixture({tab:'properties'});
 f.context.showNode(f.node('B'),f.next);
 assert.equal(f.next.tabs.active,'Context');assert.ok(f.calls.includes('renderForm'));
 assert.equal(f.context.tab,'properties');
});
test('properties Extra tab remains active when available',()=>{
 const f=fixture({tab:'properties',previous:'Extra'});
 f.context.showNode(f.node('B'),f.next);
 assert.equal(f.next.tabs.active,'Extra');assert.ok(f.calls.includes('renderForm'));
});
test('new blip without dossier stays in preview and offers existing creation state',()=>{
 const f=fixture({mode:'view',hasDossier:false});
 f.context.showNode(f.node('B'),f.next);
 assert.equal(f.context.mode,'view');assert.equal(f.context.currentId,null);
 assert.equal(f.context.tab,'rationale');assert.ok(f.calls.includes('refresh'));
});
test('does not recreate form for repeated selection of same blip',()=>{
 const f=fixture({mode:'edit'});
 assert.equal(f.context.showNode(f.context.currentNode,f.next),true);
 assert.deepEqual(f.calls,['bind']);
});
