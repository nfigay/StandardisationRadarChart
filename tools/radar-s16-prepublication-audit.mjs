#!/usr/bin/env node
/** S16-A-C1 — conservative, read-only readiness inventory. No publish or Git writes. */
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

export const EXPECTED_BRANCH = 'feature/s16-multisource-standards';
export const EXPECTED_HEAD = '1df817baad2072b005936197414da1ea6353f392';
export const EXPECTED_PROTECTED = Object.freeze({
  'refs/heads/main': EXPECTED_HEAD,
  'refs/remotes/origin/main': EXPECTED_HEAD,
  'refs/tags/pilot-a87': '545ed539df2e117a8aab5158a4bcc5c151308ba3',
  'refs/remotes/origin/gh-pages': '1eb772603268a48b653e0bde36187a6b7e15e143',
});
export const R4_FILES = Object.freeze([
 'docs/architecture/99-S16-A-R4-OMG-HISTORICAL-EDITIONS.md',
 'tests/radar-s16-r4-browser.html',
 'tools/radar-omg-local-bridge.mjs',
 'js/radar-standard-sources.js',
 'js/radar-standards-panel.js',
 'js/radar-catalog-persistence.js',
 'tests/radar-s16-federation.test.mjs',
 'tests/radar-s15-a-references.test.mjs',
 'vite.omg.config.mjs',
]);
export const R4_HASHES = Object.freeze({
 'docs/architecture/99-S16-A-R4-OMG-HISTORICAL-EDITIONS.md':'231c28713bad0fa9304950544600348045d5d73d57e41ede2d4fcc56a8ddbf87',
 'tests/radar-s16-r4-browser.html':'14b8943478d355a60bf1e0a802a422b87841035067a02a8a004b7b1eefad2b86',
 'tools/radar-omg-local-bridge.mjs':'6290fc503cd16c3dfda0f7c67183cd849374c8b035ee8b20280f0be31cc6a838',
 'js/radar-standard-sources.js':'81ce764ec44b6eb7ac960fb5b767e33a22ebe974496d22cfac8867634071d2f7',
 'js/radar-standards-panel.js':'ba96065eb0544d8efa3ff329363d9989e199a68e09ec195f1cbba9813181ad2c',
 'js/radar-catalog-persistence.js':'7b33e48bfeebda6a8aa697328eabfc725eca9507c7db4084f626b724e1daefe0',
 'tests/radar-s16-federation.test.mjs':'cf4a74d8895fa027ae33048cf366f3b774ebfd5a5889a3e6dddb597083955358',
 'tests/radar-s15-a-references.test.mjs':'aa7e06d84ac1037301700d5ec8982b0a476b22a6a84b1617f58f48a2d71b0fbe',
});
export function evaluateSnapshot(s){
 const checks=[];
 const check=(name,actual,expected)=>checks.push({name,ok:actual===expected,actual,expected});
 check('branch',s.branch,EXPECTED_BRANCH);check('HEAD',s.head,EXPECTED_HEAD);
 for(const [ref,hash] of Object.entries(EXPECTED_PROTECTED))check('protected:'+ref,s.refs?.[ref]??null,hash);
 check('staged-empty',s.stagedCount,0);
 for(const f of R4_FILES)checks.push({name:'exists:'+f,ok:s.files?.[f]?.exists===true});
 for(const [f,hash] of Object.entries(R4_HASHES))check('sha256:'+f,s.files?.[f]?.sha256??null,hash);
 const blocked=s.untracked.filter(p=>p.startsWith('.radarchart-build/')||p.startsWith('dist/'));
 checks.push({name:'untracked-distribution-outside-build',ok:blocked.length===0,actual:blocked});
 const ready=checks.every(x=>x.ok);
 return {operation:'S16-A-C1-PREPUBLICATION-AUDIT',ok:ready,readOnly:true,readyForPublicationReview:ready,publicationAuthorized:false,checks,
   baseline:{head:s.head,branch:s.branch},trackedChanges:s.tracked,untracked:s.untracked,
   notes:['A8.7 est la dernière release publiée ; S16 reste un candidat local.',
   'La qualification technique R4-R1 95/95 et 694/694 ainsi que la recette 8/8 doivent être jointes au dossier de publication.',
   'Ce diagnostic ne remplace ni un build Pages ni une autorisation explicite de commit/push/publish.',
   'Le radar recommande ; il ne constate pas l’applicabilité opérationnelle.']};
}
const hash=b=>createHash('sha256').update(b).digest('hex');
export function collectSnapshot(dir){
 const git=(...args)=>execFileSync('git',['-C',dir,...args],{encoding:'utf8'}).trim();
 const lines=execFileSync('git',['-C',dir,'status','--porcelain=v1','-z'],{encoding:'buffer'}).toString('utf8').split('\0').filter(Boolean);
 const tracked=[],untracked=[];let stagedCount=0;
 for(let i=0;i<lines.length;i++){
   const entry=lines[i],xy=entry.slice(0,2),path=entry.slice(3);
   if(xy==='??')untracked.push(path);else{tracked.push(path);if(xy[0]!==' ')stagedCount++;}
   if(xy[0]==='R'||xy[0]==='C')i++; // rename/copy destination record in -z format
 }
 const files={};for(const f of R4_FILES){const p=join(dir,f);files[f]={exists:existsSync(p)};if(files[f].exists&&statSync(p).isFile())files[f].sha256=hash(readFileSync(p));}
 const refs={};for(const ref of Object.keys(EXPECTED_PROTECTED)){try{refs[ref]=git('rev-parse','--verify',ref);}catch{refs[ref]=null;}}
 return {branch:git('branch','--show-current'),head:git('rev-parse','HEAD'),refs,files,stagedCount,tracked,untracked};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const dir=resolve(process.argv[2]||process.cwd());
 try{const report=evaluateSnapshot(collectSnapshot(dir));console.log(JSON.stringify(report,null,2));process.exitCode=report.ok?0:2;}
 catch(e){console.log(JSON.stringify({operation:'S16-A-C1-PREPUBLICATION-AUDIT',ok:false,readOnly:true,error:String(e.message||e)},null,2));process.exitCode=3;}
}
