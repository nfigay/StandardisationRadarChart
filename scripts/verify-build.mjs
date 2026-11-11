import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const mode = process.argv[2];
if (!['local', 'pages'].includes(mode)) throw new Error('Expected mode local or pages');
const out = resolve('.radarchart-build', mode);
function assert(ok, message) {
  if (!ok) throw new Error(message);
  console.log(`OK ${message}`);
}
const htmlPath = resolve(out, 'radar.html');
assert(existsSync(htmlPath), 'radar.html emitted');
const html = readFileSync(htmlPath, 'utf8');
for (const path of ['js/radar.js', 'js/blips.js', 'lib/w2ui.min.js', 'lib/cytoscape.min.js', 'lib/d3.min.js']) {
  assert(existsSync(resolve(out, path)), `legacy asset emitted: ${path}`);
}
assert(html.includes('js/radar.js'), 'legacy radar reference retained');
assert(html.includes('js/blips.js'), 'legacy blips reference retained');

// GitHub Pages may contain a generated redirect index.html.
// radar.html remains the only application entry.
const indexPath = resolve(out, 'index.html');

if (existsSync(indexPath)) {
  assert(mode === 'pages',
    'redirect index.html permitted only in Pages output');

  const indexHtml = readFileSync(indexPath, 'utf8');

  assert(
    indexHtml.includes('url=./radar.html') &&
    !indexHtml.includes('js/radar.js'),
    'Pages index.html redirects to radar.html'
  );
} else {
  console.log('OK no independent index.html application entry');
}
if (mode === 'pages') assert(html.includes('StandardisationRadarChart/'), 'GitHub Pages base emitted in HTML');
console.log('BUILD CHECK COMPLETE: static artifact checks only; browser behavior not verified');
