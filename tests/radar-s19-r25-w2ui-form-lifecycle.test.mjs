import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import vm from 'node:vm';
const repo=process.env.S19_REPO||path.resolve(import.meta.dirname,'..');
const html=fs.readFileSync(path.join(repo,'radar.html'),'utf8');
const panel=fs.readFileSync(path.join(repo,'js/radar-rationale-panel.js'),'utf8');
const radar=fs.readFileSync(path.join(repo,'js/radar.js'),'utf8');
const js=(source,name)=>{const start=source.indexOf('function '+name+'(');assert.ok(start>=0,name);let depth=0,open=source.indexOf('{',start);for(let i=open;i<source.length;i++){if(source[i]==='{')depth++;if(source[i]==='}'&&!--depth)return source.slice(start,i+1);}throw Error('unterminated '+name)};
test('both original Cytoscape handlers now defer form creation to panel',()=>{
  assert.equal(html.match(/window\.__radarRationalePanel\.showNode\(node\);/g)?.length,2);
  assert.equal(html.match(/let form = generateFormFromCytoscapeElement\(node\)/g)?.length||0,0);
  assert.equal(html.match(/const form = generateFormFromCytoscapeElement\(node\)/g)?.length,2);
  const sections=html.split('// S19-R25: the dossier panel validates switching BEFORE constructing a');
  assert.equal(sections.length,3);
  for(let i=1;i<3;i++){
    const s=sections[i].slice(0,600);
    assert.ok(s.indexOf('window.__radarRationalePanel.showNode(node)')<s.indexOf('generateFormFromCytoscapeElement(node)'));
  }
});
test('a select event no longer constructs a second W2UI form before showNode',()=>{
  const fn=js(panel,'s19SelectedNode');
  assert.doesNotMatch(fn,/createForm\(node\)/);
  assert.match(fn,/showNode\(node\)/);
});
test('same blip and editing lock bypass lazy form creation',()=>{
 const fn=js(panel,'showNode');
 const same=fn.indexOf('currentNode?.id?.()===node.id()');
 const lock=fn.indexOf("if(mode==='edit')");
 const form=fn.indexOf('s19RenderPropertiesForm(form)');
 assert.ok(same>=0&&lock>same&&form>lock);
 assert.match(fn,/return false/);
 assert.match(fn,/s19PreferredPropertiesTab=priorPropertiesTab/);
 assert.match(fn,/mode='view'/);
});

test('form lifecycle releases W2UI parent, toolbar and tabs before new registration',()=>{
  const fn=js(radar,'generateFormFromCytoscapeElement');
  const events=[];
  const registry={};
  class Form{
    constructor(config){
      for(const name of ['blipForm','blipForm_toolbar','blipForm_tabs']){
        if(registry[name])throw Error('duplicate '+name);
        registry[name]={destroy(){events.push('destroy '+name);delete registry[name]}};
        events.push('register '+name);
      }
      this.config=config;
    }
  }
  const context={window:{w2ui:registry},w2form:Form,validRings:['Adopted','Candidate','Track'],validQuadrants:['Available','Monitored'],w2ui:registry};
  vm.runInNewContext(fn,context);
  const node={isNode:()=>true,data:()=>({id:'a',label:'A',ring:'Adopted',quadrant:'Available'}),position:()=>({x:0,y:0})};
  vm.runInNewContext('generateFormFromCytoscapeElement',context)(node);
  node.data=()=>({id:'b',label:'B',ring:'Candidate',quadrant:'Monitored'});
  vm.runInNewContext('generateFormFromCytoscapeElement',context)(node);
  assert.equal(events.filter(x=>x==='register blipForm').length,2);
  assert.deepEqual(events.slice(3,6),['destroy blipForm','destroy blipForm_toolbar','destroy blipForm_tabs']);
});
