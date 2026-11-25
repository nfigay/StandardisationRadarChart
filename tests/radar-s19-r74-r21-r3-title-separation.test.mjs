import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const repo=process.env.S19_REPO || path.resolve(here,'..');
const code=fs.readFileSync(path.join(repo,'js/radar-title.js'),'utf8');
function fixture(){
 const byId=new Map();let resizeCalls=0;const raf=[];
 function node(tag,id=''){
  const n={tag,id,children:[],parentNode:null,attrs:{},className:'',textContent:'',classList:{add(...x){x.forEach(c=>this.set.add(c));},remove(...x){x.forEach(c=>this.set.delete(c));},set:new Set()},setAttribute(k,v){this.attrs[k]=v;},appendChild(ch){if(ch.parentNode)ch.parentNode.children=ch.parentNode.children.filter(c=>c!==ch);this.children.push(ch);ch.parentNode=this;return ch;},insertBefore(ch,other){if(ch.parentNode)ch.parentNode.children=ch.parentNode.children.filter(c=>c!==ch);let i=this.children.indexOf(other);this.children.splice(i<0?this.children.length:i,0,ch);ch.parentNode=this;return ch;},replaceChildren(...chs){this.children.forEach(c=>c.parentNode=null);this.children=[];chs.forEach(c=>this.appendChild(c));},get firstChild(){return this.children[0]??null;}};
  if(id)byId.set(id,n);return n;
 }
 const head=node('head'),main=node('div','main-container'),viewport=node('div','radar-container'),svgHost=node('div','svg-container'),cyHost=node('div','cy-container'),svg=node('svg');
 main.appendChild(viewport);viewport.appendChild(svgHost);viewport.appendChild(cyHost);svgHost.appendChild(svg);const title=node('text','svgTitle');svg.appendChild(title);
 const doc={head,getElementById(id){if(byId.has(id))return byId.get(id);const walk=n=>{if(n.id===id)return n;for(const c of n.children){const r=walk(c);if(r)return r;}return null;};return walk(head)||walk(main);},createElement(tag){return node(tag);},createElementNS(_ns,tag){return node(tag);}};
 const root={document:doc,requestAnimationFrame(fn){raf.push(fn);},__radarViewportSync(){resizeCalls++;},i18next:{language:'fr',on(){}},__radarRevisionSession:{status:()=>({activeGroup:'A'})},__radarCatalogAdapter:{getRevision:()=>({radarId:'r1',version:'1.0.0',status:'draft',extensions:{}})},__radarWorkspaceExplorer:{describeActive:()=>({organization:'Organisation fictive'}),graph:()=>null},__radarCatalogPersistence:{getRadarName:()=> 'Radar expérimental'}};
 vm.runInNewContext(code,{window:root,Intl,Date});
 return {root,head,main,viewport,svgHost,cyHost,svg,title,raf,get resizeCalls(){return resizeCalls;}};
}
test('title occupies a sibling region, never the SVG or Cytoscape viewport',()=>{
 const f=fixture();assert.equal(f.root.__radarTitle.refresh(),true);
 assert.equal(f.main.children.length,2);assert.equal(f.main.children[1],f.viewport);
 const header=f.main.children[0];assert.equal(header.id,'s19-radar-title-header');
 assert.equal(f.svgHost.parentNode,f.viewport);assert.equal(f.cyHost.parentNode,f.viewport);
 assert.equal(f.svg.parentNode,f.svgHost);
 assert.equal(header.children[0].textContent,'Strategic Standard Chart');
 assert.ok(f.main.classList.set.has('s19-title-layout'));
 assert.ok(!f.svgHost.classList.set.has('s19-title-host'));
});
test('CSS reserves space in the parent and SVG/Cytoscape remain overlaid together',()=>{
 const f=fixture();f.root.__radarTitle.refresh();const css=f.head.children[0].textContent;
 assert.match(css,/#main-container\.s19-title-layout\{[^}]*flex-direction:column/);
 assert.match(css,/#main-container\.s19-title-layout > #radar-container\{[^}]*flex:1 1 0!important;[^}]*height:auto!important/);
 assert.match(css,/#svg-container\{[^}]*position:absolute;top:0;left:0;width:100%;height:100%/);
 assert.doesNotMatch(css,/#svg-container\.s19-title-host\{display:flex/);
 assert.match(css,/#svgTitle\{visibility:hidden\}/);
});
test('refresh does not duplicate header and preserves i18n, SVG node and viewport sync',()=>{
 const f=fixture();f.root.__radarTitle.refresh();f.root.i18next.language='en';f.root.__radarTitle.refresh();
 assert.equal(f.main.children.filter(n=>n.id==='s19-radar-title-header').length,1);
 assert.ok(f.main.children[0].children.some(n=>n.textContent.includes('Draft')));
 assert.equal(f.svg.children[0],f.title);
 f.raf.forEach(fn=>fn());assert.equal(f.resizeCalls,2);
});
test('legacy R21-R2 nested header is moved out of SVG overlay',()=>{
 const f=fixture();const legacy=f.root.document.createElement('div');legacy.id='s19-radar-title-header';f.svgHost.insertBefore(legacy,f.svg);
 f.svgHost.classList.add('s19-title-host');
 f.root.__radarTitle.refresh();assert.equal(f.main.children[0],legacy);
 assert.deepEqual(f.svgHost.children,[f.svg]);
 assert.equal(f.svgHost.classList.set.has('s19-title-host'),false);
});
test('untrusted metadata rendered only as text',()=>{
 const f=fixture();f.root.__radarCatalogPersistence.getRadarName=()=>'<img src=x onerror=alert(1)>';
 f.root.__radarTitle.refresh();
 assert.ok(f.main.children[0].children.some(n=>n.textContent.includes('<img')));
});
