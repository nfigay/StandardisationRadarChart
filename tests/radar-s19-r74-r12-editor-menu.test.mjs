/* R13 compatibility: no environment variable required for normal npm test. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const base=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const p=path.join(base,'js/radar-rationale-panel.js');
const text=process.env.S19_R12_PANEL?Buffer.from(process.env.S19_R12_PANEL,'base64').toString():fs.readFileSync(fs.existsSync(p)?p:path.join(base,'payload/js/radar-rationale-panel.js'),'utf8');
test('W2UI ribbon groups styles, text, colors and insertion',()=>{
 assert.match(text,/new root\.w2toolbar\(/);
 for(const id of ['styles','text','resetColors','lists','tableMenu','insert'])assert.ok(text.includes("id:'"+id+"'"),id); for(const id of ['textColor','highlightColor','paragraphColor'])assert.ok(text.includes(id+':{kind:'),id);
 assert.ok(text.includes("'heading4'"));assert.ok(text.includes('codeStyles'));
});
test('Nested table and native W2UI color pickers',()=>{
 for(const x of ["id:'rows'","id:'columns'","textColor:{kind:","highlightColor:{kind:","paragraphColor:{kind:"])assert.ok(text.includes(x),x);
 assert.ok(text.includes("'hardBreak'") ); assert.ok(text.includes("type:'text-color'") || text.includes("'text-color'"));
});
test('Commands retain Tiptap selection and editor ownership',()=>{
 assert.match(text,/function s19RunEditorAction\(action\)/);
 assert.match(text,/editor\.chain\(\)\.focus\(\)/);
 assert.match(text,/s19RunEditorAction\(candidate\)/);
 assert.match(text,/root\.__radarS19Formatting\.extensions/);
});
test('CRUD, related references and lifecycle retained',()=>{
 for(const x of ['function blank(node)','function write(record,replace)','function navigateRelated(link)','function renderRelated()','root.__radarRationalePanel','new root.w2tabs'])assert.ok(text.includes(x),x);
});
