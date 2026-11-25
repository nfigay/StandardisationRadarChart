import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
const src=fs.readFileSync(path.join(process.env.S19_REPO||process.cwd(),'js/radar-rationale-panel.js'),'utf8');
const start=src.indexOf('const S19_PREVIEW_TAGS=');
const end=src.indexOf('function s19WorkspacePreview(',start);
assert.ok(start>0&&end>start,'safe renderer exists');
class Element {
 constructor(tag,attrs={},children=[]){this.tagName=tag.toUpperCase();this.nodeType=1;this.attrs=attrs;this.childNodes=children;this.className='';this.setAttrs={};this.classList={contains:s=>(attrs.class||'').split(' ').includes(s)};}
 getAttribute(k){return Object.hasOwn(this.attrs,k)?this.attrs[k]:null;}
 setAttribute(k,v){this.setAttrs[k]=v;}
 appendChild(c){(this.children??=[]).push(c);}
}
const doc={createElement:t=>new Element(t),createTextNode:t=>({nodeType:3,nodeValue:t})};
const ctx=vm.createContext({document:doc});
vm.runInContext(src.slice(start,end)+'\nglobalThis.clean=s19SafePreviewNode;',ctx);
const clean=ctx.clean;
test('Workspace preview renders without iframe/srcdoc and does not enable scripts',()=>{
 const section=src.slice(src.indexOf('function renderSection(){'),src.indexOf('function updateSections(){'));
 assert.doesNotMatch(section,/createElement\(['"]iframe['"]\)|\.srcdoc\s*=|allow-scripts/);
 assert.match(section,/s19WorkspacePreview\(doc,renderer\)/);
 assert.match(src,/renderPreview:\(record,lang\)=>root\.__radarRationaleRenderer\?\.renderDocument/);
});
test('only allowed tags and text survive; scripts, frames and event handlers are stripped',()=>{
 const main=new Element('main',{},[
  new Element('p',{onclick:'alert(1)'},[{nodeType:3,nodeValue:'Safe'}]),
  new Element('script',{},[{nodeType:3,nodeValue:'alert(1)'}]),
  new Element('iframe',{src:'evil'}),
  new Element('img',{onerror:'alert(2)',src:'evil'}),
  new Element('a',{href:'javascript:alert(1)',onclick:'alert(1)'},[{nodeType:3,nodeValue:'unsafe link'}])
 ]);
 const out=clean(main,doc);
 assert.equal(out.children.length,2);
 assert.equal(out.children[0].tagName,'P');
 assert.deepEqual(out.children[0].setAttrs,{});
 assert.equal(out.children[1].tagName,'A');
 assert.deepEqual(out.children[1].setAttrs,{});
});
test('safe external links retain opener protection',()=>{
 const link=clean(new Element('a',{href:'https://www.iso.org/standards.html',target:'evil',onclick:'bad'}),doc);
 assert.equal(link.setAttrs.href,'https://www.iso.org/standards.html');
 assert.equal(link.setAttrs.target,'_blank');
 assert.equal(link.setAttrs.rel,'noopener noreferrer');
});
test('only trusted reference navigation buttons retain data attributes',()=>{
 const btn=clean(new Element('button',{class:'s19-reference','data-blip-id':'T019','data-standard-id':'ISO-1234',onclick:'evil'}),doc);
 assert.equal(btn.className,'s19-reference');
 assert.equal(btn.setAttrs['data-blip-id'],'T019');
 assert.equal(btn.setAttrs['data-standard-id'],'ISO-1234');
 assert.equal(btn.setAttrs.onclick,undefined);
 assert.equal(clean(new Element('button',{onclick:'evil'}),doc),null);
});
test('edit mode and selection lock are preserved',()=>{
 assert.match(src,/s19SetSelectionLock\(mode==='edit'\)/);
 assert.match(src,/if\(mode==='edit'\)\{/);
 assert.match(src,/editor=new root\.__radarTiptap\.Editor/);
});
