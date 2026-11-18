import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { COMMANDS, discoverTests } from '../scripts/project-cli.mjs';

test('project CLI exposes only non-publication commands',()=>{
  assert.deepEqual(COMMANDS,['status','test','verify','build']);
  assert.ok(!COMMANDS.includes('publish'));
});
test('test discovery is sorted and excludes fixtures/non-tests',()=>{
  const d=mkdtempSync(join(tmpdir(),'radar-cli-test-'));
  try { for(const f of ['b.test.mjs','a.test.mjs','fixture.mjs','x.test.js'])writeFileSync(join(d,f),'');
    assert.deepEqual(discoverTests(d),['a.test.mjs','b.test.mjs']);
  } finally {rmSync(d,{recursive:true,force:true});}
});
test('help and invalid command do not mutate repository',()=>{
  const script=new URL('../scripts/project-cli.mjs',import.meta.url);
  const help=spawnSync(process.execPath,[script.pathname,'--help'],{encoding:'utf8'});
  assert.equal(help.status,0);assert.match(help.stdout,/Usage:/);
  const invalid=spawnSync(process.execPath,[script.pathname,'publish'],{encoding:'utf8'});
  assert.equal(invalid.status,2);assert.match(invalid.stderr,/Commande inconnue/);
});
