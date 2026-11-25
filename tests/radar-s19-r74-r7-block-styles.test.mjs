import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const repo=process.env.S19_R7_REPO || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if(!repo)throw Error('Supply repository path');
const css=fs.readFileSync(path.join(repo,'css/radar-rationale.css'),'utf8');
const renderer=fs.readFileSync(path.join(repo,'js/radar-rationale-renderer.js'),'utf8');
function load(){const context={module:{exports:{}}};vm.runInNewContext(renderer,context);return context.module.exports;}
test('task item checkbox is laid out beside editable text, scoped to dossier',()=>{
 assert.match(css,/#s19-content \.s19-editor \.tiptap ul\[data-type="taskList"\] > li\[data-checked\]/);
 assert.match(css,/display: flex !important/);
 assert.match(css,/li\[data-checked\] > div > p/);
 assert.match(css,/input\[type="checkbox"\]/);
});
test('quotes and code blocks have readable explicit styling in editor',()=>{
 assert.match(css,/\.tiptap blockquote\s*\{/);
 assert.match(css,/border-left: 4px solid/);
 assert.match(css,/\.tiptap pre\s*\{/);
 assert.match(css,/white-space: pre;/);
 assert.match(css,/font: 13px\/1\.55 ui-monospace/);
});
test('static preview renders tasks, quote and code, with styles but no scripts',()=>{
 const api=load();
 const rich={type:'doc',content:[
   {type:'taskList',content:[{type:'taskItem',attrs:{checked:false},content:[{type:'paragraph',content:[{type:'text',text:'Write task'}]}]}]},
   {type:'blockquote',content:[{type:'paragraph',content:[{type:'text',text:'A quote'}]}]},
   {type:'codeBlock',content:[{type:'text',text:'x < 5'}]}
 ]};
 const doc={standard:{designation:'Test'},sections:{businessJustification:rich}};
 const html=api.renderDocument(doc,{lang:'fr'});
 assert.match(html,/class="s19-task"/);
 assert.match(html,/>Write task<\/p>/);
 assert.match(html,/<blockquote>/);
 assert.match(html,/<pre><code>x &lt; 5<\/code><\/pre>/);
 assert.match(html,/pre\{margin:14px 0;padding:13px/);
 assert.match(html,/li\.s19-task > p\{/);
 assert.doesNotMatch(html,/<script\b/i);
 assert.match(html,/default-src &#39;none&#39;|default-src 'none'/);
});
test('patch does not introduce global W2UI rules',()=>{
 const portion=css.slice(css.indexOf('/* S19-R74-R7:'));
 assert.ok(portion.startsWith('/* S19-R74-R7:'));
 assert.doesNotMatch(portion,/^\s*(?:\.w2ui-|body\b|html\b)/m);
});
