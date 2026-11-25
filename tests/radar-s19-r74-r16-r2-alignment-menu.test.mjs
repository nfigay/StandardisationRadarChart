import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const projectRoot=path.resolve(here,'..');
const candidate=path.join(projectRoot,'payload/js/radar-rationale-panel.js');
const panel=fs.readFileSync(fs.existsSync(candidate)?candidate:path.join(projectRoot,'js/radar-rationale-panel.js'),'utf8');
const ids={alignLeft:['Gauche','Left','left'],alignCenter:['Centré','Center','center'],alignRight:['Droite','Right','right'],alignJustify:['Justifié','Justified','justify']};
test('W2UI submenu entries have nonempty bilingual labels and native icon property',()=>{
 for(const [id,[fr,en,icon]] of Object.entries(ids)){
  assert.ok(panel.includes(`id:'${id}',text:tr('${fr}','${en}')`),id+' must have nonempty text');
  assert.match(panel,new RegExp(`id:'${id}'[^\\n]*icon:'s19-w2ui-align-${icon}'`));
 }
});
test('all four alignment entries survive W2UI-like text filtering',()=>{
 const group=panel.match(/\{id:'alignment',text:tr\('Alignement','Alignment'\),items:\[([\s\S]*?)\]\}/);
 assert.ok(group);
 const entries=[...group[1].matchAll(/\{id:'(align\w+)',text:tr\('([^']+)','([^']+)'\),tooltip:[^\n]*icon:'([^']+)'\}/g)];
 assert.equal(entries.length,4);
 assert.equal(entries.filter(([,id,fr,en,icon])=>fr.trim().length&&en.trim().length&&icon.length).length,4);
});
test('nested menu and click dispatcher still support all alignment actions',()=>{
 assert.match(panel,/id:'paragraphLayout'/);
 assert.match(panel,/id:'alignment'/);
 assert.match(panel,/setS19Alignment\(map\[action\]\)/);
 assert.match(panel,/event\.subItem\?\.id/);
});
test('indent commands retain icons and localized names',()=>{
 for(const [id,icon] of Object.entries({indentIncrease:'increase',indentDecrease:'decrease',indentReset:'reset'}))
  assert.match(panel,new RegExp(`id:'${id}'[^\\n]*icon:'s19-w2ui-indent-${icon}'`));
});
test('correction leaves all four W2UI icon assets installed',()=>{
 assert.match(panel,/function s19InstallParagraphMenuIcons\(\)/);
 assert.match(panel,/background-size:20px 20px/);
 for(const id of ['left','center','right','justify'])assert.ok(panel.includes('s19-w2ui-align-'+id));
});
