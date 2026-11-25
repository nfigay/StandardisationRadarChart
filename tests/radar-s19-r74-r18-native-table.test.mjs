import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const base=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(base,'..');
const inPkg=fs.existsSync(path.join(root,'payload/js/radar-rationale-styles.js'));
const js=path.join(root,inPkg?'payload/js':'js');
const formatting=fs.readFileSync(path.join(js,'radar-rationale-styles.js'),'utf8');
const renderer=fs.readFileSync(path.join(js,'radar-rationale-renderer.js'),'utf8');
function fakeTable(name){return {name,configure(opts){return {...this,options:opts};}};}
function runStyle(name){
 const highlight={name:'highlight',type:'mark',configure(){return {...this,name:'highlight',configured:true};},extend(spec){return {...spec,type:'mark'};}};
 const starter={extend(spec){return {...spec,type:'extension'};}};
 const window={__radarTiptap:{extensions:[highlight,fakeTable(name)],StarterKit:starter}};
 vm.runInNewContext(formatting,{window,console});
 return window.__radarS19Formatting;
}
function renderApi(){const m={exports:{}};vm.runInNewContext(renderer,{module:m,window:undefined});return m.exports;}
const table=(widths,rows=1)=>({type:'table',content:Array.from({length:rows},(_,row)=>({type:'tableRow',attrs:{s19MinHeight:row?90:null},content:widths.map(w=>({type:'tableCell',attrs:{colwidth:w===null?null:[w],colspan:1},content:[{type:'paragraph',content:[{type:'text',text:String(w)}]}]}))}))});
test('native Table.configure enables standard resizing and preserves other extensions',()=>{
 const v=runStyle('table');assert.equal(v.nativeTableResize,true);
 const x=v.extensions.find(e=>e.name==='table');assert.equal(x.options.resizable,true);assert.equal(x.options.cellMinWidth,45);
 assert.equal(v.extensions.some(e=>e.name==='highlight'&&e.configured),true);
});
test('native TableKit configuration supported',()=>{
 const v=runStyle('tableKit');assert.equal(v.nativeTableResize,true);
 const x=v.extensions.find(e=>e.name==='tableKit');assert.equal(x.options.table.resizable,true);
});
test('static renderer converts native colwidth to proportional 100% table',()=>{
 const html=renderApi().renderNode(table([175,140]));
 assert.match(html,/<table class="s19-responsive-table"><colgroup>/);
 assert.match(html,/width:55\.56%/);assert.match(html,/width:44\.44%/);
 assert.doesNotMatch(html,/width:315px/);
});
test('incomplete colwidth uses automatic responsive layout, not guessed percentages',()=>{
 const html=renderApi().renderNode(table([175,null]));
 assert.doesNotMatch(html,/<colgroup>/);assert.match(html,/s19-responsive-table/);
});
test('row minimum height retained and inline pixel cell widths removed',()=>{
 const html=renderApi().renderNode(table([175,140],2));
 assert.match(html,/height:90px/);assert.doesNotMatch(html,/style="width:175px"/);
});
test('preview CSS is fluid and standalone output stays script-free',()=>{
 const m=renderApi();const output=m.renderDocument({standard:{title:'Test'},sections:{context:{type:'doc',content:[table([175,140])]}}});
 assert.match(output,/table\{border-collapse:collapse;width:100%;table-layout:fixed\}/);
 assert.doesNotMatch(output,/<script\b/i);
 assert.match(output,/Content-Security-Policy/);
});
