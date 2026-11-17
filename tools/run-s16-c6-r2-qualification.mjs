#!/usr/bin/env node
// S16 C6 R2 qualification: isolate candidate, snapshot repo publication links and build,
// install verified enrichment, rebuild Pages, run HTTP/API verifier, rollback on failure.
// No Git staging, commit, push or deployment.
import {readFileSync,writeFileSync,mkdirSync,existsSync,renameSync,cpSync,rmSync,lstatSync} from 'node:fs';
import {join,resolve,dirname} from 'node:path';
import {homedir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {enrich} from './enrich-omg-public-histories.mjs';
const root=resolve(homedir(),'git/StandardisationRadarChart');
const audits=resolve(homedir(),'Documents/StandardizationRadarChart-Audits');
const node=existsSync('/opt/homebrew/opt/node@22/bin/node')?'/opt/homebrew/opt/node@22/bin/node':process.execPath;
const stamp=new Date().toISOString().replace(/[:.]/g,'-');
const run=join(audits,'S16-C6-R2-QUALIFICATION-'+stamp);
const base=join(audits,'S16-C6-CONSOLIDATION.klj8yDgM');
const input=join(base,'omg-public'),originalReview=join(base,'c6-review.json');
const target=join(root,'catalog-distribution/omg-public'),build=join(root,'.radarchart-build/pages');
const report={operation:'S16-C6-R2-QUALIFICATION',audit:run,ok:false,phase:'preflight',publication:false,committed:false,pushed:false,steps:[],errors:[]};
let targetSaved=false,buildSaved=false,finished=false;
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const say=(name,ok,detail=null)=>{report.steps.push({name,ok,...(detail?{detail}:{})});if(!ok)throw Error(name+(detail?': '+JSON.stringify(detail):''));};
function cmd(exe,args,name){const p=spawnSync(exe,args,{cwd:root,encoding:'utf8',maxBuffer:80*1024*1024,env:{...process.env,PATH:'/opt/homebrew/opt/node@22/bin:'+process.env.PATH}});writeFileSync(join(run,name+'.log'),(p.stdout||'')+(p.stderr||''));if(p.error)throw p.error;if(p.status!==0)throw Error(name+' exit '+p.status+' (see audit log)');return p.stdout;}
function restore(){
 // Revert the candidate and the built artifact as a pair.
 if(targetSaved){if(existsSync(target))renameSync(target,join(run,'omg-public.failed'));renameSync(join(run,'omg-public.before'),target);targetSaved=false;}
 if(buildSaved){if(existsSync(build))renameSync(build,join(run,'pages.failed'));renameSync(join(run,'pages.before'),build);buildSaved=false;}
 else if(existsSync(build)){renameSync(build,join(run,'pages.failed'));}
}
try{
 mkdirSync(run,{recursive:true});
 say('branch',cmd('git',['branch','--show-current'],'branch').trim()==='feature/s16-online-sdo-completion');
 say('head',cmd('git',['rev-parse','HEAD'],'head').trim()==='a30a23eefbbc136eba0a16e19e700e208189933e');
 say('staging-empty',cmd('git',['diff','--cached','--name-only'],'staging').trim()==='');
 const original=JSON.parse(readFileSync(originalReview,'utf8'));
 say('C6-baseline',original.files===264&&original.histories===262&&original.summary.formalEditions===494);
 let checked=0;
 for(const x of original.checksums){const p=join(target,x.path);if(!existsSync(p)||!lstatSync(p).isFile()||sha(p)!==x.sha256)throw Error('Source C6 digest mismatch: '+x.path);checked++;}
 say('source-264-digests',checked===264,{verified:checked});
 report.phase='candidate';
 const result=enrich({candidate:input,reviewFile:originalReview,evidenceFile:join(root,'tools/S16-C6-R2-BPMN-evidence.json'),out:join(run,'omg-public')});
 say('enrichment',result.formalEditions===496&&result.addedEditions===2&&result.files===264,result);
 // Both original tree and original build are preserved in audit until successful qualification.
 report.phase='integration';
 renameSync(target,join(run,'omg-public.before'));targetSaved=true;
 cpSync(join(run,'omg-public'),target,{recursive:true,errorOnExist:true,force:false});
 if(existsSync(build)){renameSync(build,join(run,'pages.before'));buildSaved=true;}
 report.phase='build';
 cmd('npm',['run','build:pages'],'build-pages');say('pages-build',true);
 report.phase='api';
 const raw=cmd(node,['tools/qualify-s16-c6-pages.mjs','--repo',root,'--build',build,'--review',join(run,'c6-r2-review.json')],'api-qualification');
 const api=JSON.parse(raw);say('http-api-functional',api.ok===true&&api.checks.length===7&&api.checks.every(x=>x.ok),api);
 finished=true;report.phase='complete';report.ok=true;
} catch(e){report.errors.push(String(e.stack||e));try{restore();report.steps.push({name:'rollback',ok:true});}catch(err){report.errors.push('ROLLBACK ERROR: '+String(err.stack||err));}}
finally{
 if(!finished&&report.phase!=='complete')report.phase='failed';
 mkdirSync(run,{recursive:true});
 writeFileSync(join(run,'report.json'),JSON.stringify(report,null,2)+'\n');
 const output=JSON.stringify(report,null,2);console.log(output);
 try{spawnSync('pbcopy',{input:output,encoding:'utf8'});}catch{}
 if(!report.ok)process.exitCode=1;
}
