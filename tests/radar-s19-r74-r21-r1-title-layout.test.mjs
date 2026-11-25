import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const repo=process.env.S19_REPO||path.resolve(here,'..');
const title=fs.readFileSync(path.join(repo,'js/radar-title.js'),'utf8');
const classic=fs.readFileSync(path.join(repo,'js/radar.js'),'utf8');
const geometry=fs.readFileSync(path.join(repo,'js/radar-geometry.js'),'utf8');
function setup(language='fr',radar='Radar stratégique avec un nom descriptif suffisamment long pour occuper plusieurs lignes'){
 const node={attrs:{},children:[],replaceChildren(){this.children=[];},setAttribute(k,v){this.attrs[k]=v;},appendChild(v){this.children.push(v);}};
 const doc={getElementById:id=>id==='svgTitle'?node:null,createElementNS:(_ns,tag)=>({tag,attrs:{},setAttribute(k,v){this.attrs[k]=v;},textContent:''})};
 const root={document:doc,i18next:{language,on(){}},__radarRevisionSession:{status:()=>({activeGroup:'A'})},__radarCatalogAdapter:{getRevision:()=>({radarId:'a',version:'1.0',status:'draft',extensions:{}})},__radarWorkspaceExplorer:{describeActive:()=>({organization:'Organisation fictive',radar}),graph:()=>null},__radarCatalogPersistence:{getRadarName:()=>radar}};
 vm.runInNewContext(title,{window:root,Intl,Date});
 return {node,root};
}
test('SVG allocates a header instead of overlaying the radar circles',()=>{
 for(const src of [classic,geometry])assert.match(src,/viewBox['", ]+['"]0 -120 800 920['"]/);
 const {node,root}=setup();assert.equal(root.__radarTitle.refresh(),true);
 assert.equal(node.attrs.y,'-492');assert.equal(node.attrs['text-anchor'],'middle');
 const spans=node.children;assert.equal(spans[0].textContent,'Strategic Standard Chart');assert.ok(spans.length>=5);
 assert.equal(spans[0].attrs['font-size'],'19');assert.equal(spans.at(-1).attrs['font-size'],'11');
});
test('organization and radar appear on separate lines, long names wrap',()=>{
 const {node,root}=setup();root.__radarTitle.refresh();
 assert.equal(node.children[1].textContent,'Organisation fictive');
 assert.ok(node.children.length>=6);assert.ok(node.children.every(c=>c.textContent.length<=100));
});
test('FR/EN, status, and missing timestamp remain truthful',()=>{
 const {node,root}=setup('fr','Radar ISO');root.__radarTitle.refresh();
 assert.ok(node.children.some(x=>x.textContent.includes('Brouillon')));
 assert.ok(node.children.some(x=>x.textContent.includes('Dernière sauvegarde: non disponible')));
 root.i18next.language='en';root.__radarTitle.refresh();
 assert.ok(node.children.some(x=>x.textContent.includes('Draft')));
 assert.ok(node.children.some(x=>x.textContent.includes('Last saved: unavailable')));
});
test('title stays text-only; no HTML injection',()=>{
 const {node,root}=setup('fr','<script>bad</script>');root.__radarTitle.refresh();
 assert.ok(node.children.some(x=>x.textContent.includes('<script>bad</script>')));
 assert.ok(node.children.every(x=>x.tag==='tspan'));
});
