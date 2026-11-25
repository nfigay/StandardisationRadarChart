import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const base=path.resolve(here,'..');
const find=(rel)=>{const p=path.join(base,rel);const packaged=path.join(base,'payload',rel);return fs.readFileSync(fs.existsSync(p)?p:packaged,'utf8');};
const renderer=find('js/radar-rationale-renderer.js');
const panel=find('js/radar-rationale-panel.js');
const styles=find('js/radar-rationale-styles.js');

function rendererAPI(){
 const sandbox={module:{exports:{}},window:{}};
 vm.runInNewContext(renderer,sandbox,{filename:'radar-rationale-renderer.js'});
 return sandbox.module.exports;
}
function formatting(){
 const extension={name:'highlight',type:'mark',configure(options){return {...this,options}},extend(config){return {...config,type:'mark',extend:this.extend}}};
 const kit={extend(config){return {...config,type:'extension',extend:this.extend}}};
 const sandbox={window:{__radarTiptap:{StarterKit:kit,extensions:[extension]}}};
 vm.runInNewContext(styles,sandbox,{filename:'radar-rationale-styles.js'});
 return sandbox.window.__radarS19Formatting;
}
const richDoc={type:'doc',content:[{type:'paragraph',attrs:{backgroundColor:'#dbeafe'},content:[
 {type:'text',text:'Important',marks:[{type:'textStyle',attrs:{color:'#b42318'}},{type:'highlight',attrs:{color:'#fff2a8'}}]},
 {type:'text',text:' normal'}
]}]};

test('text colors, colored highlights and paragraph background persist as schema attributes',()=>{
 const runtime=formatting();assert.ok(runtime);assert.ok(runtime.extensions.some(x=>x.name==='s19ParagraphLayout'));
 assert.equal(runtime.extensions.find(x=>x.name==='highlight').options.multicolor,true);
 const text=runtime.extensions.find(x=>x.name==='textStyle');
 const bg=runtime.extensions.find(x=>x.name==='s19ParagraphBackground');
 assert.ok(text);assert.ok(bg);
 assert.equal(text.addAttributes().color.parseHTML({style:{color:'#B42318'}}),'#b42318');
 assert.equal(bg.addGlobalAttributes()[0].attributes.backgroundColor.renderHTML({backgroundColor:'#dbeafe'}).style,'background-color:#dbeafe');
 assert.equal(text.renderHTML({HTMLAttributes:{style:'color:#b42318'}})[0],'span');
 const actions=[];const chain=()=>({setMark:(n,a)=>{actions.push(['setMark',n,a.color]);return {run:()=>true};},unsetMark:n=>{actions.push(['unsetMark',n]);return{run:()=>true};}});
 assert.equal(text.addCommands().setColor('#1D4ED8')({chain}),true);
 assert.deepEqual(actions[0],['setMark','textStyle','#1d4ed8']);
 assert.equal(text.addCommands().setColor('expression(alert(1))')({chain}),false);
 assert.equal(text.addCommands().unsetColor()({chain}),true);
 assert.equal(runtime.safeColor('#FFF2A8'),'#fff2a8');
 assert.equal(runtime.safeColor('url(javascript:evil)'),null);
});

test('preview renders all 3 persisted colors and is still inert HTML',()=>{
 const api=rendererAPI();
 const html=api.renderDocument({standard:{designation:'T019'},sections:{businessJustification:richDoc}});
 assert.match(html,/style="background-color:#dbeafe;/);
 assert.match(html,/<span style="color:#b42318">/);
 assert.match(html,/<mark style="background-color:#fff2a8">/);
 assert.ok(!/<script\b/i.test(html));
 assert.match(html,/Content-Security-Policy/);
 assert.match(html,/s19-tasks/);
});

test('renderer ignores malicious or unrecognized color values',()=>{
 const api=rendererAPI();
 const document={type:'doc',content:[{type:'paragraph',attrs:{backgroundColor:'red;position:fixed'},content:[
  {type:'text',text:'SAFE',marks:[{type:'textStyle',attrs:{color:'red; background:url(javascript:alert(1))'}},{type:'highlight',attrs:{color:'url(evil)'}}]}
 ]}]};
 const html=api.renderNode(document);
 assert.equal(html,'<p><mark>SAFE</mark></p>');
 assert.ok(!html.includes('url('));
 const escaped=api.renderNode({type:'text',text:'<script>alert(1)</script>',marks:[{type:'textStyle',attrs:{color:'#ffffff'}}]});
 assert.ok(!escaped.includes('<script>'));
 assert.match(escaped,/&lt;script&gt;/);
});

test('editor uses native W2UI pickers, not hand-built hex swatches',()=>{
 assert.match(panel,/textColor:\{kind:'text',type:'text-color'/);
 assert.match(panel,/highlightColor:\{kind:'highlight',type:'color'/);
 assert.match(panel,/paragraphColor:\{kind:'paragraph',type:'color'/);
 assert.match(panel,/overlay:\{advanced:true,transparent:false\}/);
 assert.match(panel,/id:'resetColors'/);
 assert.doesNotMatch(panel,/S19_PALETTES|S19_COLOR_ACTIONS|colorSubmenu/);
 assert.match(panel,/submenu\('codeStyles','Code','Code',\['inlineCode','codeBlock'\]\)/);
 assert.match(panel,/editor\.chain\(\)\.focus\(\)/);
 assert.match(panel,/root\.__radarS19Formatting\.extensions/);
});

test('W2UI picker normalizes RGB hex, rejects unsafe strings, uses transparent as reset',()=>{
 const start=panel.indexOf('const S19_NATIVE_COLOR_ITEMS=');
 const end=panel.indexOf('const lang=()',start);
 const source=panel.slice(start,end);
 const performed=[];
 const chain={
  focus(){return this;},setTextSelection(range){performed.push(['selection',range]);return this;},
  setColor(value){performed.push(['text',value]);return this;},
  unsetColor(){performed.push(['clearText']);return this;},
  setHighlight(value){performed.push(['highlight',value.color]);return this;},
  unsetHighlight(){performed.push(['clearHighlight']);return this;},
  updateAttributes(node,value){performed.push(['paragraph',node,value.backgroundColor]);return this;},
  run(){return true;}
 };
 const context={editor:{chain:()=>chain,state:{doc:{content:{size:120}}}},target:()=>({editable:true}),s19ColorSelection:{from:2,to:8},console};
 const sandbox=vm.createContext(context);vm.runInContext(source,sandbox);
 const run=value=>vm.runInContext(value,sandbox);
 assert.equal(run("s19PickerHex('B42318')"),'#b42318');
 assert.equal(run("s19PickerHex('#ABCDEF')"),'#abcdef');
 assert.equal(run("s19PickerHex('rgba(0,0,0,0)')"),undefined);
 assert.equal(run("s19PickerHex('red;background:evil')"),undefined);
 assert.equal(run("s19PickerHex('')"),null);
 // Opening a W2UI popup does not format anything.
 run("s19HandleNativeColor({},'textColor')");assert.equal(performed.length,0);
 run("s19HandleNativeColor({color:'B42318'},'textColor')");
 assert.deepEqual(performed.at(-1),['text','#b42318']);
 run("s19HandleNativeColor({detail:{color:'#fff2a8'}},'highlightColor')");
 assert.deepEqual(performed.at(-1),['highlight','#fff2a8']);
 run("s19HandleNativeColor({color:'Dbeafe'},'paragraphColor')");
 assert.deepEqual(performed.at(-1),['paragraph','paragraph','#dbeafe']);
 run("s19HandleNativeColor({color:''},'paragraphColor')");
 assert.deepEqual(performed.at(-1),['paragraph','paragraph',null]);
 const size=performed.length;
 run("s19HandleNativeColor({color:'url(javascript:alert(1))'},'textColor')");
 assert.equal(performed.length,size);
 assert.ok(performed.some(x=>x[0]==='selection'));
});

test('native pickers and resets are discoverable in FR and EN',()=>{
 const begin=panel.indexOf('const S19_NATIVE_COLOR_ITEMS=');const end=panel.indexOf('function s19RunEditorAction(',begin);
 const code=panel.slice(begin,end);
 const baseContext={COMMANDS:[['bold'],['italic']],LABELS:{fr:['Gras','Italique'],en:['Bold','Italic']}};
 for(const language of ['fr','en']){
  const ctx={...baseContext,root:{i18next:{language}},S19_COLOR_PICKERS:{textColor:{initial:'263648'},highlightColor:{initial:'fff2a8'},paragraphColor:{initial:'f1f5f9'}}};
  const menus=vm.runInNewContext(code+'\ns19EditorItems()',ctx);
  const picker=menus.filter(x=>x.type==='color'||x.type==='text-color');
  assert.deepEqual(Array.from(picker,x=>x.id),['textColor','highlightColor','paragraphColor']);
  assert.deepEqual(Array.from(picker,x=>x.type),['text-color','color','color']);
  assert.ok(picker.every(x=>x.overlay.advanced&&x.overlay.transparent===false));
  const reset=menus.find(x=>x.id==='resetColors');
  assert.deepEqual(Array.from(reset.items,x=>x.id),['clearTextColor','clearHighlightColor','clearParagraphColor']);
  assert.ok(menus.find(x=>x.id==='styles').items.find(x=>x.id==='codeStyles'));
 }
});

test('existing sections, references, dossier editing, navigation and sandbox remain in place',()=>{
 assert.match(panel,/function write\(record,replace\)/);
 assert.match(panel,/function renderRelated\(\)/);
 assert.match(panel,/function updateToolbar\(\)/);
 assert.match(panel,/root\.__radarRationaleRevision/);
 assert.match(panel,/s19SafePreviewNode\(main,document\)/);
 assert.match(renderer,/case 'taskList'/);
 assert.match(renderer,/case 'table'/);
 assert.match(renderer,/case 'radarReference'/);
});
