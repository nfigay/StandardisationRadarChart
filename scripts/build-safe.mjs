import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const mode = process.argv[2];
if (!['local', 'pages'].includes(mode)) throw new Error('Expected mode local or pages');
const dir = resolve(`.radarchart-build/${mode}`);
if (existsSync(dir)) {
  console.error(`STOP: output already exists and will not be overwritten: ${dir}`);
  process.exit(2);
}
const run = spawnSync('vite', ['build', '--mode', mode === 'local' ? 'development' : mode], { stdio: 'inherit', shell: false });
if (run.error) throw run.error;
if (run.status !== 0) process.exit(run.status ?? 1);
const check = spawnSync(process.execPath, ['scripts/verify-build.mjs', mode], { stdio: 'inherit' });
if (check.error) throw check.error;
process.exit(check.status ?? 1);
