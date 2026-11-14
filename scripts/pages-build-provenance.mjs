// A8.6: attest the exact local Pages input to standalone generation.
// This is local build evidence, not a signature or reproducible-build proof.
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {join,relative,resolve,basename} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
export function sourceState(repo=process.cwd()){
  const git=args=>execFileSync('git',args,{cwd:repo,encoding:'utf8',stdio:['ignore','pipe','pipe']});
  try{
    const commit=git(['rev-parse','HEAD']).trim();
    const tracked=git(['status','--porcelain','-z','--untracked-files=no']);
    const extra=git(['ls-files','--others','-z','--','js','lib','css','webfonts','src','scripts','radar.html','vite.config.js','package.json','package-lock.json']).split('\0').filter(Boolean).filter(p=>basename(p)!=='.DS_Store'&&!/\.s14-.*-backup$|\.bak$/.test(p));
    return {commit,clean:/^[a-f0-9]{40}$/.test(commit)&&!tracked&&!extra.length};
  }catch{return {commit:null,clean:false};}
}
export function fingerprintPages(directory){
  const files=[];
  function walk(dir){for(const entry of readdirSync(dir,{withFileTypes:true})){
    const path=join(dir,entry.name);
    if(entry.isDirectory())walk(path);else if(entry.isFile())files.push(path);else throw Error('Unexpected non-regular Pages resource: '+path);
  }}
  walk(directory);files.sort((a,b)=>relative(directory,a)<relative(directory,b)?-1:relative(directory,a)>relative(directory,b)?1:0);
  const aggregate=createHash('sha256');
  for(const path of files){const bytes=readFileSync(path);aggregate.update(JSON.stringify([relative(directory,path).split('\\').join('/'),bytes.length,sha(bytes)])+'\n');}
  return {outputSha256:aggregate.digest('hex'),fileCount:files.length};
}
export function writePagesProvenance(repo,before){
  const after=sourceState(repo),clean=before.clean&&after.clean&&before.commit===after.commit;
  const proof={schemaVersion:1,codeCommit:after.commit,clean,...fingerprintPages(resolve(repo,'.radarchart-build/pages'))};
  writeFileSync(resolve(repo,'.radarchart-build/pages-provenance.json'),JSON.stringify(proof,null,2)+'\n');return proof;
}
export function assertPagesProvenance(repo,commit){
  const current=sourceState(repo);assert.ok(current.clean&&current.commit===commit,'Standalone requires a clean matching committed source');
  const proof=JSON.parse(readFileSync(resolve(repo,'.radarchart-build/pages-provenance.json'),'utf8'));
  assert.ok(proof.schemaVersion===1&&proof.clean===true&&proof.codeCommit===commit,'Pages build provenance is stale or uncommitted');
  const actual=fingerprintPages(resolve(repo,'.radarchart-build/pages'));
  assert.equal(actual.outputSha256,proof.outputSha256,'Pages build bytes changed');assert.equal(actual.fileCount,proof.fileCount,'Pages build file count changed');return proof;
}
