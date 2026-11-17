// S16 hotfix: carry the existing standalone Viewer template into Pages Creator.
// Run after the first Pages provenance is written and before final verification.
import {execFileSync, spawnSync} from 'node:child_process';
import {readFileSync, writeFileSync, mkdtempSync, rmSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {extractStandaloneViewerResources, embedViewerResources} from './pages-viewer-template.mjs';
import {sourceState, writePagesProvenance} from './pages-build-provenance.mjs';

const root = process.cwd();
const commit = execFileSync('git', ['rev-parse','HEAD'], {cwd:root,encoding:'utf8'}).trim();
const before = sourceState(root);
if (!before.clean || before.commit !== commit) {
  throw Error('Pages Viewer embedding requires clean committed sources, to preserve standalone provenance');
}
const pagesHtml = resolve(root,'.radarchart-build/pages/radar.html');
const destination = mkdtempSync(join(tmpdir(),'s16-pages-viewer-'));
try {
  const run = spawnSync(process.execPath, ['scripts/build-common-standalone.mjs'], {
    cwd:root, env:{...process.env,PILOT_DIR:destination}, encoding:'utf8', maxBuffer:16*1024*1024
  });
  if (run.error) throw run.error;
  if (run.status !== 0) throw Error('Standalone generator failed: '+(run.stderr||run.stdout).slice(-6000));
  const viewer = readFileSync(join(destination,'standardization-radar-viewer.html'),'utf8');
  const creator = readFileSync(join(destination,'standardization-radar-creator.html'),'utf8');
  const resources = extractStandaloneViewerResources(creator,viewer);
  const amended = embedViewerResources(readFileSync(pagesHtml,'utf8'),resources);
  writeFileSync(pagesHtml,amended);
  const provenance = writePagesProvenance(root,before);
  if (!provenance.clean || provenance.codeCommit!==commit) throw Error('Pages provenance not clean after embedding');
  console.log(JSON.stringify({operation:'S16-PAGES-VIEWER-TEMPLATE',ok:true,commit,viewerBytes:Buffer.byteLength(viewer),pagesHtmlBytes:Buffer.byteLength(amended),pagesFiles:provenance.fileCount}));
} finally {
  rmSync(destination,{recursive:true,force:true});
}
