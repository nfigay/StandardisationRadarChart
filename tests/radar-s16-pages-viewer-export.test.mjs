import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {extractStandaloneViewerResources,embedViewerResources} from '../scripts/pages-viewer-template.mjs';

const digest = str => createHash('sha256').update(str).digest('hex');
const source = readFileSync(new URL('../scripts/build-pages-complete.mjs',import.meta.url),'utf8');
const ui = readFileSync(new URL('../js/radar-publication-ui.js',import.meta.url),'utf8');
const viewerCode = readFileSync(new URL('../js/radar-publication-viewer.js',import.meta.url),'utf8');

test('S16 Pages embeds standalone template after initial provenance and revalidates output',()=>{
  assert.match(source,/writePagesProvenance\(root,buildSource\)/);
  assert.match(source,/scripts\/embed-pages-viewer-template\.mjs/);
  assert.ok(source.indexOf('writePagesProvenance(root,buildSource)')<source.indexOf("scripts/embed-pages-viewer-template.mjs"));
  assert.match(ui,/radar-viewer-template/);
  assert.match(viewerCode,/radar-viewer-template/);
});

test('S16 standalone resources must match Viewer bytes and provenance',()=>{
  const viewer='<!doctype html><html><head><!--RADAR-PUBLICATION-PAYLOAD--></head></html>';
  const proof={schemaVersion:1,templateBytes:Buffer.byteLength(viewer),templateSha256:digest(viewer)};
  const script=(id,value)=>`<script type="application/json" id="${id}">${Buffer.from(value).toString('base64')}</script>`;
  const creator=script('radar-viewer-template',viewer)+script('radar-viewer-template-proof',JSON.stringify(proof));
  const resources=extractStandaloneViewerResources(creator,viewer);
  const html=embedViewerResources('<html><head><title>Radar</title></head><body></body></html>',resources);
  assert.match(html,/id="radar-viewer-template"/);
  assert.match(html,/id="radar-viewer-template-proof"/);
  assert.equal(extractStandaloneViewerResources(html,viewer)['radar-viewer-template'],resources['radar-viewer-template']);
  assert.throws(()=>embedViewerResources(html,resources),/already embedded/);
  assert.throws(()=>extractStandaloneViewerResources(creator,viewer+'x'),/differs/);
  assert.throws(()=>extractStandaloneViewerResources(creator+script('radar-viewer-template',viewer),viewer),/exactly one/);
});
