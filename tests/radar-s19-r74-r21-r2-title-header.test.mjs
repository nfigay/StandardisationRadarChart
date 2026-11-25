import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const repo=process.env.S19_REPO || path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const code=fs.readFileSync(path.join(repo,'js/radar-title.js'),'utf8');
function fake(){
 const nodes=new Map();
 const make=(tag)=>({tag,children:[],parentNode:null,id:'',classList:{add(){},remove(){}},attrs:{},setAttribute(k,v){this.attrs[k]=v;},appendChild(child){this.children.push(child);child.parentNode=this;nodes.set(child.id,child);return child;},insertBefore(child,ref){this.children=this.children.filter(x=>x!==child);this.children.splice(Math.max(0,this.children.indexOf(ref)),0,child);child.parentNode=this;nodes.set(child.id,child);return child;},replaceChildren(){this.children=[];},get firstChild(){return this.children[0]||null;}});
 const host=make('div');host.id='svg-container';nodes.set(host.id,host);const svg=make('svg');host.appendChild(svg);const title=make('text');title.id='svgTitle';svg.appendChild(title);const head=make('head');
 const main=make('div');main.id='main-container';
 nodes.set(main.id,main);
 const viewport=make('div');viewport.id='radar-container';
 nodes.set(viewport.id,viewport);
 main.appendChild(viewport);
 viewport.appendChild(host);
 const document={head,getElementById:id=>nodes.get(id)||null,createElement:make,createElementNS:(_ns,tag)=>make(tag)};
 const root={document,i18next:{language:'fr',on(){}},__radarRevisionSession:{status:()=>({activeGroup:'A'})},__radarCatalogAdapter:{getRevision:()=>({radarId:'r1',version:'1.0.0',status:'draft',extensions:{}})},__radarWorkspaceExplorer:{describeActive:()=>({organization:'Organisation fictive',radar:'Radar expérimental'}),graph:()=>null},__radarCatalogPersistence:{getRadarName:()=> 'Radar expérimental'}};
 vm.runInNewContext(code,{window:root,Intl,Date});return {root,host:main,viewport,svgHost:host,head,svg,title};
}
test('visible DOM header is before SVG, keeping the same SVG drawing',()=>{
 const {root,host,viewport,svgHost,svg}=fake();assert.equal(root.__radarTitle.refresh(),true);
 assert.equal(host.children.length,2);assert.equal(host.children[1],viewport);assert.equal(viewport.children[0],svgHost);assert.equal(svgHost.children[0],svg);
 const heading=host.children[0];assert.equal(heading.id,'s19-radar-title-header');
 assert.equal(heading.children[0].textContent,'Strategic Standard Chart');
 assert.ok(heading.children.some(x=>x.textContent.includes('Brouillon')));
 assert.ok(heading.children.some(x=>x.textContent.includes('Dernière sauvegarde')));
});
test('repeat refresh updates one header and respects language',()=>{
 const {root,host}=fake();root.__radarTitle.refresh();root.i18next.language='en';root.__radarTitle.refresh();
 assert.equal(host.children.filter(x=>x.id==='s19-radar-title-header').length,1);
 assert.ok(host.children[0].children.some(x=>x.textContent.includes('Draft')));
});
test('CSS creates actual space above the SVG and suppresses duplicate live text',()=>{
 const {root,head}=fake();root.__radarTitle.refresh();const css=head.children[0].textContent;
 assert.match(css,/display:flex!important;flex-direction:column!important/);
 assert.match(css,/flex:1 1 0!important/);
 assert.match(css,/#svgTitle\{visibility:hidden\}/);
});
test('untrusted organization/radar text remains literal, not markup',()=>{
 const {root,host}=fake();root.__radarCatalogPersistence.getRadarName=()=>'<img src=x onerror=alert(1)>';
 root.__radarTitle.refresh();assert.ok(host.children[0].children.some(x=>x.textContent.includes('<img')));
});
