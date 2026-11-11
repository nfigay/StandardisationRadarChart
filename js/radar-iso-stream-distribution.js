/* S14-M remote catalog streaming, opt-in. Never invokes legacy readAll importer. */
(function(root){
 'use strict';
 const cleanPath=p=>{if(typeof p!=='string'||!p||p[0]==='/'||p.includes('\\')||p.split('/').some(s=>!s||s==='.'||s==='..')||/[?#:]/.test(p))throw Error('Unsafe catalog path');return p;};
 const endpointUrl=s=>{const u=new URL(s,root.location?.href||'http://localhost/');if(!['https:','http:'].includes(u.protocol)||u.username||u.password||u.search||u.hash)throw Error('Invalid endpoint');return u.href.endsWith('/')?u.href:u.href+'/';};
 async function getJson(url){const response=await fetch(url,{cache:'no-store',credentials:'omit'});if(!response.ok)throw Error('Catalog HTTP '+response.status);const type=response.headers.get('content-type')||'';if(type.includes('text/html'))throw Error('Catalog returned HTML instead of JSON');return response.json();}
 async function importEndpoint(endpoint,{onProgress,signal,expectedRelease}={}){
   if(!root.__radarIsoWindowed||!root.__radarIsoOpenData?.normalize)throw Error('ISO streaming modules not initialized');
   const base=endpointUrl(endpoint),ptr=await getJson(new URL('manifest.json',base));
   if(ptr?.schemaVersion!==1||ptr.catalogId!=='iso')throw Error('Invalid catalog pointer');
   const manifestUrl=new URL(cleanPath(ptr.manifest),base);if(manifestUrl.origin!==new URL(base).origin)throw Error('Unexpected catalog origin');
   const manifest=await getJson(manifestUrl);
   if(manifest?.schemaVersion!==1||manifest.catalogId!=='iso'||manifest.release!==ptr.release||!Array.isArray(manifest.datasets))throw Error('Incompatible catalog manifest');
   if(expectedRelease&&expectedRelease!==manifest.release)throw Error('Unexpected release');
   const datasets=[];const ids=new Set();
   for(const entry of manifest.datasets){
     if(!['deliverables','committees'].includes(entry.id)||ids.has(entry.id)||!/^([a-f0-9]{64})$/i.test(entry.sha256)||!/^([a-f0-9]{64})$/i.test(entry.uncompressedSha256)||!Number.isSafeInteger(entry.bytes)||entry.bytes<1||!Number.isSafeInteger(entry.uncompressedBytes)||entry.uncompressedBytes<1||!Number.isSafeInteger(entry.records)||entry.records<1)throw Error('Invalid dataset manifest');
     ids.add(entry.id);const url=new URL(cleanPath(entry.path),manifestUrl);if(url.origin!==manifestUrl.origin)throw Error('Unexpected data origin');
     datasets.push({type:entry.id,entry,async openStream(){
       const response=await fetch(url,{signal,cache:'no-store',credentials:'omit'});
       if(!response.ok||!response.body)throw Error('Dataset HTTP '+response.status);
       return response.body;
     }});
   }
   if(ids.size!==2)throw Error('Incomplete ISO catalog');
   return root.__radarIsoWindowed.importRelease({release:manifest.release,datasets,onProgress,signal,normalize:(type,raw)=>root.__radarIsoOpenData.normalize(type,raw)});
 }
 root.__radarIsoStreamDistribution=Object.freeze({importEndpoint});
})(typeof window!=='undefined'?window:globalThis);
