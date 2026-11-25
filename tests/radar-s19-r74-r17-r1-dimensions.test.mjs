import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const base=path.resolve(import.meta.dirname,'..');
const read=(file)=>{const p=path.join(base,'payload',file);return fs.readFileSync(fs.existsSync(p)?p:path.join(base,file),'utf8');};
const fmt=read('js/radar-rationale-styles.js');
const renderer=read('js/radar-rationale-renderer.js');
const css=fs.existsSync(path.join(base,'payload/editor-dimensions.css'))?read('editor-dimensions.css'):read('css/radar-rationale.css');
const sandbox={window:{},console};vm.runInNewContext(renderer,sandbox);
const render=sandbox.window.__radarRationaleRenderer.renderNode;
const cell=(w,text='a',span=1)=>({type:'tableCell',attrs:{colspan:span,colwidth:Array.isArray(w)?w:[w]},content:[{type:'paragraph',content:[{type:'text',text}]}]});
const row=(height,contents)=>({type:'tableRow',attrs:{s19MinHeight:height},content:contents});
const table=(contents)=>({type:'table',content:contents});
test('R18 responsive widths keep colwidth proportions',()=>{
 const out=render(table([row(62,[cell(175),cell(140)])]));
 assert.match(out,/<table class="s19-responsive-table"><colgroup>/);
 assert.match(out,/width:55\.56%/);
 assert.match(out,/width:44\.44%/);
 assert.doesNotMatch(out,/width:315px/);
});
test('merged cells retain logical column proportions',()=>{
 const out=render(table([row(64,[cell([100,175],'merged',2),cell(75)])]));
 assert.match(out,/width:28\.57%/);
 assert.match(out,/width:50\.00%/);
 assert.match(out,/width:21\.43%/);
 assert.match(out,/colspan="2"/);
});
test('row minimum height reaches cells and remains automatic when removed',()=>{
 const h=render(table([row(125,[cell(175)])]));
 assert.match(h,/--s19-row-height:125px/);
 assert.match(renderer,/height:var\(--s19-row-height\)/);
 const a=render(table([row(null,[cell(175)])]));
 assert.doesNotMatch(a,/--s19-row-height/);
 assert.match(css,/height:var\(--s19-row-height\)/);
});
test('column command completes widths of unmeasured columns',()=>{
 assert.match(fmt,/if\(!widths\[i\]\)widths\[i\]=140/);
 assert.match(fmt,/maxColumns=Math.max\(maxColumns,logical\)/);
 assert.match(fmt,/widths\[column\]=value/);
 assert.match(fmt,/colwidth:widths\.slice\(logical,logical\+span\)/);
 assert.match(fmt,/if\(dispatch\)\{for\(const c of changes\)/);
});
test('out-of-range widths and heights cannot inject HTML or force huge tables',()=>{
 const out=render(table([row('999;evil',[cell([60,'0;evil'],'bad',2)])]));
 assert.doesNotMatch(out,/evil/);
 assert.doesNotMatch(out,/width:\d+px;table-layout:fixed/);
 assert.doesNotMatch(out,/--s19-row-height/);
});
test('CSS stays scoped to the dossier editor',()=>{
 assert.match(css,/#s19-content \.tiptap table/);
 assert.doesNotMatch(css,/^\s*(?:html|body|\.w2ui-)/m);
});
