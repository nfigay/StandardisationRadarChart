import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../js/radar-standards-panel.js',import.meta.url),'utf8');
function build(){
 const resources={},listeners={}; let lang='fr';
 const i18next={
  get language(){return lang;},get resolvedLanguage(){return lang;},
  addResourceBundle(l,ns,chunk){resources[l]={...(resources[l]||{}),...chunk};},
  t(key,opts={}){const names=key.split('.');let result=resources[lang];for(const name of names)result=result?.[name];return result??opts.defaultValue??key;},
  on(type,fn){(listeners[type]??=[]).push(fn);},
  switch(l){lang=l;for(const f of listeners.languageChanged||[])f(l);}
 };
 const window={i18next};window.location ??= {href:'https://example.test/js/radar-standards-panel.js'};vm.runInNewContext(source,{window,URL});
 return {window,i18next,resources};
}
test('registers both language bundles into existing i18next instance',()=>{
 const {resources}=build();
 assert.equal(resources.fr.isoPanel.scopeFr,'Description française');
 assert.equal(resources.en.isoPanel.scopeFr,'French description');
 assert.equal(resources.en.isoPanel.colTitle,'Title');
 assert.equal(resources.fr.isoPanel.colTitle,'Titre');
});
test('w2form fields, tabs and columns are resolved through i18n keys',()=>{
 assert.match(source,/label:tr\(name\)/);
 assert.match(source,/text:tr\('formTab'\)/);
 assert.match(source,/text:tr\('rawTab'\)/);
 assert.match(source,/text:tr\('colTitle'\)/);
 assert.match(source,/text:tr\('colEnglishTitle'\)/);
 assert.match(source,/text:tr\('detailColumn'\)/);
 assert.match(source,/escapeHtml\(tr\('detail'\)\)/);
});
test('no ellipsis on generated form field labels, while grid stays compact',()=>{
 assert.match(source,/text-overflow:clip!important/);
 assert.match(source,/white-space:normal!important/);
 assert.match(source,/span:8/);
 assert.match(source,/recordHeight:28/);
 assert.match(source,/readonly style=/);
 assert.match(source,/actions:\{\}/);
});
test('reacts to languageChanged without creating another i18n store',()=>{
 assert.match(source,/i18next\.on\('languageChanged'/);
 assert.match(source,/updateStaticLabels\(\)/);
 const {window,i18next}=build();
 assert.equal(typeof window.__radarStandardsPanel.refresh,'function');
 assert.doesNotThrow(()=>i18next.switch('en'));
});
