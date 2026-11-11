import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const source=fs.readFileSync(path.join(process.cwd(),'js/radar-iso-toolbar.js'),'utf8');
function boot(){
 const handlers=new Map();
 const old={initialize(){return true;},refresh(){},open(){}};
 const win={__radarStandardsPanel:old,i18next:{language:'fr',t:(k,{defaultValue})=>defaultValue,addResourceBundle(){},on(k,fn){handlers.set(k,fn);}}};
 vm.runInNewContext(source,{window:win});return {win,handlers,old};
}
function btn(translation){return {dataset:{isoTranslation:translation},style:{},attributes:{},setAttribute(k,v){this.attributes[k]=v;},click(){this.clicked=(this.clicked||0)+1;}};}
function dom(win){
 const modes=['ics','committees','references'].map(id=>({dataset:{catalogMode:id}}));
 const operations=['refresh','sync','import','distributedSync','rssSync','changesLoad','add'].map(btn);
 const input={nextSibling:null};
 const bar={dataset:{},children:[...modes,...operations], listeners:{}, querySelector(sel){return sel==='input[type="search"]'?input:null;}, querySelectorAll(sel){return sel==='button'?this.children:[];},insertBefore(el){this.children.push(el);},appendChild(el){this.children.push(el);},addEventListener(k,cb){this.listeners[k]=cb;}};
 const status={textContent:'81 768 ISO standards cached',attributes:{},setAttribute(k,v){this.attributes[k]=v;}};
 const mount={querySelector(sel){if(sel==='[data-catalog-mode]')return {parentElement:bar};if(sel==='[role="status"]')return status;}};
 const actionContainer={children:[],appendChild(x){this.children.push(x);}};
 win.document={createElement(){return {dataset:{},style:{},attributes:{},setAttribute(k,v){this.attributes[k]=v;},addEventListener(k,cb){this['handler'+k]=cb;},click(){this.handlerclick?.();}}},getElementById(id){return id==='iso-source-manager-actions'?actionContainer:id==='iso-source-manager-activity'?{textContent:'',attributes:{},setAttribute(k,v){this.attributes[k]=v;}}:{};}};
 let form=null,popup=null;
 win.w2form=function(config){form=config;this.render=()=>{};};
 win.w2popup={open(config){popup=config;const ev={onComplete:null};config.onOpen(ev);ev.onComplete?.();}};
 return {mount,bar,operations,modeButtons:modes,form:()=>form,popup:()=>popup,actions:()=>actionContainer.children,status};
}
test('wrapper preserves existing business panel API',()=>{const {win,old}=boot();assert.equal(win.__radarStandardsPanel.refresh,old.refresh);assert.equal(win.__radarStandardsPanel.__sourceManagerInstalled,true);});
test('technical actions are hidden, original handlers retained',()=>{const {win}=boot();const d=dom(win);win.__radarStandardsPanel.initialize(d.mount);const manager=d.bar.children.find(x=>x.dataset.isoManageSources);assert.ok(manager);for(const op of d.operations.filter(x=>x.dataset.isoTranslation!=='add'))assert.equal(op.style.display,'none');assert.equal(d.operations.at(-1).style.display,'none');manager.click();assert.ok(d.popup());assert.match(d.popup().title,/sources/i);d.popup().onOpen({onComplete:null});});
test('form actions invoke original technical handlers; never replace source logic',()=>{const {win}=boot();const d=dom(win);win.__radarStandardsPanel.initialize(d.mount);const manager=d.bar.children.find(x=>x.dataset.isoManageSources);manager.click();const cfg=d.form();assert.ok(cfg);assert.equal(Object.keys(cfg.actions).length,0);assert.equal(d.actions().length,6);d.actions()[0].click();assert.equal(d.operations[0].clicked,1);d.actions()[5].click();assert.equal(d.operations[2].clicked,1);});
test('business Add button is visible only for local references',()=>{const {win}=boot();const d=dom(win);win.__radarStandardsPanel.initialize(d.mount);const add=d.operations.at(-1);assert.equal(add.style.display,'none');d.bar.listeners.click({target:{closest(){return d.modeButtons[2];}}});assert.equal(add.style.display,'');d.bar.listeners.click({target:{closest(){return d.modeButtons[0];}}});assert.equal(add.style.display,'none');});
test('FR/EN switches via i18next without duplicating controls',()=>{const {win,handlers}=boot();const d=dom(win);win.__radarStandardsPanel.initialize(d.mount);const manage=d.bar.children.find(x=>x.dataset.isoManageSources);assert.equal(manage.textContent,'Gérer les sources');win.i18next.language='en';handlers.get('languageChanged')();assert.equal(manage.textContent,'Manage sources');manage.click();assert.equal(d.popup().title,'ISO catalogue sources');});
test('technical actions absent from a deployment are not invented',()=>{const {win}=boot();const d=dom(win);d.bar.children=d.bar.children.filter(x=>!['rssSync','changesLoad'].includes(x.dataset?.isoTranslation));win.__radarStandardsPanel.initialize(d.mount);d.bar.children.find(x=>x.dataset.isoManageSources).click();assert.equal(d.actions().length,4);});
