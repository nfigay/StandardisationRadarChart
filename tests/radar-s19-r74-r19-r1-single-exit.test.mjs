import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const repo = new URL('../js/radar-rationale-panel.js', import.meta.url);
const fallback = new URL('../payload/js/radar-rationale-panel.js', import.meta.url);
const code=fs.readFileSync(fs.existsSync(repo)?repo:fallback,'utf8');
test('one visible exit button in fullscreen and compact entry returns on close',()=>{
 const f=code.match(/function s19FullscreenButton\(\)\{[^}]+\}/)?.[0];
 assert.ok(f,'button state function');
 assert.match(f,/btn\.hidden=expanded/);
 assert.ok(f.includes("btn.style.display=expanded?'none':'';"));
 assert.match(f,/btn\.textContent='⛶'/);
 assert.match(code,/id="s19-fullscreen-exit"/);
 assert.match(code,/exit\.onclick=s19CloseFullscreen/);
 assert.match(code,/expanded=false;s19FullscreenButton\(\)/);
 assert.match(code,/expanded=true;[\s\S]*?s19FullscreenButton\(\)/);
 assert.doesNotMatch(code,/btn\.textContent=expanded\?'↙'/);
});
test('only one root-owned fullscreen layout and original live shell is restored',()=>{
 assert.match(code,/name:'s19DocumentFullscreenLayout'/);
 assert.match(code,/target\.appendChild\(shell\)/);
 assert.match(code,/s19OriginalParent\.insertBefore\(shell/);
});
