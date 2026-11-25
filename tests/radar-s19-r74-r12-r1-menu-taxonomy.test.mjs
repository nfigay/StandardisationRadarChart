/* R13 compatibility: extends R12-R1 menu taxonomy with the Colors menu. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const base=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const repo=path.join(base,'js/radar-rationale-panel.js');
const text=fs.readFileSync(fs.existsSync(repo)?repo:path.join(base,'payload/js/radar-rationale-panel.js'),'utf8');
const commands=['paragraph','heading1','heading','heading3','heading4','blockquote','inlineCode','codeBlock','bold','italic','underline','strike','highlight','clearFormat','bulletList','orderedList','taskList','table','addRow','deleteRow','addColumn','deleteColumn','deleteTable','link','unlink','horizontalRule','hardBreak','undo','redo'];
function menu(lang){const a=text.indexOf('const S19_NATIVE_COLOR_ITEMS=');const b=text.indexOf('function s19RunEditorAction(',a);assert.ok(a>0&&b>a);const sandbox={root:{i18next:{language:lang}},COMMANDS:commands.map(x=>[x]),LABELS:{fr:commands,en:commands},S19_COLOR_PICKERS:{textColor:{initial:'263648'},highlightColor:{initial:'fff2a8'},paragraphColor:{initial:'f1f5f9'}}};return vm.runInNewContext(text.slice(a,b)+'\ns19EditorItems()',sandbox);}
const flatten=items=>items.flatMap(x=>x.items?flatten(x.items):[x.id]);
test('Text contains bold/italic but no code, native W2UI color selection is grouped separately',()=>{
 const items=menu('fr');assert.deepEqual(Array.from(items.find(x=>x.id==='text').items,x=>x.id),['bold','italic','underline','strike','clearFormat']);
 assert.ok(items.find(x=>x.id==='textColor'));assert.ok(items.find(x=>x.id==='resetColors'));
 assert.ok(!items.some(x=>x.id==='bold'||x.id==='italic'));
});
test('Styles contains one Code submenu with inline and block variants',()=>{
 const styles=menu('fr').find(x=>x.id==='styles');
 assert.deepEqual(Array.from(styles.items.find(x=>x.id==='codeStyles').items,x=>x.id),['inlineCode','codeBlock']);
 for(const id of ['inlineCode','codeBlock'])assert.equal(flatten(menu('fr')).filter(x=>x===id).length,1);
});
test('FR and EN W2UI menus have the same hierarchy',()=>{
 for(const lng of ['fr','en']){
  const items=menu(lng);assert.deepEqual(Array.from(items,x=>x.id),['styles','text','colorsStart','textColor','highlightColor','paragraphColor','resetColors','colorsEnd','paragraphLayout','lists','tableMenu','insert','undo','redo']);
  assert.equal(items.find(x=>x.id==='text').text,lng==='fr'?'Texte':'Text');
  assert.equal(items.find(x=>x.id==='resetColors').items.length,3);
  assert.equal(items.find(x=>x.id==='tableMenu').items.find(x=>x.id==='rows').items.length,4);
 }
});
test('Tiptap command mapping and CSS scope preserved',()=>{
 assert.match(text,/toggleCodeBlock/);assert.match(text,/toggleCode/);
 assert.match(text,/editor\.chain\(\)\.focus\(\)/);
 assert.match(text,/function renderRelated\(\)/);
});
