import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import vm from 'node:vm';
const repo=process.env.S19_REPO||path.resolve(import.meta.dirname,'..');
const html=fs.readFileSync(path.join(repo,'radar.html'),'utf8');
const panel=fs.readFileSync(path.join(repo,'js/radar-rationale-panel.js'),'utf8');

test('viewport has a single W2UI-synchronized observer, independent of dossier tab',()=>{
 assert.equal(html.split('// S19-R24: keep the Cytoscape hit surface synchronized').length-1,1);
 assert.match(html,/new ResizeObserver\(\(\) => request\('resize-observer'\)\)/);
 assert.match(html,/observer\.observe\(radar\)/);
 assert.match(html,/observer\.observe\(main\)/);
 assert.match(html,/window\.addEventListener\('resize', \(\) => request\('window-resize'\)\)/);
});
test('panel resynchronizes viewport on tab updates, without resetting the active tab',()=>{
 assert.match(panel,/root\.__radarInputSync\?\.request\?\.\('s19-tab-refresh'\)/);
 assert.match(panel,/byId\('s19-body-properties'\)\.hidden=tab!=='properties'/);
 assert.match(panel,/byId\('s19-body-rationale'\)\.hidden=tab!=='rationale'/);
});
test('Cytoscape still receives tap and select through one handler',()=>{
 assert.match(panel,/graph\.on\?\.\('tap','node',s19SelectedNode\)/);
 assert.match(panel,/graph\.on\?\.\('select','node',s19SelectedNode\)/);
 assert.doesNotMatch(panel,/autounselectify\(true\)/);
});
test('observer debounces requests and preserves graph coordinates',()=>{
 const token='      // S19-R24: keep the Cytoscape hit surface synchronized';
 const idx=html.indexOf(token);
 assert.ok(idx>=0);
 const start=html.indexOf('      (() => {',idx);
 const end=html.indexOf('      })();',start);
 assert.ok(start>=0&&end>start);
 const snippet=html.slice(start,end+'      })();'.length);
 const callbacks=[];const observers=[];let syncs=0;
 const nodes={
  'radar-container':{getBoundingClientRect:()=>({x:2,y:5,width:700,height:410})},
  'main-container':{getBoundingClientRect:()=>({x:2,y:5,width:700,height:480})},
  'cy-container':{getBoundingClientRect:()=>({x:2,y:5,width:700,height:410})},
  'svg-container':{getBoundingClientRect:()=>({x:2,y:5,width:700,height:410})}
 };
 const window={requestAnimationFrame:fn=>callbacks.push(fn),addEventListener:()=>{},__radarViewportSync:()=>{syncs++;}};
 class ResizeObserver{constructor(cb){this.cb=cb;} observe(node){observers.push(node);}}
 vm.runInNewContext(snippet,{window,document:{getElementById:id=>nodes[id]},ResizeObserver});
 assert.equal(observers.length,2);
 window.__radarInputSync.request('tab');window.__radarInputSync.request('tab');
 assert.equal(callbacks.length,1);
 callbacks.shift()();assert.equal(syncs,1);
 assert.equal(window.__radarInputSync.snapshot().cytoscape.height,410);
});
