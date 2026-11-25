import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const repo=process.env.S19_REPO||process.cwd();
const src=fs.readFileSync(path.join(repo,'js/radar-rationale-panel.js'),'utf8');
const start=src.indexOf('const S19_PREVIEW_TAGS=');
const end=src.indexOf('function renderSection(){',start);
assert.ok(start>0&&end>start);
class Style {
 constructor(dict={}){this.dict={...dict};this.keys=Object.keys(dict);}
 get length(){return this.keys.length;}
 item(i){return this.keys[i];}
 getPropertyValue(key){return this.dict[key]??'';}
 setProperty(key,value){this.dict[key]=value;this.keys=Object.keys(this.dict);}
}
class El {
 constructor(tag,attrs={},children=[],style={}){
  this.tagName=tag.toUpperCase();this.nodeType=1;this.attrs=attrs;this.childNodes=children;this.style=new Style(style);this.setAttrs={};this.className='';this.classList=(attrs.class||'').split(/\s+/).filter(Boolean);
  this.classList.contains=x=>(attrs.class||'').split(/\s+/).includes(x);
 }
 getAttribute(k){return this.attrs[k]??null;}
 setAttribute(k,v){this.setAttrs[k]=v;}
 appendChild(x){(this.children??=[]).push(x);}
}
const document={createElement:t=>new El(t),createTextNode:v=>({nodeType:3,nodeValue:v})};
class FakeSheet {
 replaceSync(text) {
  this.cssRules=[...text.matchAll(/([^{}]+)\{([^{}]+)\}/g)].map(m=>({
   type:1,selectorText:m[1].trim(),
   style:new Style(Object.fromEntries(m[2].split(';').filter(Boolean).map(x=>{
    const pos=x.indexOf(':');return [x.slice(0,pos).trim(),x.slice(pos+1).trim()];
   })))
  }));
 }
}
const ctx=vm.createContext({document,root:{CSSStyleSheet:FakeSheet}});
vm.runInContext(src.slice(start,end)+'\nglobalThis.clean=s19SafePreviewNode;globalThis.scoped=s19ScopedRendererCss;',ctx);
const clean=ctx.clean;
test('retains Tiptap foreground, highlight, cell backgrounds and pixel sizes',()=>{
 const n=new El('td',{colspan:'2',class:'s19-rich-cell'},[new El('span',{},[{nodeType:3,nodeValue:'colored'}],{'color':'#ffd700','background-color':'#177acc'})],{'width':'480px','height':'160px','border':'1px solid #b9c8d4','text-align':'center'});
 const out=clean(n,document);
 assert.equal(out.setAttrs.colspan,'2');assert.equal(out.className,'s19-rich-cell');
 assert.equal(out.style.dict.width,'480px');assert.equal(out.style.dict.height,'160px');
 assert.equal(out.style.dict.border,'1px solid #b9c8d4');
 assert.equal(out.children[0].style.dict.color,'#ffd700');assert.equal(out.children[0].style.dict['background-color'],'#177acc');
});
test('preserves column sizing and full table semantics',()=>{
 const table=new El('table',{},[new El('colgroup',{},[new El('col',{},[],{width:'260px'}),new El('col',{},[],{width:'340px'})]),new El('tbody',{},[new El('tr',{},[new El('td',{rowspan:'2'},[],{'min-width':'200px'})])])],{'border-collapse':'collapse','width':'600px'});
 const out=clean(table,document);
 assert.equal(out.style.dict.width,'600px');assert.equal(out.children[0].tagName,'COLGROUP');assert.equal(out.children[0].children[1].style.dict.width,'340px');assert.equal(out.children[1].children[0].children[0].setAttrs.rowspan,'2');
});
test('filters scripts, frame, event handlers, unsafe URL and CSS',()=>{
 const n=new El('main',{onclick:'evil'},[new El('script'),new El('iframe'),new El('p',{onmouseover:'evil'},[],{'color':'red','background-image':'url(https://evil.invalid/p)','position':'fixed','background-color':'expression(alert(1))'}),new El('a',{href:'javascript:alert(1)'})]);
 const out=clean(n,document);assert.equal(out.children.length,2);
 assert.equal(out.children[0].style.dict.color,'red');assert.equal(out.children[0].style.dict['background-image'],undefined);assert.equal(out.children[0].style.dict.position,undefined);assert.equal(out.children[0].style.dict['background-color'],undefined);assert.equal(out.children[1].setAttrs.href,undefined);
});
test('retains safe renderer stylesheet but always scopes rules to preview',()=>{
 const parsed={head:{querySelectorAll:()=>[{textContent:'body{font-size:15px;color:#253044} table td{border:1px solid #ccc;width:220px;background:url(https://bad.invalid)} @import url(https://bad.invalid); #unrelated{position:fixed}'}]}};
 const css=ctx.scoped(parsed);
 assert.match(css,/\.s19-preview-document\{font-size:15px;color:#253044\}/);
 assert.match(css,/\.s19-preview-document table td\{border:1px solid #ccc;width:220px\}/);
 assert.doesNotMatch(css,/url\(/);assert.doesNotMatch(css,/position:fixed/);
});
test('preview never creates an iframe and does not force tables to fit the panel',()=>{
 const section=src.slice(src.indexOf('function renderSection(){'),src.indexOf('function updateSections(){'));
 assert.doesNotMatch(section,/createElement\(['"]iframe['"]\)|\.srcdoc/);
 assert.doesNotMatch(src,/table\{width:100%;table-layout:fixed\}/);
 assert.match(src,/s19SafeDeclarations\(source\.style\)/);
 assert.match(src,/s19ScopedRendererCss\(parsed\)/);
});
test('list indentation and ordered-list start survive sanitized preview',()=>{
 const list=new El('ol',{'start':'3','data-s19-indent':'2'},[new El('li',{},[{nodeType:3,nodeValue:'Item'}])],{'list-style-type':'lower-alpha'});
 const out=clean(list,document);
 assert.equal(out.setAttrs.start,'3');assert.equal(out.setAttrs['data-s19-indent'],'2');assert.equal(out.style.dict['list-style-type'],'lower-alpha');
});
test('preview can retain task-list flex and safe renderer table styling',()=>{
 const parsed={head:{querySelectorAll:()=>[{textContent:'li.s19-task{display:flex;align-items:flex-start;gap:9px}td,th{border:1px solid #c6ccd4;padding:6px;text-align:left}th{background:#f0f3f7}table{width:100%;table-layout:fixed}'}]}};
 const css=ctx.scoped(parsed);
 assert.match(css,/\.s19-preview-document li\.s19-task\{display:flex;align-items:flex-start;gap:9px\}/);
 assert.match(css,/\.s19-preview-document th\{background:#f0f3f7\}/);
 assert.doesNotMatch(css,/\.s19-preview-document table\{[^}]*width:100%/);
 assert.doesNotMatch(css,/\.s19-preview-document table\{[^}]*table-layout:fixed/);
});
