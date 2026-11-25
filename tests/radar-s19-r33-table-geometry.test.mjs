import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';

const repo=process.env.S19_REPO||process.cwd();
const src=fs.readFileSync(path.join(repo,'js/radar-rationale-panel.js'),'utf8');
const between=(start,end)=>{const a=src.indexOf(start),b=src.indexOf(end,a);assert.ok(a!==-1&&b>a,`Missing ${start}`);return src.slice(a,b);};
const renderer=between('const S19_PREVIEW_TAGS=','function s19WorkspacePreview(');

test('scoped shared renderer CSS cannot force percentage widths or layout on tables',()=>{
 assert.match(renderer,/const onTable=/);
 assert.match(renderer,/\['width','min-width','max-width','table-layout'\]/);
 assert.match(renderer,/const allowed=onTable\?declarations\.filter/);
});
test('pixel-defined colgroups restore their exact intrinsic total in the preview',()=>{
 const restore=between('function s19RestorePixelTableWidths(host){','function s19WorkspacePreview(');
 assert.match(restore,/querySelectorAll\('table'\)/);
 assert.match(restore,/const total=values\.reduce/);
 assert.match(restore,/table\.style\.setProperty\('width',px\)/);
 assert.match(restore,/table\.style\.setProperty\('min-width',px\)/);
 assert.match(src,/s19RestorePixelTableWidths\(safe\)/);
});
test('no arbitrary table width or responsive scaling for tables without specified column widths',()=>{
 const restore=between('function s19RestorePixelTableWidths(host){','function s19WorkspacePreview(');
 assert.match(restore,/if\(!colgroup\)continue/);
 assert.match(restore,/if\(values\.some\(value=>!Number\.isFinite\(value\)\|\|value<=0\)\)continue/);
 assert.doesNotMatch(restore,/100%|clientWidth|offsetWidth|scrollWidth/);
});
test('Chromium: preview and editor have identical pixel-sized tables, including overflow',()=>{
 const chromium=['/usr/bin/chromium','/usr/bin/chromium-browser'].find(p=>fs.existsSync(p));
 if(!chromium||process.env.S19_RUN_CHROMIUM!=='1')return; // Opt-in: Chromium may be sandboxed/unavailable.
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'s19-r33-chromium-'));
 try{
  const script=`(()=>{const root=window;${renderer}\n
   const page='<main><section><table class="s19-table"><colgroup><col style="width:480px"><col style="width:480px"><col style="width:480px"></colgroup><tbody><tr><th style="background:#f0f3f7">A</th><th>B</th><th>C</th></tr><tr><td><span style="color:#ffd700;background:#177acc">C</span></td><td></td><td></td></tr></tbody></table></section></main>';
   const parsed=new DOMParser().parseFromString('<html><head><style>table{width:100%;table-layout:fixed;border-collapse:collapse}th{background:#f0f3f7}</style></head><body>'+page+'</body></html>','text/html');
   const style=document.createElement('style');style.textContent=s19ScopedRendererCss(parsed);document.head.append(style);
   const preview=s19SafePreviewNode(parsed.querySelector('main'),document);preview.classList.add('s19-preview-document');s19RestorePixelTableWidths(preview);document.getElementById('preview').append(preview);
   const editor=document.getElementById('editor');editor.innerHTML=page;
   const old=editor.querySelector('table');old.style.width='1440px';old.style.minWidth='1440px';old.style.tableLayout='fixed';
   const newTable=preview.querySelector('table');
   const measure=x=>({width:x.getBoundingClientRect().width,cols:[...x.querySelectorAll('col')].map(el=>el.getBoundingClientRect().width),layout:getComputedStyle(x).tableLayout});
   const result={editor:measure(old),preview:measure(newTable),previewContainer:document.getElementById('preview').clientWidth,validCSS:!style.textContent.includes('width:100%'),safe:!preview.querySelector('script,iframe')};
   document.getElementById('result').textContent=JSON.stringify(result);
  })();`;
  const html=`<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0}#editor,#preview{width:600px;overflow-x:auto;border:1px solid black}.s19-preview-document{width:100%;}table{border-collapse:collapse}td,th{border:1px solid #aaa;padding:4px;}</style></head><body><div id="editor"></div><div id="preview"></div><pre id="result"></pre><script>${script.replaceAll('</script','<\\/script')}</script></body></html>`;
  const file=path.join(dir,'fixture.html');fs.writeFileSync(file,html);
  const output=execFileSync(chromium,['--headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--disable-extensions','--no-first-run','--dump-dom','file://'+file],{encoding:'utf8',timeout:18000,stdio:['ignore','pipe','ignore']});
  const match=output.match(/<pre id="result">([^<]+)<\/pre>/);assert.ok(match,'Chromium fixture produced a result');
  const result=JSON.parse(match[1].replaceAll('&quot;','"'));
  assert.equal(result.editor.width,1440);
  assert.equal(result.preview.width,1440);
  assert.deepEqual(result.preview.cols,[480,480,480]);
  assert.equal(result.previewContainer,600);
  assert.equal(result.validCSS,true);assert.equal(result.safe,true);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
