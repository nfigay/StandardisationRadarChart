// Produce the synchronous classic entry point from the single ES6 domain source.
// No second implementation and no runtime coordination mechanisms.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { build } from 'esbuild';

const repo = resolve(process.argv[2] ?? '.');
const source = resolve(repo, 'src/domain/working-groups.mjs');
const output = resolve(repo, 'js/working-groups-classic.js');
const code = readFileSync(source, 'utf8');
if (!code.includes('export function getWorkingGroups(') ||
    !code.includes('export function getWorkingGroupsWithCount(') ||
    /(?:^|\n)\s*import\s/m.test(code)) {
  throw Error('STOP: working-groups.mjs contract changed; review classic build');
}
const entry = `import { getWorkingGroups, getWorkingGroupsWithCount } from ${JSON.stringify(source)};\nwindow.__radarWorkingGroups = Object.freeze({ getWorkingGroups, getWorkingGroupsWithCount });\n`;
const result = await build({
  stdin: { contents: entry, sourcefile: 'working-groups-sync-entry.mjs', resolveDir: repo, loader: 'js' },
  bundle: true, platform: 'browser', format: 'iife', target: 'es2020',
  write: false, minify: false, logLevel: 'silent'
});
const outputText = `// Generated from src/domain/working-groups.mjs; do not edit.\n${result.outputFiles[0].text}`;
if (process.argv.includes('--stdout')) process.stdout.write(outputText);
else { writeFileSync(output, outputText, {flag:'wx'}); console.log('GENERATED', output); }
