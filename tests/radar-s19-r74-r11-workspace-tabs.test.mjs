/* R13 compatibility: evaluate the installed CSS when no installer env is present. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const base=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const f=path.join(base,'css/radar-rationale.css');
const css=process.env.S19_R11_CSS?Buffer.from(process.env.S19_R11_CSS,'base64').toString('utf8'):fs.readFileSync(f,'utf8');
test('workspace navigation tabs dock at top and stay visible',()=>{
 assert.match(css,/#s19-tabs\{[^}]*position:absolute;top:0;/);
 assert.match(css,/#s19-tabs\{[^}]*border-bottom:1px/);
 assert.doesNotMatch(css,/#s19-tabs\{[^}]*bottom:0/);
});
test('properties and dossier scroll below top navigation',()=>{
 for(const id of ['properties','rationale'])assert.match(css,new RegExp('#s19-body-'+id+'\\{[^}]*height:calc\\(100% - 31px\\);margin-top:31px;overflow:auto'));
});
test('existing editor and reference styles remain available',()=>{
 for(const marker of ['.s19-editor','#s19-toolbar','#s19-content','s19-related'])assert.ok(css.includes(marker),marker);
});
test('layout remains constrained to S19 and retains fullscreen mode',()=>{
 assert.match(css,/#s19-shell\.s19-fullscreen/);
 assert.doesNotMatch(css,/body\s*\{\s*position:/);
});
