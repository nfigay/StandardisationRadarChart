import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function assert(ok, message) {
  if (!ok) throw new Error(message);
  console.log(`OK ${message}`);
}
const radar = readFileSync(resolve('radar.html'), 'utf8');
assert(radar.includes('<script'), 'radar.html preserves its application script entry points');
assert(radar.includes('js/radar.js'), 'radar.js is referenced by radar.html');
assert(radar.includes('js/blips.js'), 'blips.js is referenced by radar.html');
assert(radar.includes('lib/w2ui.min.js'), 'W2UI dependency is referenced');
assert(radar.includes('lib/cytoscape.min.js'), 'Cytoscape dependency is referenced');
assert(radar.includes('lib/d3.min.js'), 'D3 dependency is referenced');
for (const path of ['js/radar.js', 'js/blips.js', 'lib/w2ui.min.js', 'lib/cytoscape.min.js', 'lib/d3.min.js']) {
  assert(existsSync(resolve(path)), `exists: ${path}`);
}
console.log('SOURCE CHECK COMPLETE: static only; Chrome behavior not verified');
