import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
const base=path.resolve(import.meta.dirname,'..');
const load=p=>{const candidate=path.join(base,p);const actual=fs.existsSync(candidate)?candidate:path.join(base,p.replace(/^payload\//,''));return fs.readFileSync(actual,'utf8');};
const panel=load('payload/js/radar-rationale-panel.js');
const fmt=load('payload/js/radar-rationale-styles.js');
const renderer=load('payload/js/radar-rationale-renderer.js');
const css=fs.existsSync(path.join(base,'payload/editor-layout.css'))?load('payload/editor-layout.css'):load('css/radar-rationale.css');
test('table menu exposes numerical width, height and automatic height in nested W2UI menus',()=>{
 for(const id of ['setColumnWidth','setRowHeight','resetRowHeight'])assert.match(panel,new RegExp('id:\\x27'+id+'\\x27'));
 assert.match(panel,/setS19ColumnWidth\(size\)/);
 assert.match(panel,/setS19RowHeight\(size\)/);
 assert.match(panel,/45.*2000/);
 assert.match(panel,/24.*800/);
});
test('list menu offers multiple stored bullet and numbering styles',()=>{
 for(const s of ['disc','circle','square','decimal','lower-alpha','upper-alpha','lower-roman','upper-roman'])assert.ok(fmt.includes(s),s);
 assert.match(fmt,/types:\['bulletList','orderedList'\]/);
 assert.match(fmt,/s19Indent/);
 assert.match(panel,/Symboles des puces/);
 assert.match(panel,/Type de numérotation/);
});
test('document layout supports selected table paragraphs and selected column widths',()=>{
 assert.match(fmt,/setS19ColumnWidth:value/);
 assert.match(fmt,/colwidth:widths/);
 assert.match(fmt,/setS19RowHeight:value/);
 assert.match(fmt,/setS19Alignment:value/);
 assert.match(fmt,/tableRow/);
});
test('safe HTML renderer preserves dimensions and list styles',()=>{
 const sandbox={window:{},console};vm.runInNewContext(renderer,sandbox);
 const r=sandbox.window.__radarRationaleRenderer;
 const data={type:'doc',content:[
  {type:'bulletList',attrs:{s19ListStyle:'square',s19Indent:2},content:[{type:'listItem',content:[{type:'paragraph',content:[{type:'text',text:'One'}]}]}]},
  {type:'orderedList',attrs:{s19ListStyle:'upper-roman',s19Indent:1},content:[{type:'listItem',content:[{type:'paragraph',content:[{type:'text',text:'Two'}]}]}]},
  {type:'table',content:[{type:'tableRow',attrs:{s19MinHeight:62},content:[{type:'tableCell',attrs:{colwidth:[175]},content:[{type:'paragraph',attrs:{textAlign:'center'},content:[{type:'text',text:'cell'}]}]}]}]}
 ]};
 const html=r.renderNode(data);
 assert.match(html,/list-style-type:square/);assert.match(html,/data-s19-indent="2"/);
 assert.match(html,/list-style-type:upper-roman/);
 assert.match(html,/<tr style="height:62px;--s19-row-height:62px">/);assert.match(html,/<col style="width:100\.00%">/);
 assert.match(html,/text-align:center/);
});
test('untrusted values do not inject styles into the HTML renderer',()=>{
 const sandbox={window:{},console};vm.runInNewContext(renderer,sandbox);
 const r=sandbox.window.__radarRationaleRenderer;
 const data={type:'bulletList',attrs:{s19ListStyle:'x;position:absolute',s19Indent:999},content:[]};
 assert.equal(r.renderNode(data),'<ul></ul>');
 const row={type:'tableRow',attrs:{s19MinHeight:'62;evil'},content:[]};
 assert.equal(r.renderNode(row),'<tr></tr>');
});
test('styles are scoped to S19 editor without global W2UI overrides',()=>{
 assert.match(css,/#s19-content \.tiptap ol/);
 assert.ok(!/^\s*(html|body|\.w2ui-)/m.test(css));
});
