import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const root=process.env.S19_REPO||process.cwd();
const local=path.join(root,'js/radar-title.js');
const source=fs.existsSync(local)?local:path.resolve(here,'../payload/js/radar-title.js');
function boot(){
 const listeners={};
 const doc={node:null,getElementById(id){return id==='svgTitle'?this.node:null;},createElementNS(_ns,tag){return {tag,attrs:{},setAttribute(k,v){this.attrs[k]=v;},textContent:''};}};
 const win={document:doc,i18next:{language:'fr',on(name,fn){listeners[name]=fn;}},__radarRevisionSession:{status:()=>({activeGroup:'group'})},
  __radarCatalogAdapter:{getRevision:()=>({radarId:'r',title:'Quality',version:'1.4',status:'draft',extensions:{}})},
  __radarWorkspaceExplorer:{describeActive:()=>({organization:'Organisation X'}),graph:()=>({})},
  __radarCatalogPersistence:{status:()=>({importedCatalogs:1}),getRadarName:()=> 'Radar ISO',isDirty:()=>true}};
 const ctx=vm.createContext({window:win,Intl,Date,console});
 vm.runInContext(fs.readFileSync(source,'utf8'),ctx,{filename:source});
 return {win,doc,listeners};
}
test('i18n FR/EN labels and locale-specific last saved date',()=>{
 const {win}=boot();const meta={organization:'ACME',radar:'Quality',version:'1.0',status:'draft',savedAt:'2026-11-24T07:15:00Z',dirty:true};
 const fr=win.__radarTitle.compose(meta,'fr').join('|'),en=win.__radarTitle.compose(meta,'en').join('|');
 assert.match(fr,/Strategic Standard Chart/);assert.match(fr,/Brouillon/);assert.match(fr,/Dernière sauvegarde/);assert.match(fr,/Modifications non enregistrées/);
 assert.match(en,/Draft/);assert.match(en,/Last saved/);assert.match(en,/Unsaved changes/);
 assert.doesNotMatch(fr,/Standards Radar Chart/);
});
test('unknown save timestamp is not fabricated',()=>{
 const {win}=boot();const fr=win.__radarTitle.compose({status:'published'},'fr').join('|');
 assert.match(fr,/non disponible/);assert.doesNotMatch(fr,/24\/11\/2026/);
});
test('last modified is distinguished from last saved',()=>{
 const {win}=boot();const fr=win.__radarTitle.compose({modifiedAt:'2026-11-24T12:00:00Z'},'fr').join('|');
 assert.match(fr,/Dernière modification/);assert.doesNotMatch(fr,/Dernière sauvegarde/);
});
test('SVG title refresh is idempotent and uses text nodes',()=>{
 const {win,doc,listeners}=boot();
 doc.node={attrs:{},children:[],replaceChildren(){this.children=[];},setAttribute(k,v){this.attrs[k]=v;},appendChild(x){this.children.push(x);}};
 assert.equal(win.__radarTitle.refresh(),true);assert.equal(doc.node.children[0].textContent,'Strategic Standard Chart');
 assert.equal(doc.node.children.length,5);
 win.i18next.language='en';listeners.languageChanged();
 assert.equal(doc.node.children.length,5);assert.match(doc.node.children[3].textContent,/Draft/);
 assert.match(doc.node.children[4].textContent,/Unsaved changes/);
});
