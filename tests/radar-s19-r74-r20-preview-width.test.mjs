
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(
 new URL('../js/radar-rationale-panel.js',import.meta.url),
 'utf8'
);

const begin=source.indexOf('const S19_PREVIEW_TAGS=');
const end=source.indexOf('function s19ScopedRendererCss(',begin);
assert.ok(begin>=0&&end>begin);

function element(tag,attrs={},css={},children=[]){
 const classes=(attrs.class||'').split(/\s+/).filter(Boolean);
 classes.contains=value=>classes.includes(value);

 return {
  nodeType:1,
  tagName:tag.toUpperCase(),
  attrs:{...attrs},
  children:[],
  childNodes:children,
  classList:classes,
  style:{
   length:Object.keys(css).length,
   item:i=>Object.keys(css)[i],
   getPropertyValue:k=>css[k],
   values:{},
   setProperty(k,v){this.values[k]=v;}
  },
  getAttribute(k){return this.attrs[k]??null;},
  setAttribute(k,v){this.attrs[k]=String(v);},
  appendChild(n){this.children.push(n);}
 };
}

const document={
 createElement:tag=>element(tag),
 createTextNode:value=>({nodeType:3,nodeValue:value})
};

const context=vm.createContext({});
vm.runInContext(source.slice(begin,end),context);

function sanitize(node){
 context.input=node;
 context.doc=document;
 return vm.runInContext(
  's19SafePreviewNode(input,doc)',context
 );
}

test('preview rejects executable and embedded elements',()=>{
 for(const tag of [
  'script','iframe','object','embed','img','svg','form'
 ]){
  assert.equal(sanitize(element(tag)),null,tag);
 }
});

test('preview preserves text but rejects executable attributes and CSS',()=>{
 const safe=sanitize(element('p',
  {id:'collision',onclick:'alert(1)'},
  {
   color:'#112233',
   position:'fixed',
   background:'url(https://example.org/x)'
  },
  [{nodeType:3,nodeValue:'<script>literal</script>'}]
 ));

 assert.deepEqual(safe.attrs,{});
 assert.deepEqual(safe.style.values,{color:'#112233'});
 assert.equal(
  safe.children[0].nodeValue,
  '<script>literal</script>'
 );
});

test('preview reconstructs permitted children only',()=>{
 const safe=sanitize(element('div',{}, {},[
  element('p',{}, {},[{nodeType:3,nodeValue:'Readable'}]),
  element('script'),
  element('iframe')
 ]));

 assert.equal(safe.children.length,1);
 assert.equal(safe.children[0].tagName,'P');
 assert.equal(safe.children[0].children[0].nodeValue,'Readable');
});

test('only safe HTTP links retain navigation attributes',()=>{
 for(const href of [
  'javascript:alert(1)',
  'data:text/html,bad',
  'https://example.org/<script>'
 ]){
  assert.equal(sanitize(element('a',{href})).attrs.href,undefined);
 }

 const link=sanitize(element('a',{
  href:'https://example.org'
 }));

 assert.equal(link.attrs.href,'https://example.org');
 assert.equal(link.attrs.target,'_blank');
 assert.equal(link.attrs.rel,'noopener noreferrer');
});

test('only permitted reference buttons survive reconstruction',()=>{
 assert.equal(sanitize(element('button')),null);

 const button=sanitize(element('button',{
  class:'s19-reference',
  'data-blip-id':'synthetic-blip',
  'data-standard-id':'synthetic-standard',
  onclick:'alert(1)'
 }));

 assert.equal(button.className,'s19-reference');
 assert.equal(button.attrs['data-blip-id'],'synthetic-blip');
 assert.equal(button.attrs['data-standard-id'],'synthetic-standard');
 assert.equal(button.attrs.onclick,undefined);
});

test('workspace uses reconstructed DOM and scoped renderer CSS',()=>{
 assert.match(source,/s19SafePreviewNode\(main,document\)/);
 assert.match(source,/style.textContent=s19ScopedRendererCss\(parsed\)/);
 assert.match(source,/max-width:none;width:100%/);
 assert.match(source,/s19RestorePixelTableWidths\(safe\)/);
 assert.match(source,/new root\.__radarTiptap\.Editor/);
});

test('literal script markup is refused before HTML parsing',()=>{
 const a=source.indexOf('function s19WorkspacePreview(');
 const b=source.indexOf('function s19PreviewStyle()',a);
 assert.ok(a>=0&&b>a);

 let parsed=false;

 const sandbox={
  root:{},
  DOMParser:class {
   constructor(){
    parsed=true;
    throw Error('unexpected parser');
   }
  }
 };

 vm.runInNewContext(source.slice(a,b),sandbox);

 assert.throws(()=>sandbox.s19WorkspacePreview(
  {},{
   renderDocument:()=>'<head></head><script>alert(1)</script>'
  }
 ),/Unexpected dossier preview HTML/);

 assert.equal(parsed,false);
});
