import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const repo=path.resolve(process.env.S19_R9_REPO||path.join(path.dirname(fileURLToPath(import.meta.url)),'..'));
const panel=process.env.S19_R9_PANEL?Buffer.from(process.env.S19_R9_PANEL,'base64').toString():fs.readFileSync(path.join(repo,'js/radar-rationale-panel.js'),'utf8');
const css=process.env.S19_R9_CSS?Buffer.from(process.env.S19_R9_CSS,'base64').toString():fs.readFileSync(path.join(repo,'css/radar-rationale.css'),'utf8');
test('primary code icon invokes codeBlock command, not inline code',()=>{
 assert.match(panel,/const PRIMARY=\[[^\n]*'blockquote','codeBlock','table'/);
 assert.match(panel,/blockquote:'❞',codeBlock:'〈〉',table:/);
 assert.match(panel,/\['codeBlock','Code','toggleCodeBlock'\]/);
 assert.match(panel,/\['inlineCode','\{ \}','toggleCode'\]/);
});
test('task list CSS matches actual Tiptap task item markup',()=>{
 const rules=css.slice(css.indexOf('/* S19-R74-R9:'));
 assert.match(rules,/ul\[data-type="taskList"\] > li\[data-checked\]/);
 assert.match(rules,/li\[data-checked\] > label/);
 assert.match(rules,/li\[data-checked\] > label input\[type="checkbox"\]/);
 assert.match(rules,/li\[data-checked\] > div/);
 assert.match(rules,/li\[data-checked\] > div > p/);
 assert.doesNotMatch(rules,/li\[data-type="taskItem"\]/);
});
test('task alignment is flex scoped to editor without W2UI global changes',()=>{
 assert.match(css,/#s19-content \.s19-editor \.tiptap ul\[data-type="taskList"\] > li\[data-checked\] \{\s*display: flex !important/);
 assert.match(css,/#s19-content \.s19-editor \.tiptap li\[data-checked\] > div \{\s*flex: 1 1 auto/);
 assert.doesNotMatch(css.slice(css.indexOf('/* S19-R74-R9:')),/^\s*\.w2ui/m);
});
test('quote and code block presentation still present',()=>{
 assert.match(css,/\.tiptap blockquote \{/);
 assert.match(css,/\.tiptap pre \{/);
 assert.match(css,/\.tiptap pre code \{/);
});
