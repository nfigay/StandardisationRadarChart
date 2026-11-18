#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
export const COMMANDS = Object.freeze(['status','test','verify','build']);
export function discoverTests(directory) {
  return readdirSync(directory).filter(f=>f.endsWith('.test.mjs')).sort();
}
function run(cmd,args,{cwd=root}={}) {
  const r=spawnSync(cmd,args,{cwd,stdio:'inherit',shell:false});
  if(r.error){console.error(r.error.message);return 1;}
  return r.status ?? 1;
}
function help(){console.log('Usage: npm run project -- <status|test|verify|build>');console.log('       npm test');console.log('Aucune commande de commit, push, publication ou nettoyage automatique.');}
export function main(argv=process.argv.slice(2)){
  const [command,...extra]=argv;
  if(!command||command==='--help'||command==='help'){help();return 0;}
  if(!COMMANDS.includes(command)||extra.length){console.error('Commande inconnue ou arguments non pris en charge.');help();return 2;}
  if(command==='status'){
    console.log('Dépôt : '+root);
    console.log('Opérations : '+COMMANDS.join(', '));
    if(run('git',['rev-parse','--show-toplevel']))return 1;
    if(run('git',['branch','--show-current']))return 1;
    if(run('git',['rev-parse','HEAD']))return 1;
    return run('git',['status','--short']);
  }
  if(command==='test'){
    const tests=discoverTests(resolve(root,'tests'));
    if(!tests.length){console.error('Aucun fichier de tests détecté');return 2;}
    console.log(tests.length+' fichiers de tests Node détectés');
    return run(process.execPath,['--test',...tests.map(f=>'tests/'+f)]);
  }
  if(command==='verify')return run(process.execPath,['scripts/verify-source.mjs']);
  if(command==='build'){
    console.log('Délégation à npm run build : refus des destinations occupées conservé.');
    return run('npm',['run','build']);
  }
  return 2;
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url))process.exitCode=main();
