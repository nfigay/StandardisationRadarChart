#!/usr/bin/env node
/* S14-H: sync explicitly subscribed ISO RSS feeds; never arbitrary URLs. Node 20+. */
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, rename, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
const args=process.argv.slice(2);
const idx=args.indexOf('--repo');
const root=resolve(idx>=0?args[idx+1]:process.cwd());
const folder=join(root,'iso-rss-cache');
const subscriptions=join(folder,'subscriptions.json');
const manifestFile=join(folder,'manifest.json');
const report={operation:'S14-H-RSS-SYNC',repository:root,feeds:[],errors:[],ok:false};
const sha=b=>createHash('sha256').update(b).digest('hex');
export function validUrl(input){
 const u=new URL(input);
 if(u.protocol!=='https:'||u.hostname!=='www.iso.org'||u.username||u.password||u.port||u.search||u.hash||!/^\/cms\/live\/live\/(?:fr|en)\/sites\/isoorg\/contents\/data\/standard\/(?:\d\d\/){2}\d+\.detail\.rss$/.test(u.pathname))throw Error('Flux non autorisé : URL RSS officielle ISO par norme requise');
 return u.href;
}
async function safeWrite(path,content){const temp=path+'.part';await writeFile(temp,content);await rename(temp,path);}
async function main(){
 if(!existsSync(join(root,'radar.html')))throw Error('Dépôt invalide (radar.html absent)');
 await mkdir(folder,{recursive:true});
 const addIdx=args.indexOf('--add');
 let entries=existsSync(subscriptions)?JSON.parse(await readFile(subscriptions,'utf8')).feeds:[];
 if(!Array.isArray(entries))throw Error('subscriptions.json: feeds doit être un tableau');
 entries=entries.map(f=>({url:validUrl(f.url),name:String(f.name||'').slice(0,120)}));
 if(addIdx>=0){
  const url=validUrl(args[addIdx+1]);
  if(!entries.some(e=>e.url===url))entries.push({url,name:''});
  await safeWrite(subscriptions,JSON.stringify({version:1,feeds:entries},null,2)+'\n');
 }
 if(args.includes('--remove')){
  const remIdx=args.indexOf('--remove');const url=validUrl(args[remIdx+1]);entries=entries.filter(e=>e.url!==url);
  await safeWrite(subscriptions,JSON.stringify({version:1,feeds:entries},null,2)+'\n');
 }
 if(entries.length>50)throw Error('Maximum 50 abonnements RSS');
 if(args.includes('--add-only')||args.includes('--remove-only')){report.ok=true;report.subscriptions=entries.length;console.log(JSON.stringify(report,null,2));return;}
 if(!existsSync(subscriptions))await safeWrite(subscriptions,JSON.stringify({version:1,feeds:entries},null,2)+'\n');
 const prev=existsSync(manifestFile)?JSON.parse(await readFile(manifestFile,'utf8')):{feeds:[]};
 const records=[];
 for(const f of entries){
  const filename=sha(f.url).slice(0,24)+'.xml';
  const ctrl=new AbortController();const timer=setTimeout(()=>ctrl.abort(),20000);
  try{
   const response=await fetch(f.url,{signal:ctrl.signal,redirect:'manual',headers:{Accept:'application/rss+xml, application/xml;q=0.9, text/xml;q=0.8'}});
   if(!response.ok||response.status>=300)throw Error('HTTP '+response.status);
   const contentType=response.headers.get('content-type')||'';
   if(!/xml|rss|text\/plain/i.test(contentType))throw Error('Type de réponse inattendu: '+contentType);
   const size=Number(response.headers.get('content-length')||0);if(size>2_000_000)throw Error('Flux trop volumineux');
   const chunks=[];let bytes=0;
   for await(const c of response.body){bytes+=c.byteLength;if(bytes>2_000_000)throw Error('Flux trop volumineux');chunks.push(Buffer.from(c));}
   const buf=Buffer.concat(chunks);const content=buf.toString('utf8');
   if(!/<(?:rss\b|feed\b)/i.test(content.slice(0,1000)))throw Error('Réponse non RSS/Atom');
   await safeWrite(join(folder,filename),buf);
   const record={url:f.url,name:f.name,file:filename,bytes,sha256:sha(buf),fetchedAt:new Date().toISOString()};records.push(record);
   report.feeds.push({url:f.url,bytes,ok:true});
  }catch(e){
   const previous=(prev.feeds||[]).find(x=>x.url===f.url);
   if(previous&&existsSync(join(folder,previous.file)))records.push(previous);
   report.errors.push({url:f.url,error:String(e.message||e)});report.feeds.push({url:f.url,ok:false});
  }finally{clearTimeout(timer);}
 }
 await safeWrite(manifestFile,JSON.stringify({version:1,source:'ISO RSS',updatedAt:new Date().toISOString(),feeds:records},null,2)+'\n');
 report.ok=report.errors.length===0;report.subscriptions=entries.length;report.manifest=manifestFile;
 console.log(JSON.stringify(report,null,2));if(!report.ok)process.exitCode=1;
}
main().catch(e=>{report.errors.push({error:String(e.message||e)});console.log(JSON.stringify(report,null,2));process.exitCode=1;});
