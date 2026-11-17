/* S16-A-R3.1 — local Creator only. A fixed public-index collector, not a proxy.
 * Never stores raw HTML, credentials, rights files or native catalogue data.
 * Public metadata access does not establish a license to redistribute the corpus.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import '../js/radar-standard-sources.js';

const api=globalThis.__radarStandardSources;
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const OMG_CURRENT=path.join(os.homedir(),'Documents','StandardizationRadarChart-Audits','S16-OMG-Current.json');
export const OMG_RELAY_PREFIX='/__radar-omg/catalog/';
const OP='S16-OMG-LOCAL-RELAY',LIMIT=api.omg.LIMIT;

async function outsideDirectory(dir,create=false){
  const lexical=path.resolve(dir);
  if(lexical===ROOT||lexical.startsWith(ROOT+path.sep))throw Error('OMG private corpus must be outside repository');
  if(create)await fs.mkdir(dir,{recursive:true,mode:0o700});
  const real=await fs.realpath(dir),repo=await fs.realpath(ROOT);
  if(real===repo||real.startsWith(repo+path.sep))throw Error('OMG private corpus must be outside repository');
  if(!(await fs.stat(real)).isDirectory())throw Error('Invalid private corpus directory');
  return real;
}
async function privateTarget(file,create=false){
  const full=path.resolve(file),parent=await outsideDirectory(path.dirname(full),create),target=path.join(parent,path.basename(full));
  try{const s=await fs.lstat(target);if(!s.isFile()||s.isSymbolicLink())throw Error('Invalid private corpus file');}catch(e){if(e.code!=='ENOENT')throw e;}
  return target;
}
async function writeCurrent(file,bytes){
  const target=await privateTarget(file,true),temp=path.join(path.dirname(target),'.omg-'+randomUUID()+'.tmp');
  try{await fs.writeFile(temp,bytes,{mode:0o600,flag:'wx'});await fs.rename(temp,target);}finally{await fs.rm(temp,{force:true});}
  return target;
}
export async function readPreparedOmg({cacheFile=OMG_CURRENT}={}){
  const file=await privateTarget(cacheFile),stat=await fs.stat(file);
  if(stat.size>LIMIT)throw Error('Prepared OMG corpus exceeds size limit');
  const raw=await fs.readFile(file);if(raw.length>LIMIT)throw Error('Prepared OMG corpus exceeds size limit');
  const snapshot=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(raw));
  api.validateOmgOnlineSnapshot(snapshot);if(!snapshot.provenance.sha256)throw Error('Prepared OMG corpus lacks source digest');return snapshot;
}
export async function collectOmgCurrent({cacheFile=OMG_CURRENT,outputParent=null,fetcher=globalThis.fetch}={}){
  // Resolve private destinations before network I/O; no write under the Git tree.
  const target=await privateTarget(cacheFile,true);
  const audit=outputParent?await outsideDirectory(outputParent):null;
  const snapshot=await api.readOmgPublicCatalog({fetcher:(url,opts)=>fetcher(url,{...opts,headers:{...opts.headers,'User-Agent':'StandardizationRadarChart-DocumentaryResearch/1.0 (public catalog index)'}})});
  if(!snapshot.provenance.sha256)throw Error('OMG source digest unavailable');
  const bytes=JSON.stringify(snapshot,null,2)+'\n';
  if(Buffer.byteLength(bytes)>LIMIT)throw Error('Normalized OMG corpus exceeds size limit');
  let auditFile=null;
  if(audit){auditFile=path.join(audit,'omg-catalog.json');await fs.writeFile(auditFile,bytes,{mode:0o600,flag:'wx'});}
  const current=await writeCurrent(target,bytes);
  return {snapshot,current,auditFile};
}
function loopback(req){
  if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket?.remoteAddress))return false;
  const host=req.headers?.host;
  if(typeof host!=='string'||!/^(?:127\.0\.0\.1|localhost|\[::1\])(?::[0-9]{1,5})?$/i.test(host))return false;
  try{const origin=new URL(req.headers.origin);return ['http:','https:'].includes(origin.protocol)&&origin.origin===req.headers.origin&&origin.host.toLowerCase()===host.toLowerCase()&&(!req.headers['sec-fetch-site']||req.headers['sec-fetch-site']==='same-origin');}catch(_){return false;}
}
export function createOmgRelayMiddleware({cacheFile=OMG_CURRENT,fetcher=globalThis.fetch,minIntervalMs=15000,clock=Date.now}={}){
  let busy=false,lastIndexAttempt=null,lastHistoryAttempt=null;
  function send(res,status,payload){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.end(JSON.stringify({operation:OP,...payload}));}
  return async function omgRelay(req,res,next){
    const url=req.url||'';if(!url.startsWith(OMG_RELAY_PREFIX))return next();
    if(!loopback(req)||req.method!=='POST'||req.headers['x-radar-documentary']!=='omg-index-v1'||req.headers['transfer-encoding']||Number(req.headers['content-length']||0)!==0){send(res,403,{ok:false,error:'Local same-origin Creator request required'});return;}
    const action=url.slice(OMG_RELAY_PREFIX.length);
    if(action.startsWith('history/')){
      // Accept only a family present in the locally qualified official index.
      // No user-controlled host, path traversal, version page or arbitrary URL proxy.
      let family;
      try{
        const suffix=action.slice('history/'.length);
        if(!suffix||suffix.includes('/')||/%(?:25|5c|00)/i.test(suffix))throw Error('Invalid family path encoding');
        family=decodeURIComponent(suffix);
        if(encodeURIComponent(family)!==suffix)throw Error('Noncanonical family encoding');
        const official=api.omg.familyUrl(family);
        const stored=await readPreparedOmg({cacheFile});
        if(!stored.records.some(r=>r.acronym===family))throw Error('Family absent from official catalog');
      }catch(e){send(res,422,{ok:false,error:String(e.message||e)});return;}
      const t=clock();if(busy||lastHistoryAttempt!==null&&t-lastHistoryAttempt<minIntervalMs){send(res,429,{ok:false,error:'OMG acquisition already running or requested too recently'});return;}
      busy=true;lastHistoryAttempt=t;
      try{
        const snapshot=await api.readOmgHistory(family,{fetcher});
        api.validateOmgHistory(snapshot,family);
        send(res,200,{ok:true,snapshot});
      }catch(e){send(res,502,{ok:false,error:String(e.message||e)});}finally{busy=false;}
      return;
    }
    if(!['current','refresh'].includes(action)){send(res,404,{ok:false,error:'Unknown OMG catalog action'});return;}
    if(action==='current'){
      try{const snapshot=await readPreparedOmg({cacheFile});send(res,200,{ok:true,snapshot});}catch(e){send(res,e.code==='ENOENT'?404:422,{ok:false,error:e.code==='ENOENT'?'No prepared OMG corpus — use Refresh OMG online':String(e.message||e)});}return;
    }
    const t=clock();if(busy||lastIndexAttempt!==null&&t-lastIndexAttempt<minIntervalMs){send(res,429,{ok:false,error:'OMG acquisition already running or requested too recently'});return;}
    busy=true;lastIndexAttempt=t;
    try{const {snapshot}=await collectOmgCurrent({cacheFile,fetcher});send(res,200,{ok:true,snapshot});}
    catch(e){send(res,502,{ok:false,error:String(e.message||e)});}finally{busy=false;}
  };
}
export function omgLocalBridge(options={}){
  return {name:'radar-omg-local-catalog',apply:'serve',configureServer(server){server.middlewares.use(createOmgRelayMiddleware(options));}};
}
