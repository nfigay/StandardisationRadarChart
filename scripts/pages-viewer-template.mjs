import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

export function extractStandaloneViewerResources(creator, viewer) {
  assert.equal(typeof creator, 'string');
  assert.equal(typeof viewer, 'string');
  const found = {};
  for (const id of ['radar-viewer-template','radar-viewer-template-proof']) {
    const pattern = new RegExp('<script\\s+type="application/json"\\s+id="'+id+'"\\s*>([A-Za-z0-9+/=\\s]+)<\\/script>', 'g');
    const matches = [...creator.matchAll(pattern)];
    assert.equal(matches.length, 1, 'Expected exactly one non-executable '+id);
    found[id] = matches[0][1].trim();
  }
  const template = Buffer.from(found['radar-viewer-template'], 'base64');
  const proof = JSON.parse(Buffer.from(found['radar-viewer-template-proof'], 'base64').toString('utf8'));
  assert.equal(template.toString('utf8'), viewer, 'Embedded Viewer differs from generated Viewer');
  assert.equal(proof.templateSha256, sha256(template), 'Standalone Viewer checksum mismatch');
  assert.equal(proof.templateBytes, template.length, 'Standalone Viewer byte count mismatch');
  assert.equal(proof.schemaVersion, 1, 'Unknown Viewer provenance schema');
  return found;
}

export function embedViewerResources(pagesHtml, resources) {
  assert.equal(typeof pagesHtml, 'string');
  assert.ok(/<\/head\s*>/i.test(pagesHtml), 'Pages HTML has no head');
  assert.ok(!/id=["']radar-viewer-template(?:-proof)?["']/.test(pagesHtml), 'Viewer resources are already embedded');
  const injection = ['radar-viewer-template', 'radar-viewer-template-proof']
    .map(id => {
      const encoded = resources[id];
      assert.match(encoded, /^[A-Za-z0-9+/=]+$/, 'Invalid Viewer resource '+id);
      return `<script type="application/json" id="${id}">${encoded}</script>`;
    }).join('\n');
  return pagesHtml.replace(/<\/head\s*>/i, match => injection+'\n'+match);
}
