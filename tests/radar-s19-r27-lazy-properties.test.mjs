import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import vm from 'node:vm';
const repo=process.env.S19_REPO||path.resolve(import.meta.dirname,'..');
const source=fs.readFileSync(path.join(repo,'js/radar-rationale-panel.js'),'utf8');
function functionBody(name){
 const start=source.indexOf('function '+name+'(');
 assert.notEqual(start,-1,`Missing ${name}`);
 const open=source.indexOf('{',start);let depth=0;
 for(let i=open;i<source.length;i++){
  if(source[i]==='{')depth++;
  if(source[i]==='}'&&!--depth)return source.slice(start,i+1);
 }
 throw Error('Unterminated '+name);
}
const lazy=functionBody('s19RenderPropertiesForm');
const restore=functionBody('s19RestorePropertiesTab');
function harness(initialTab='rationale'){
 let renderCount=0, factoryCount=0;
 const node={isNode:()=>true,id:()=> 'n1'};
 const form={focus:0,tabs:{active:'Blip',tabs:[{id:'Blip'},{id:'Context'},{id:'Extra'}],refresh(){}},render(){renderCount++;if(initialTab==='rationale')throw Error('hidden render');}};
 const host={replaceChildren(){},querySelector(){return null},appendChild(){}};
 const context={tab:initialTab,currentNode:node,s19PropertiesForm:null,s19RenderedPropertiesNodeId:null,s19PreferredPropertiesTab:'Context',root:{generateFormFromCytoscapeElement:()=>{factoryCount++;return form;}},byId:id=>id==='s19-property-form'?host:id==='s19-body-properties'?{hidden:initialTab==='rationale'}:null,document:{createElement:()=>({id:''})}};
 vm.createContext(context);
 vm.runInContext(restore+'\n'+lazy+'\nthis.invoke=s19RenderPropertiesForm;',context);
 return {context,form,invoke:()=>context.invoke(),counts:()=>({renderCount,factoryCount})};
}
test('dossier preview never creates or renders a hidden W2UI form',()=>{
 const h=harness('rationale');assert.equal(h.invoke(),false);assert.deepEqual(h.counts(),{renderCount:0,factoryCount:0});
});
test('properties view creates one form, disables focus, restores Context only after render',()=>{
 const h=harness('properties');assert.equal(h.invoke(),true);assert.deepEqual(h.counts(),{renderCount:1,factoryCount:1});assert.equal(h.form.focus,-1);assert.equal(h.form.tabs.active,'Context');
});
test('does not reconstruct the form for the same blip if host is present',()=>{
 const h=harness('properties');h.invoke();h.context.byId=id=>id==='s19-property-form'?{querySelector:()=>({})}:id==='s19-body-properties'?{hidden:false}:null;
 assert.equal(h.invoke(),true);assert.deepEqual(h.counts(),{renderCount:1,factoryCount:1});
});
test('tab is not force-selected before render',()=>{
 assert.ok(lazy.indexOf("form.render('#form')")<lazy.indexOf('s19RestorePropertiesTab(form,s19PreferredPropertiesTab)'));
 assert.doesNotMatch(lazy.slice(0,lazy.indexOf("form.render('#form')")),/\.tabs\.active\s*=/);
});
test('outer tab transition refreshes layout before loading its property form',()=>{
 const mount=functionBody('mount');
 assert.match(mount,/tab=event\.target;refresh\(\);if\(tab==='properties'\)s19RenderPropertiesForm\(\)/);
});
test('showNode renders properties only when the outer properties tab is selected',()=>{
 const show=functionBody('showNode');
 assert.match(show,/s19RenderedPropertiesNodeId=null/);
 assert.match(show,/if\(tab==='properties'\)s19RenderPropertiesForm\(form\)/);
 assert.doesNotMatch(show,/form\.render\s*\(/);
 assert.match(show,/if\(mode==='edit'\)/);
 assert.match(show,/mode='view'/);
});
