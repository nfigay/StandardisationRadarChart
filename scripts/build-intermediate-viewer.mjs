// S19-R34-R1: local validation build only. No git commit, push or deployment.
import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdtempSync,rmSync,existsSync,renameSync,mkdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {tmpdir} from 'node:os';
import {extractStandaloneViewerResources,embedViewerResources} from './pages-viewer-template.mjs';
const repo=process.cwd();
const output=resolve(repo,'.radarchart-build/local');
const html=join(output,'radar.html');
function command(executable,args,env={}){
 const r=spawnSync(executable,args,{cwd:repo,env:{...process.env,...env},encoding:'utf8',maxBuffer:32*1024*1024});
 if(r.stdout)process.stdout.write(r.stdout);
 if(r.stderr)process.stderr.write(r.stderr);
 if(r.error||r.status!==0)throw Error('Intermediate build failed: '+executable+' '+args.join(' ')+' ['+r.status+'] '+(r.error?.message||''));
}
if(!existsSync('node_modules/vite'))throw Error('Vite is not installed; run npm install first (no repository changes to tracked sources)');
// S19-R34-R6: transactional rebuild
const history=resolve(repo,'.radarchart-build/intermediate-history');
mkdirSync(history,{recursive:true});

const transaction=mkdtempSync(join(history,'rebuild-'));
const previous=join(transaction,'previous');
const failed=join(transaction,'failed');

let previousArchived=false;
let buildStarted=false;

try{
 if(existsSync(output)){
  renameSync(output,previous);
  previousArchived=true;
  console.log('previousBuildArchived='+previous);
 }

 buildStarted=true;
 command('npm',['run','build']);
if(!existsSync(html))throw Error('Local Creator HTML not generated: '+html);
const dir=mkdtempSync(join(tmpdir(),'s19-intermediate-viewer-'));
try{
 command(process.execPath,['scripts/build-common-standalone.mjs'],{RADAR_INTERMEDIATE_SOURCE_DIR:output,PILOT_DIR:dir});
 const viewer=readFileSync(join(dir,'standardization-radar-viewer.html'),'utf8');
 const creator=readFileSync(join(dir,'standardization-radar-creator.html'),'utf8');
 const resources=extractStandaloneViewerResources(creator,viewer);
 const source=readFileSync(html,'utf8');
 const updated=embedViewerResources(source,resources);
 writeFileSync(html,updated);
 const proof=JSON.parse(Buffer.from(resources['radar-viewer-template-proof'],'base64').toString('utf8'));
 if(proof.codeCommit!=='local-intermediate-uncommitted')throw Error('Invalid intermediate provenance');
 console.log(JSON.stringify({operation:'S19-R34-R1-LOCAL-INTERMEDIATE',ok:true,creator:html,viewerTemplateBytes:Buffer.byteLength(viewer),provenance:proof.codeCommit,committed:false,pushed:false,published:false},null,2));
}finally{rmSync(dir,{recursive:true,force:true});}

 console.log('intermediateTransactionComplete=true');

}catch(error){
 if(buildStarted&&existsSync(output)){
  renameSync(output,failed);
  console.error('failedBuildArchived='+failed);
 }

 if(previousArchived){
  renameSync(previous,output);
  console.error('previousBuildRestored=true');
 }

 throw error;
}
