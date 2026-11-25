import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const source=fs.readFileSync(path.join(process.env.S19_REPO||process.cwd(),'js/radar-rationale-panel.js'),'utf8');
const between=(a,b)=>source.slice(source.indexOf(a),source.indexOf(b,source.indexOf(a)));
const styles=between('function s19PreviewStyle(){','function renderSection(){');
test('preview full-width main overrides renderer 880px max-width / auto margins',()=>{
 assert.match(styles, /#s19-shell \.s19-preview-document main\{[^}]*max-width:none;width:100%;margin:0/);
 assert.doesNotMatch(styles,/max-width:880px/);
});
test('fullscreen W2UI host and dossier body use narrow gutters rather than centered page',()=>{
 assert.match(styles, /#s19-document-fullscreen-root #s19-shell #s19-body-rationale\{[^}]*max-width:none;width:100%;margin:0;padding:12px 16px 32px/);
 assert.match(between('function s19OpenFullscreen(){','function s19ToggleFullscreen(){'),/s19PreviewStyle\(\)/);
});
test('pixel table sizing and horizontal scroll stay intact; no forced table width',()=>{
 assert.match(styles,/\.s19-table-wrap\{max-width:100%;overflow-x:auto\}/);
 assert.doesNotMatch(styles,/\.s19-preview-document table\{[^}]*width:100%/);
 assert.match(source,/s19SafeDeclarations\(source\.style\)/);
});
test('HTML remains safely sanitized without iframe or srcdoc',()=>{
 assert.match(source,/s19SafePreviewNode\(main,document\)/);
 assert.doesNotMatch(between('function s19WorkspacePreview(','function s19PreviewStyle()'),/createElement\(['"]iframe['"]\)|\.srcdoc/);
});
