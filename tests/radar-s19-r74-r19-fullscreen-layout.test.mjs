import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const load=(repoPath,payloadPath)=>{const a=new URL(repoPath,import.meta.url);const b=new URL(payloadPath,import.meta.url);return fs.readFileSync(fs.existsSync(a)?a:b,'utf8');};
const panel=load('../js/radar-rationale-panel.js','../payload/js/radar-rationale-panel.js');
const css=load('../css/radar-rationale-fullscreen.css','../payload/radar-rationale-fullscreen.css');

test('fullscreen uses a root-owned W2UI layout rather than CSS enlargement of right pane',()=>{
 assert.match(panel,/new root\.w2layout\(\{name:'s19DocumentFullscreenLayout'/);
 assert.match(panel,/document\.body\.appendChild\(host\)/);
 assert.match(panel,/target\.appendChild\(shell\)/);
 assert.doesNotMatch(panel,/classList\.toggle\('s19-fullscreen'/);
});
test('live editor shell is moved back before layout destruction',()=>{
 const a=panel.indexOf('function s19CloseFullscreen()');
 const b=panel.indexOf('function s19FullscreenEscape(',a);
 const fn=panel.slice(a,b);
 assert.ok(fn.indexOf('insertBefore(shell')>=0);
 assert.ok(fn.indexOf('insertBefore(shell')<fn.indexOf('s19FullscreenLayout?.destroy'));
 assert.doesNotMatch(fn,/killEditor|renderSection|saveEditor/);
});
test('layout owns header and document panel, not a duplicate Tiptap editor',()=>{
 assert.match(panel,/type:'top',size:49/);
 assert.match(panel,/type:'main',overflow:'hidden'/);
 assert.match(panel,/s19FullscreenButton\(\)/);
 assert.match(panel,/root\.addEventListener\('keydown',s19FullscreenEscape,true\)/);
 assert.match(panel,/root\.removeEventListener\('keydown',s19FullscreenEscape,true\)/);
});
test('fullscreen covers viewport; document scrolls below navigation',()=>{
 assert.match(css,/#s19-document-fullscreen-root \{/);
 assert.match(css,/height:100dvh/);
 assert.match(css,/#s19-document-fullscreen-root #s19-shell \{/);
 assert.match(css,/overflow-y:auto;overflow-x:hidden/);
 assert.match(css,/\.s19-table-wrap \{max-width:100%;overflow-x:auto/);
});
test('opening/closing preserves same DOM shell, including editor subtree',()=>{
 const start=panel.indexOf('function s19FullscreenLabel()');
 const end=panel.indexOf('const clone=x=>',start);
 const extracted=panel.slice(start,end);
 const elements={};
 function element(id){return elements[id]??null;}
 const original={isConnected:true,children:[],appendChild(node){if(node.parentNode)node.parentNode.children=node.parentNode.children.filter(x=>x!==node);this.children.push(node);node.parentNode=this;},insertBefore(node,next){if(node.parentNode)node.parentNode.children=node.parentNode.children.filter(x=>x!==node);const at=this.children.indexOf(next);this.children.splice(at<0?this.children.length:at,0,node);node.parentNode=this;}};
 const shell={id:'s19-shell',parentNode:null,nextSibling:null};original.appendChild(shell);
 const editorChild={id:'tiptap-live-editor',selection:{from:12,to:24},json:{content:'unsaved'}};shell.editor=editorChild;
 const exit={};const title={};const full={style:{},setAttribute(){}};elements['s19-shell']=shell;elements['s19-full']=full;elements['s19-fullscreen-title']=title;elements['s19-fullscreen-exit']=exit;
 const listeners=new Map();
 const root={w2layout:class{constructor(options){this.options=options;this.target={children:[],appendChild(n){if(n.parentNode)n.parentNode.children=n.parentNode.children.filter(x=>x!==n);this.children.push(n);n.parentNode=this;}};}render(host){elements['s19-fullscreen-document-host']=this.target;this.host=host;}resize(){this.resized=true;}destroy(){this.destroyed=true;}},w2ui:{mainLayout:{resize(){}}},addEventListener(key,fn){listeners.set(key,fn);},removeEventListener(key){listeners.delete(key);}};
 const document={body:{appendChild(node){node.isConnected=true;}},head:{appendChild(node){elements[node.id]=node;}},getElementById:element,createElement(tag){return {tag,id:null,setAttribute(){},remove(){this.removed=true;this.isConnected=false;}};}};
 const context={root,document,byId:element,t:key=>key,current:()=>null,currentNode:null,console,expanded:false,s19PreviewStyle(){}};
 // Declarations from the original closure need one initial active binding in this isolated harness.
 vm.runInNewContext('let expanded=false;let s19FullscreenLayout=null,s19FullscreenHost=null,s19OriginalParent=null,s19OriginalNext=null;'+extracted.replace(/^\/\/ R19:[^\n]*\n/,'').replace(/^let s19FullscreenLayout=null,s19FullscreenHost=null,s19OriginalParent=null,s19OriginalNext=null;/,''),context);
 vm.runInNewContext('s19OpenFullscreen()',context);
 assert.equal(shell.parentNode,elements['s19-fullscreen-document-host']);
 assert.equal(shell.editor,editorChild);
 vm.runInNewContext('s19CloseFullscreen()',context);
 assert.equal(shell.parentNode,original);
 assert.equal(shell.editor,editorChild);
 assert.deepEqual(editorChild.json,{content:'unsaved'});
 assert.equal(listeners.size,0);
});
