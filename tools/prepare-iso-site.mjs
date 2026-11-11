#!/usr/bin/env node
/** Build an immutable static publication with optional ICS extension.
 * Requires a reviewed permission to redistribute the supplied ICS.csv.
 */
import {stage} from './deploy-catalog-static.mjs';
import {publishIcs} from './publish-ics-extension.mjs';
import {readFileSync,writeFileSync,existsSync,rmSync,mkdirSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
export async function prepare({repo,out,ics,acknowledgeRights=false}){
 const source=resolve(repo),dest=resolve(out);
 if(ics&&!acknowledgeRights)throw Error('ICS redistribution requires --acknowledge-ics-redistribution-rights');
 if(existsSync(dest))throw Error('Destination exists; immutable publish refuses overwrite');
 const result=await stage({repo:source,out:dest});
 try{
  let extension=null;
  if(ics){
    const release=result.release;
    extension=await publishIcs({input:resolve(ics),out:dest,release});
    const pointer={schemaVersion:1,kind:'ics-extension-pointer',catalogId:'iso',catalogRelease:release,release,manifest:`${release}/manifest.json`};
    writeFileSync(join(dest,'extensions','ics','manifest.json'),JSON.stringify(pointer,null,2)+'\n',{flag:'wx'});
  }
  return {operation:'S14-S-PREPARE-ISO-SITE',ok:true,release:result.release,destination:dest,iso:result.datasets,ics:extension?{records:extension.records,release:result.release}:null};
 }catch(e){rmSync(dest,{recursive:true,force:true});throw e;}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2),options={repo:process.cwd()};
 try{
  for(let i=0;i<args.length;i++){
   if(args[i]==='--acknowledge-ics-redistribution-rights'){options.acknowledgeRights=true;continue;}
   if(!['--repo','--out','--ics'].includes(args[i])||!args[i+1]||args[i+1].startsWith('--'))throw Error('Usage: --repo DIR --out NEW_DIR [--ics ICS.csv --acknowledge-ics-redistribution-rights]');
   options[args[i].slice(2)]=args[++i];
  }
  if(!options.out)throw Error('--out required');
  console.log(JSON.stringify(await prepare(options),null,2));
 }catch(e){console.error(JSON.stringify({operation:'S14-S-PREPARE-ISO-SITE',ok:false,error:String(e.message||e)}));process.exitCode=1;}
}
