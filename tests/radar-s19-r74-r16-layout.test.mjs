import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const content=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const panel=content('js/radar-rationale-panel.js');
const format=content('js/radar-rationale-styles.js');
const renderer=content('js/radar-rationale-renderer.js');
test('W2UI paragraph menu groups alignment and indent operations',()=>{
 assert.match(panel,/id:'paragraphLayout'/);
 for(const cmd of ['alignLeft','alignCenter','alignRight','alignJustify','indentIncrease','indentDecrease','indentReset'])assert.match(panel,new RegExp(`id:'${cmd}'`));
 assert.match(panel,/setS19Alignment\(map\[action\]\)/);
 assert.match(panel,/adjustS19Indent\(/);
 assert.match(panel,/s19ColorSelection/);
});
test('paragraph styles extend existing runtime, keep persisted attrs bounded',()=>{
 assert.match(format,/name:'s19ParagraphLayout'/);
 assert.match(format,/types:\['paragraph','heading'\]/);
 assert.match(format,/s19Indent=value=>/);
 assert.match(format,/value<=6/);
 assert.match(format,/S19ParagraphLayout\]/);
 assert.match(format,/setS19Alignment/);
 assert.match(format,/adjustS19Indent/);
});
test('safe HTML preview renders alignment and indentation on paragraphs and headings',()=>{
 const context={module:{exports:{}},console};vm.runInNewContext(renderer,context);
 const draw=context.module.exports.renderNode;
 const p=draw({type:'paragraph',attrs:{textAlign:'center',s19Indent:2,backgroundColor:'#e4e5f6'},content:[{type:'text',text:'Bonjour'}]});
 assert.match(p,/text-align:center/);assert.match(p,/margin-left:48px/);assert.match(p,/background-color:#e4e5f6/);
 const h=draw({type:'heading',attrs:{level:2,textAlign:'right',s19Indent:1},content:[{type:'text',text:'Titre'}]});
 assert.match(h,/<h2 style="text-align:right;margin-left:24px">Titre<\/h2>/);
});
test('malformed layout attrs do not produce arbitrary HTML or unsafe CSS',()=>{
 const context={module:{exports:{}},console};vm.runInNewContext(renderer,context);
 const draw=context.module.exports.renderNode;
 const out=draw({type:'paragraph',attrs:{textAlign:'left;position:fixed',s19Indent:1000,backgroundColor:'url(javascript:bad)'},content:[{type:'text',text:'<&>'}]});
 assert.equal(out,'<p>&lt;&amp;&gt;</p>');
});
test('existing color rendering and sandbox CSP remain intact',()=>{
 assert.match(renderer,/default-src \\'none\\'/);
 assert.match(renderer,/safeColor\(mark.attrs\?\.color\)/);
 assert.match(format,/MultiHighlight/);
 assert.match(panel,/S19_NATIVE_COLOR_ITEMS/);
});
