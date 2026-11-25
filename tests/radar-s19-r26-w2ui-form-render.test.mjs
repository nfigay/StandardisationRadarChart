// R27 revises the R26 invariant: the form must not render while the dossier is visible.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const repo=process.env.S19_REPO||path.resolve(import.meta.dirname,'..');
const source=fs.readFileSync(path.join(repo,'js/radar-rationale-panel.js'),'utf8');
test('properties tab restored through active state without synthetic click',()=>{
 const a=source.indexOf('function s19RestorePropertiesTab(');
 const b=source.indexOf('function s19SelectedNode(');
 const code=source.slice(a,b);
 assert.doesNotMatch(code.replace(/\/\/[^\n]*/g,''),/\.click\s*\(/);
 assert.match(code,/form\.tabs\.active=preferred/);
});
test('no hidden form rendering, no autofocus, no forced tab before render',()=>{
 const a=source.indexOf('function s19RenderPropertiesForm(');
 const b=source.indexOf('function s19SelectedNode(');
 const code=source.slice(a,b);
 assert.match(code,/if\(tab!=='properties'/);
 assert.match(code,/hidden\)return false/);
 assert.match(code,/form\.focus=-1/);
 assert.ok(code.indexOf("form.render('#form')")<code.indexOf('s19RestorePropertiesTab(form,s19PreferredPropertiesTab)'));
});
test('preserves explicit editing lock and active outer tab',()=>{
 const a=source.indexOf('function showNode(');
 const code=source.slice(a);
 assert.match(code,/if\(mode==='edit'\)/);
 assert.match(code,/return false/);
 assert.match(code,/mode='view'/);
 assert.match(code,/refresh\(\)/);
 assert.match(code,/currentNode=node/);
});
