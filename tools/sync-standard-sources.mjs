// Explicit acquisition of official indexes, using only Node.js 22 and macOS pbcopy.
// No native catalog is touched. Each source snapshot is replaced atomically after acquisition.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createHash,randomUUID} from 'node:crypto';
import '../js/radar-standard-sources.js';
const api=globalThis.__radarStandardSources;
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const report={operation:'S15-B-SYNC-SOURCES',startedAt:new Date().toISOString(),repository:repo,sources:[],errors:[],ok:false};
let dir;
function save(name,data){const count=Array.isArray(data.payload)?data.payload.length:api.countRfcEntries(data.payload);const cache=path.join(repo,'standard-source-cache');fs.mkdirSync(cache,{recursive:true});const file=path.join(cache,name+'.json'),tmp=file+'.'+randomUUID()+'.tmp';const bytes=Buffer.from(JSON.stringify(data));try{fs.writeFileSync(tmp,bytes,{flag:'wx'});fs.renameSync(tmp,file);}finally{if(fs.existsSync(tmp))fs.unlinkSync(tmp);}return {path:file,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),acquiredAt:data.acquiredAt,count};}
async function sync(id,fn){try{console.error('Acquisition '+id);const data=await fn();report.sources.push({sourceId:id,...save(id,data),ok:true});}catch(e){report.sources.push({sourceId:id,ok:false,error:e.message,cause:e.cause?.message||null});report.errors.push(id+': '+e.message);}}
try{
 const args=process.argv.slice(2);if(args.some(a=>!['rfc-editor','w3c'].includes(a)&&!/^w3c:[A-Za-z0-9][A-Za-z0-9._+-]{0,149}$/.test(a)))throw Error('Usage: node tools/sync-standard-sources.mjs [rfc-editor] [w3c] [w3c:shortname]');
 const ids=[...new Set(args.length?args:['rfc-editor','w3c'])];
 for(const id of ids){if(id.startsWith('w3c:')){const short=id.slice(4);await sync('w3c-'+short,()=>api.acquireVersions(short));}else await sync(id,()=>api.acquireIndex(id));}
 report.ok=report.errors.length===0;
}catch(e){report.errors.push(e.message);}finally{
 report.finishedAt=new Date().toISOString();report.operationOk=report.ok;
 try{const docs=path.join(os.homedir(),'Documents');fs.mkdirSync(docs,{recursive:true});dir=fs.mkdtempSync(path.join(docs,'S15-B-sources-'));report.reportPath=path.join(dir,'S15-B-SYNC-SOURCES.json');report.clipboard={ok:true};let json=JSON.stringify(report,null,2);fs.writeFileSync(report.reportPath,json);const cp=spawnSync('pbcopy',[],{input:json,encoding:'utf8'});if(cp.status!==0||cp.error){report.clipboard={ok:false,error:cp.error?.message||cp.stderr||'pbcopy failed'};report.ok=false;json=JSON.stringify(report,null,2);fs.writeFileSync(report.reportPath,json);}console.log(json);}catch(e){report.ok=false;report.errors.push(e.message);console.log(JSON.stringify(report,null,2));}
 process.exitCode=report.ok?0:1;
}
