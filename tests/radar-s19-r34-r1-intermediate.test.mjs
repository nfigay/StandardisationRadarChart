import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const dir=dirname(fileURLToPath(import.meta.url));
const packageRoot=dirname(dir);
const source=(path)=>readFileSync(join(packageRoot,path),'utf8');
test('local generation takes current local Vite build and embeds verified Viewer resources',()=>{
 const s=source('scripts/build-intermediate-viewer.mjs');
 assert.ok(s.includes("command('npm',['run','build'])"));assert.ok(!s.includes("'--mode','local'"));assert.match(s,/extractStandaloneViewerResources/);assert.match(s,/embedViewerResources/);
 assert.match(s,/local-intermediate-uncommitted/);
 assert.doesNotMatch(s,/spawnSync\(['"]git['"]|publish:dist/);
});
test('common standalone builder accepts explicit development source without forging committed provenance',()=>{
 const s=source('scripts/build-common-standalone.mjs');
 assert.match(s,/RADAR_INTERMEDIATE_SOURCE_DIR/);
 assert.match(s,/intermediateSource\?'local-intermediate-uncommitted'/);
 assert.match(s,/if\(!intermediateSource&&/);
});
test('UI retains separate preview and standalone download actions, same prepared projection',()=>{
 const s=source('js/radar-publication-ui.js');
 assert.match(s,/button\(actions,'preview'/);assert.match(s,/button\(actions,'candidate'/);
 assert.match(s,/const result=await prepared\(\)/);
});
test('projection retains linked strategic dossiers and reports count',()=>{
 const s=source('js/radar-publication-projection.js');assert.match(s,/radarRationales/);assert.match(s,/rationaleCount/);
});


test('intermediate rebuild preserves and restores existing local output',()=>{
 const s=source('scripts/build-intermediate-viewer.mjs');
 assert.match(s,/renameSync\(output,previous\)/);
 assert.match(s,/renameSync\(output,failed\)/);
 assert.match(s,/renameSync\(previous,output\)/);
 assert.match(s,/intermediate-history/);
 assert.doesNotMatch(s,/rmSync\(output/);
});
