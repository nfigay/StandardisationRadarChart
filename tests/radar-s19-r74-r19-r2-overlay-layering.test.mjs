import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const repo=process.env.S19_REPO||path.resolve(here,'../');
const css=fs.readFileSync(new URL('../css/radar-rationale-fullscreen.css',import.meta.url),'utf8');
const baseRule=css.match(/#s19-document-fullscreen-root\s*\{([^}]+)\}/)?.[1];
test('fullscreen document layer is below W2UI popups and menus',()=>{
 assert.ok(baseRule,'fullscreen root CSS missing');
 const z=Number(baseRule.match(/z-index\s*:\s*(\d+)/)?.[1]);
 assert.equal(z,1500);
 assert.ok(z<1600 && z<1700);
});
test('W2UI document layout and independent scrolling are preserved',()=>{
 assert.match(css,/#s19-document-fullscreen-root #s19-shell\s*\{/);
 assert.match(css,/#s19-document-fullscreen-root #s19-editor-tools\s*\{/);
 assert.match(css,/#s19-document-fullscreen-root \.s19-table-wrap/);
 assert.doesNotMatch(css,/#s19-document-fullscreen-root\s*\{[^}]*2147483000/);
});
test('overlay layer levels match the bundled W2UI CSS when available',()=>{
 const w2=path.join(repo,'css/w2ui.min.css');
 assert.ok(fs.existsSync(w2),'Bundled W2UI CSS missing');
 const vendor=fs.readFileSync(w2,'utf8');
 const popup=Number(vendor.match(/\.w2ui-popup\{[^}]*z-index\s*:\s*(\d+)/)?.[1]);
 const overlay=Number(vendor.match(/\.w2ui-overlay\{[^}]*z-index\s*:\s*(\d+)/)?.[1]);
 assert.ok(popup>1500,`popup z-index ${popup}`);
 assert.ok(overlay>1500,`overlay z-index ${overlay}`);
});
