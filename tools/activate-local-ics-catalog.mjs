#!/usr/bin/env node
/** Operator-only: stage an ISO + ICS site and configure local Vite source. */
import {prepare} from './prepare-iso-site.mjs';
import {readFileSync,writeFileSync,existsSync,copyFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const args=process.argv.slice(2);let repo=process.cwd(),ics=null,consent=false;
const result={operation:'S14-T-LOCAL-ICS-PUBLICATION',ok:false};
try{
 for(let i=0;i<args.length;i++){
  if(args[i]==='--acknowledge-ics-redistribution-rights'){consent=true;continue;}
  if(args[i]==='--repo'&&args[i+1]){repo=args[++i];continue;}
  if(args[i]==='--ics'&&args[i+1]){ics=args[++i];continue;}
  throw Error('Usage: --repo PATH --ics PATH --acknowledge-ics-redistribution-rights');
 }
 repo=resolve(repo);ics=resolve(ics||join(repo,'ICS.csv'));
 if(!consent)throw Error('You must verify rights and explicitly acknowledge ICS redistribution rights');
 if(!existsSync(ics))throw Error('ICS file not found: '+ics);
 const cfgPath=join(repo,'radar-catalog-config.json'),cfg=JSON.parse(readFileSync(cfgPath,'utf8'));
 if(cfg.schemaVersion!==1||!['./catalog-distribution/','catalog-distribution/'].includes(cfg.endpoint))throw Error('Catalog endpoint was customized; refusing automatic change');
 const manifest=JSON.parse(readFileSync(join(repo,'catalog-distribution','manifest.json'),'utf8'));
 const release=String(manifest.release||manifest.latest||'').match(/\d{4}-\d{2}-\d{2}/)?.[0];
 // The manifest can carry the release in its nested pointer; prefer the actual manifest if available.
 const date=release||'published';const name='iso-catalog-site-'+date;
 const dest=join(repo,name);
 const backup=cfgPath+'.s14-t-backup';
 if(existsSync(backup))throw Error('Configuration backup already exists; preserve it and use a new release');
 if(existsSync(dest))throw Error('Publication already exists: '+dest+' (immutable; do not overwrite)');
 const staged=await prepare({repo,out:dest,ics,acknowledgeRights:true});
 // Backup existing configuration, then atomically replace it; catalog remains intact even if this fails.
 copyFileSync(cfgPath,backup,0);
 cfg.endpoint='./'+name+'/';
 const tmp=cfgPath+'.s14-t-new';
 try{writeFileSync(tmp,JSON.stringify(cfg,null,2)+'\n',{flag:'wx'});const {renameSync}=await import('node:fs');renameSync(tmp,cfgPath);}catch(error){try{const {rmSync}=await import('node:fs');rmSync(tmp,{force:true});}catch(_){}throw error;}
 Object.assign(result,{ok:true,release:staged.release,ics:staged.ics,destination:dest,endpoint:cfg.endpoint,configBackup:backup});
}catch(error){result.error=String(error?.message||error);process.exitCode=1;}
console.log(JSON.stringify(result,null,2));
