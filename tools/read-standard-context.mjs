/* S16-A-R1: explicit read-only documentary discovery. No repo/cache writes. */
import '../js/radar-standard-sources.js';
const api=globalThis.__radarStandardSources;
const [command,key,...extra]=process.argv.slice(2);
try {
  if(extra.length)throw Error('Unexpected argument');
  let result;
  if(command==='--list'&&key===undefined)result={resources:api.listResources(),concepts:api.knowledgeConcepts};
  else if(command==='--rfc'&&key)result=await api.readRfcContext(key);
  else throw Error('Usage: node tools/read-standard-context.mjs --list | --rfc <number>');
  console.log(JSON.stringify({operation:'S16-DOCUMENTARY-CONTEXT',ok:true,...result},null,2));
} catch(error){console.log(JSON.stringify({operation:'S16-DOCUMENTARY-CONTEXT',ok:false,error:error.message},null,2));process.exitCode=1;}
