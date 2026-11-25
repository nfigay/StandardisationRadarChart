import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const panel=fs.readFileSync(path.join(root,'js/radar-rationale-panel.js'),'utf8');
test('four alignment commands use W2UI menu icon classes, not text-only labels',()=>{
 for(const [id,icon] of Object.entries({alignLeft:'left',alignCenter:'center',alignRight:'right',alignJustify:'justify'})){
  assert.match(panel,new RegExp(`id:'${id}',text:tr\\([^)]*\\),tooltip:tr\\([^)]*\\),icon:'s19-w2ui-align-${icon}'`));
 }
 assert.match(panel,/id:'paragraphLayout'/);
 assert.match(panel,/id:'alignment'/);
});
test('indent actions use W2UI menu icons and preserve bilingual labels',()=>{
 for(const [id,icon] of Object.entries({indentIncrease:'increase',indentDecrease:'decrease',indentReset:'reset'})){
  assert.match(panel,new RegExp(`id:'${id}'[^\\n]*icon:'s19-w2ui-indent-${icon}'`));
 }
});
test('SVG icons have fixed static paths and are installed once',()=>{
 assert.match(panel,/function s19InstallParagraphMenuIcons\(\)/);
 assert.match(panel,/if\(document\.getElementById\(id\)\)return/);
 assert.match(panel,/encodeURIComponent\(svg\)/);
 assert.match(panel,/document\.head\.appendChild\(style\)/);
 assert.match(panel,/s19InstallParagraphMenuIcons\(\)/);
 assert.match(panel,/s19-w2ui-align-left/);
 assert.match(panel,/background-size:20px 20px/);
});
test('W2UI click dispatch and Tiptap formatting are unchanged',()=>{
 assert.match(panel,/setS19Alignment\(map\[action\]\)/);
 assert.match(panel,/adjustS19Indent\(/);
 assert.match(panel,/event\.subItem\?\.id/);
 assert.match(panel,/if\(recognized\)s19RunEditorAction\(candidate\)/);
});
test('fallback labels remain available when native W2UI is absent',()=>{
 assert.match(panel,/makeButton\(x\.id,x\.text\|\|x\.tooltip\|\|x\.id\)/);
});
