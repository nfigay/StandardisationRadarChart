#!/usr/bin/env node
// Remote publication is deliberately separate from local preparation.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const repo=path.resolve(os.homedir(),'git','StandardisationRadarChart');
const project='nfigay/StandardisationRadarChart';
const tag='pilot-a86';
const base='f7939c362cd9343cd92b6087235b8a29d2c06765';
const sha=f=>createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const assert=(v,m)=>{if(!v)throw Error(m);};
const args=process.argv.slice(2);const mode=args[0];const pilot=args[1]?path.resolve(args[1]):null;
const report={operation:'A86-RELEASE-PUBLICATION',mode,project,tag,pilot,commit:null,phase:'preflight',sourceAndTagPushed:false,releaseVerified:false,pagesPushed:false,ok:false};
const log=[];const run=(cmd,argv,options={})=>{
 const r=spawnSync(cmd,argv,{cwd:repo,encoding:'utf8',maxBuffer:64*1024*1024,...options});
 const entry={command:cmd,args:argv,status:r.status,stdout:r.stdout||'',stderr:r.stderr||''};log.push(entry);
 if(r.error)throw r.error;
 if(r.status!==0)throw Error(cmd+' '+argv.join(' ')+' failed: '+(r.stderr||r.stdout||r.status));
 return (r.stdout||'').trim();
};
const git=(...a)=>run('git',a),gh=(...a)=>run('gh',a);
function checksumList(dir,expected){
 const lines=fs.readFileSync(path.join(dir,'SHA256SUMS'),'utf8').trim().split('\n');
 const names=[];for(const line of lines){const m=/^([0-9a-f]{64})  ([A-Za-z0-9_.-]+)$/.exec(line);assert(m,'Bad release checksum entry');assert(!names.includes(m[2]),'Duplicate checksum');names.push(m[2]);assert(sha(path.join(dir,m[2]))===m[1],'Checksum mismatch '+m[2]);}
 assert(JSON.stringify(names.sort())===JSON.stringify([...expected].sort()),'Unexpected release asset checksum inventory');
 assert(JSON.stringify(fs.readdirSync(dir).sort())===JSON.stringify([...expected,'SHA256SUMS'].sort()),'Unexpected release asset inventory');
}
const names=['standardization-radar-creator.html','standardization-radar-viewer.html','RELEASE-NOTES.md'];
const remoteRef=ref=>{const out=git('ls-remote','origin',ref);return out?out.split(/\s+/)[0]:null;};
let reportDir=fs.mkdtempSync(path.join(os.tmpdir(),'radar-a86-publication.'));
try{
 assert(['--check','--publish'].includes(mode)&&pilot&&args.length===2,'Usage: node publish.mjs --check|--publish /absolute/path/to/release-pilot');
 assert(fs.realpathSync(repo)===fs.realpathSync(git('rev-parse','--show-toplevel')),'Wrong repository');
 assert(git('branch','--show-current')==='main','Expected main');
 assert(!git('status','--porcelain','--untracked-files=no'),'Tracked changes present');
 const remote=git('remote','get-url','origin');assert(/^(https:\/\/github\.com\/|git@github\.com:|ssh:\/\/git@github\.com\/|git:\/\/github\.com\/)nfigay\/StandardisationRadarChart(?:\.git)?\/?$/i.test(remote),'Unexpected Git origin');
 const candidate=JSON.parse(fs.readFileSync(path.join(pilot,'CANDIDATE-REPORT.json'),'utf8'));
 const commit=git('rev-parse','HEAD');report.commit=commit;
 assert(candidate.operation==='A86-RELEASE-PREPARED'&&candidate.ok===true&&candidate.commit===commit&&candidate.qualifiedApplicationCommit===base&&candidate.tag===tag,'Wrong release preparation report');
 assert(git('rev-parse','HEAD^')===base,'Unexpected release source parent');
 assert(candidate.automatedTests?.tests===603&&candidate.automatedTests?.passed===603&&candidate.automatedTests?.failed===0,'Missing complete release validation');
 const assets=path.join(pilot,'release-assets');const dist=path.join(repo,'dist');
 assert(candidate.releaseAssets===assets&&candidate.dist===dist,'Candidate paths differ');checksumList(assets,names);
 for(const name of names.slice(0,2))assert(sha(path.join(assets,name))===sha(path.join(pilot,name)),'Standalone artifact differs from verified build');
 const proof=JSON.parse(fs.readFileSync(path.join(pilot,'BUILD-VERIFICATION.json'),'utf8'));assert(proof.ok===true&&proof.codeCommit===commit,'Missing standalone verification');
 // Recheck standalone composition and all final site bytes immediately before publishing.
 run(process.execPath,['scripts/verify-standalone-publication.mjs',pilot,path.join(pilot,'catalogue-publications-a86-r1.json')]);
 run('npm',['run','verify:dist']);
 assert(sha(path.join(dist,'site-manifest.json'))===candidate.siteManifestSha256,'Site changed after preparation');
 const site=JSON.parse(fs.readFileSync(path.join(dist,'site-manifest.json'),'utf8'));
 assert(site.sourceCommit===git('rev-parse','--short','HEAD'),'Stale site');
 assert(fs.readFileSync(path.join(dist,'distributions.html'),'utf8').includes('/releases/tag/'+tag),'Release portal missing tag');
 gh('auth','status','--hostname','github.com');
 assert(gh('repo','view',project,'--json','nameWithOwner','--jq','.nameWithOwner').toLowerCase()===project.toLowerCase(),'Unexpected GitHub repository');
 const remoteMain=remoteRef('refs/heads/main'),remotePages=remoteRef('refs/heads/gh-pages'),remoteTag=remoteRef('refs/tags/'+tag);
 assert(remoteMain&&remotePages,'Missing existing remote branches');
 assert(!remoteTag||remoteTag===commit,'Existing remote tag points to another commit; never overwrite');
 if(remoteTag)assert(remoteMain===commit,'Existing tag with different main; stop for review');
 report.previousRemoteMain=remoteMain;report.previousRemotePages=remotePages;report.remoteTag=remoteTag;
 report.phase='preflight-complete';
 if(mode==='--check'){report.ok=true;report.message='Preflight passed; no remote mutation.';}
 else{
  report.phase='source-and-tag';
  git('fetch','origin','main','gh-pages');
  assert(git('rev-parse','origin/main')===remoteMain&&git('rev-parse','origin/gh-pages')===remotePages,'Remote branches changed during preflight');
  git('merge-base','--is-ancestor',remoteMain,commit);
  if(!remoteTag){git('push','--atomic','origin',commit+':refs/heads/main',commit+':refs/tags/'+tag);}
  assert(remoteRef('refs/heads/main')===commit&&remoteRef('refs/tags/'+tag)===commit,'Remote main or tag mismatch');report.sourceAndTagPushed=true;
  report.phase='github-release';
  // A resume may reuse an existing release only if every asset is byte-identical.
  const viewArgs=['release','view',tag,'--repo',project,'--json','tagName,isDraft,isPrerelease,assets,url'];
  const view=spawnSync('gh',viewArgs,{cwd:repo,encoding:'utf8'});
  if(view.status!==0){
   gh('release','create',tag,'--repo',project,'--verify-tag','--title','Standardization Radar Chart A8.6','--notes-file',path.join(assets,'RELEASE-NOTES.md'),...names.map(n=>path.join(assets,n)),path.join(assets,'SHA256SUMS'));
  }
  const release=JSON.parse(gh(...viewArgs));assert(release.tagName===tag&&!release.isDraft&&!release.isPrerelease,'Unexpected release state');
  assert(JSON.stringify(release.assets.map(a=>a.name).sort())===JSON.stringify([...names,'SHA256SUMS'].sort()),'Remote release asset inventory differs');
  const downloaded=fs.mkdtempSync(path.join(reportDir,'release-assets.'));
  gh('release','download',tag,'--repo',project,'--dir',downloaded,'--pattern','*');checksumList(downloaded,names);
  for(const n of [...names,'SHA256SUMS'])assert(sha(path.join(downloaded,n))===sha(path.join(assets,n)),'Remote asset bytes differ: '+n);
  report.releaseUrl=release.url;report.releaseVerified=true;
  report.phase='github-pages';
  // Existing repository publisher handles staging, byte verification, no force push and concurrent updates.
  assert(remoteRef('refs/heads/main')===commit&&remoteRef('refs/heads/gh-pages')===remotePages,'Remote branches changed before Pages publication');
  run('npm',['run','publish:dist']);
  report.pagesCommit=remoteRef('refs/heads/gh-pages');
  assert(report.pagesCommit&&remoteRef('refs/heads/main')===commit,'Remote Pages/main verification failed');
  report.pagesPushed=true;report.pagesUrl='https://nfigay.github.io/StandardisationRadarChart/distributions.html';report.phase='complete';report.ok=true;
  report.browserRecipeRequired=true;
 }
}catch(e){report.error=e.message;process.exitCode=1;}
finally{
 const output=path.join(reportDir,'PUBLICATION-REPORT.json');report.report=output;report.commandLog=path.join(reportDir,'COMMANDS.json');
 fs.writeFileSync(report.commandLog,JSON.stringify(log,null,2)+'\n');const json=JSON.stringify(report,null,2)+'\n';fs.writeFileSync(output,json);console.log(json);
 const clip=spawnSync('pbcopy',[],{input:json,encoding:'utf8'});if(clip.status===0)console.log('Rapport JSON copié dans le presse-papiers.');else console.warn('Presse-papiers indisponible ; rapport : '+output);
}
