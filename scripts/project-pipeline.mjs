#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

export const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const PLAN=Object.freeze({qualify:['tests','sources'], 'build-local':['tests','sources','build-local','verify-local']});
export function digest(file){return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');}
function run(exe,args,cwd){const r=spawnSync(exe,args,{cwd,encoding:'utf8',maxBuffer:30*1024*1024});if(r.error)throw r.error;return {code:r.status??1,output:(r.stdout||'')+(r.stderr||'')};}
export function createAdapters(root){return {
 git:()=>{let r=run('git',['rev-parse','HEAD'],root);if(r.code||!(/^[a-f0-9]{40}\s*$/.test(r.output)))throw Error('SHA Git invalide');return r.output.trim();},
 branch:()=>{const r=run('git',['branch','--show-current'],root);if(r.code)throw Error(r.output);return r.output.trim();},
 tracked:()=>{const r=run('git',['status','--porcelain','--untracked-files=no'],root);if(r.code)throw Error(r.output);return r.output.trim();},
 exists:p=>fs.existsSync(path.join(root,p)),
 verify:()=>run(process.execPath,['scripts/verify-build.mjs','local'],root),
 run:step=>{
  if(step==='tests')return run('npm',['test'],root);
  if(step==='sources')return run(process.execPath,['scripts/verify-source.mjs'],root);
  if(step==='build-local')return run(process.execPath,['scripts/build-safe.mjs','local'],root);
  if(step==='verify-local')return run(process.execPath,['scripts/verify-build.mjs','local'],root);
  throw Error('Phase inconnue '+step);
 },
 fingerprint:()=>{
  const f=path.join(root,'.radarchart-build/local/radar.html');
  if(!fs.existsSync(f))throw Error('Sortie radar.html absente');
  return digest(f);
 }
};}
export function executePipeline({mode,auditDir,resume=false,adapters}){
 if(!PLAN[mode])throw Error('Mode inconnu');
 if(!path.isAbsolute(auditDir))throw Error('Audit doit être absolu');
 const stateFile=path.join(auditDir,'pipeline-state.json');
 const stateExists=fs.existsSync(stateFile);
 if(resume&&!stateExists)throw Error('Reprise impossible : état absent');
 if(!resume&&stateExists)throw Error('État existant : utiliser --resume ou un nouveau dossier audit');
 const sha=adapters.git();if(adapters.branch()!=='main')throw Error('Branche main requise');
 if(adapters.tracked())throw Error('Modifications suivies présentes : refus');
 const steps=PLAN[mode];
 let state=stateExists?JSON.parse(fs.readFileSync(stateFile,'utf8')):{schema:1,mode,sha,completed:[],fingerprints:{},phase:'initialized'};
 if(state.mode!==mode||state.sha!==sha||state.schema!==1||!Array.isArray(state.completed))throw Error('Reprise : provenance incompatible');
 if(state.completed.some(s=>!steps.includes(s)))throw Error('État avec phase inconnue');
 // A completed build must still be independently verifiable on resume.
 if(state.completed.includes('build-local')){
  if(!adapters.exists('.radarchart-build/local'))throw Error('Reprise : sortie locale disparue');
  const proof=adapters.fingerprint();
  if(proof!==state.fingerprints['build-local'])throw Error('Reprise : empreinte de build différente');
  const v=adapters.verify();if(v.code!==0)throw Error('Reprise : vérification de build échouée : '+v.output);
 }
 fs.mkdirSync(auditDir,{recursive:true});
 function save(){const tmp=stateFile+'.tmp';fs.writeFileSync(tmp,JSON.stringify(state,null,2)+'\n');fs.renameSync(tmp,stateFile);}
 if(!stateExists)save();
 try{
  for(const step of steps){
   if(state.completed.includes(step))continue;
   if(step==='build-local'&&adapters.exists('.radarchart-build/local'))throw Error('Sortie occupée sans preuve : arrêt sans suppression');
   state.phase=step;save();
   const result=adapters.run(step);
   fs.writeFileSync(path.join(auditDir,step+'.log'),result.output);
   if(result.code!==0)throw Error('Phase '+step+' échouée, code '+result.code);
   if(step==='build-local')state.fingerprints[step]=adapters.fingerprint();
   state.completed.push(step);state.phase='complete:'+step;save();
  }
  state.phase='complete';save();
  fs.writeFileSync(path.join(auditDir,'result.json'),JSON.stringify({ok:true,mode,sha,completed:state.completed},null,2));
  return state;
 }catch(e){state.phase='failed';state.error=e.message;save();fs.writeFileSync(path.join(auditDir,'result.json'),JSON.stringify({ok:false,mode,sha,error:e.message,completed:state.completed},null,2));throw e;}
}
export function main(args=process.argv.slice(2)){
 const [mode,...rest]=args;
 let auditDir, resume=false;
 for(let i=0;i<rest.length;i++){
  if(rest[i]==='--resume')resume=true;
  else if(rest[i]==='--audit-dir'&&rest[i+1])auditDir=path.resolve(rest[++i]);
  else throw Error('Usage: npm run pipeline -- qualify|build-local --audit-dir ABSOLU [--resume]');
 }
 if(!auditDir||!PLAN[mode])throw Error('Usage: npm run pipeline -- qualify|build-local --audit-dir ABSOLU [--resume]');
 const state=executePipeline({mode,auditDir,resume,adapters:createAdapters(ROOT)});
 console.log('PIPELINE OK '+state.mode+' '+state.sha+' ; audit '+auditDir);
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{main();}catch(e){console.error('PIPELINE ERROR:',e.message);process.exitCode=1;}
}
