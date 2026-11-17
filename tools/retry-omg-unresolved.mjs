#!/usr/bin/env node
// S16 C5-R2: retry unresolved OMG families without modifying prior checkpoints.
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import assert from 'node:assert/strict';
import {sourceApi} from './prepare-omg-public-links.mjs';
import {discoverFamilies,collectBatch} from './collect-omg-family-histories.mjs';

export function unresolvedFromCoverage(root, snapshot, api){
 const checkpoint=JSON.parse(readFileSync(join(root,'checkpoint.json'),'utf8'));
 const coverage=JSON.parse(readFileSync(join(root,'coverage.json'),'utf8'));
 const families=discoverFamilies(snapshot,api);
 assert.deepEqual(checkpoint.families,families,'Catalog families differ from checkpoint');
 assert.equal(coverage.catalogFamilies,families.length,'Catalog total differs');
 assert.equal(coverage.remainingFamilies,0,'Coverage has unfinished batches');
 const unresolved=[];
 for(let i=1;i<=coverage.batches;i++){
  const filename=join(root,'batch-'+String(i).padStart(4,'0'),'report.json');
  const report=JSON.parse(readFileSync(filename,'utf8'));
  for(const entry of report.results)if(entry.state==='unresolved')unresolved.push(entry.family);
 }
 assert.equal(unresolved.length,coverage.unresolvedFamilies,'Exception count differs');
 assert.equal(new Set(unresolved).size,unresolved.length,'Duplicate family');
 return unresolved;
}
export async function retryUnresolved({api,snapshot,coverageDir,out,families,fetcher=fetch,sleep,delayMs=500}){
 const unresolved=unresolvedFromCoverage(coverageDir,snapshot,api);
 const selected=families?.length?families:unresolved;
 assert.ok(selected.length>0&&selected.length<=20,'Select 1..20 unresolved families');
 assert.equal(new Set(selected).size,selected.length,'Duplicate family');
 for(const family of selected)assert.ok(unresolved.includes(family),'Not an unresolved checkpoint family: '+family);
 if(existsSync(out))throw Error('Refuse existing retry directory');
 const result=await collectBatch({api,snapshot,families:selected,out,fetcher,sleep,delayMs});
 const reconciliation={operation:'S16-C5-R2-RETRY-RECONCILIATION',previousUnresolved:unresolved.length,selected:selected.length,nowVerified:result.verifiedFamilies,nowInProcessOnly:result.inProcessOnlyFamilies,stillUnresolved:result.unresolvedFamilies,originalCoverageUnmodified:true,publication:false,results:result.results};
 writeFileSync(join(out,'reconciliation.json'),JSON.stringify(reconciliation,null,2)+'\n',{flag:'wx'});
 return reconciliation;
}
export function parseRetryOptions(args){const out={families:[]};for(let i=0;i<args.length;i++){const a=args[i];if(['--catalog','--coverage','--out','--family'].includes(a)){const v=args[++i];if(!v||v.startsWith('--'))throw Error('Missing '+a);if(a==='--family')out.families.push(v);else out[a.slice(2)]=v;}else throw Error('Unknown flag: '+a);}if(!out.catalog||!out.coverage||!out.out)throw Error('Usage: --catalog PATH --coverage PATH --out NEW_PRIVATE_DIRECTORY [--family ID ...]');return out;}
if(process.argv[1]&&resolve(process.argv[1])===resolve(new URL(import.meta.url).pathname)){
 try{const opts=parseRetryOptions(process.argv.slice(2));const api=sourceApi(readFileSync('js/radar-standard-sources.js','utf8'));const snapshot=JSON.parse(readFileSync(opts.catalog,'utf8'));const result=await retryUnresolved({api,snapshot,coverageDir:resolve(opts.coverage),out:resolve(opts.out),families:opts.families});console.log(JSON.stringify(result,null,2));if(result.stillUnresolved)process.exitCode=2;}catch(e){console.error('S16-C5-R2 ERROR: '+e.message);process.exitCode=1;}
}
