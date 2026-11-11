import {
  readFileSync,writeFileSync,existsSync
} from 'node:fs';

import {
  createPublishedRoadmapProjection
} from '../src/domain/roadmap-published-projection.mjs';

// Explicit CLI only; never auto-export a draft or a live graph.
const [input,revisionId,output]=process.argv.slice(2);

if(!input || !revisionId || !output){
  console.error('Usage: node scripts/export-roadmap-client.mjs '+
    '<catalogue.json> <revisionId> <roadmap-client.json>');
  process.exitCode=2;
}else{
  try{
    if(existsSync(output)){
      throw Error('output already exists; refusing overwrite');
    }

    const source=JSON.parse(readFileSync(input,'utf8'));

    // Native catalogue JSON or verified-artifact container.
    // This CLI does not verify an artifact cryptographic proof.
    const catalog=source?.artifact?.data ?? source;

    const result=createPublishedRoadmapProjection(
      catalog,revisionId
    );

    const data=JSON.stringify(result,null,2)+'\n';
    writeFileSync(output,data,{flag:'wx'});
    console.log('Published revision:',revisionId);
    console.log('Roadmap blips:',result.blips.length);
    console.log('Included standards:',result.standards.length);
    console.log('Output:',output);
  }catch(error){
    console.error('Export refused:',error.message);
    process.exitCode=1;
  }
}
