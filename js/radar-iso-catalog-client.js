/* S14-S: app-facing catalog client. Static, configurable distribution; no operator collection. */
(function(root){
 'use strict';
 // A8.1-R5: virtual HTTPS endpoint resolved by the embedded fetch adapter.
 const STANDALONE_ENDPOINT='https://standalone.invalid/StandardisationRadarChart/catalog-distribution/';
 function validatedBase(input){
   if(root.__radarStandalone?.profile==='creator' &&
      root.location.protocol==='file:'){
     if(input==='./catalog-distribution/' || input===STANDALONE_ENDPOINT)
       return STANDALONE_ENDPOINT;
     throw Error('Standalone catalog endpoint must use the embedded distribution');
   }
   const u=new URL(input,root.location.href);if(!['https:','http:'].includes(u.protocol)||u.username||u.password||u.search||u.hash)throw Error('Invalid catalog endpoint');
   if(u.protocol==='http:'&&!['localhost','127.0.0.1','[::1]'].includes(u.hostname))throw Error('Remote catalogs require HTTPS');
   return u.href.endsWith('/')?u.href:u.href+'/';}
 function safePath(s){if(typeof s!=='string'||!s||s.startsWith('/')||s.includes('\\')||s.split('/').some(p=>!p||p==='.'||p==='..')||/[?#:]/.test(s))throw Error('Unsafe catalog resource path');return s;}
 async function json(url,{optional=false}={}){const r=await fetch(url,{credentials:'omit',cache:'no-store'});if(optional&&r.status===404)return null;
   if(!r.ok)throw Error('Catalog HTTP '+r.status+' at '+url);
   const contentType=r.headers.get('content-type')||'';if(contentType.includes('html')){if(optional)return null;throw Error('Server returned HTML instead of catalog JSON: '+url);}
   const text=await r.text();if(text.trimStart().startsWith('<')){if(optional)return null;throw Error('Catalog JSON resource resolved to HTML: '+url);}
   try{return JSON.parse(text);}catch(e){throw Error('Invalid catalog JSON at '+url+': '+e.message);}}
 async function configuredEndpoint(){const conf=await json(new URL('./radar-catalog-config.json',root.location.href));if(conf?.schemaVersion!==1||typeof conf.endpoint!=='string')throw Error('Invalid radar-catalog-config.json');return validatedBase(conf.endpoint);}
 async function sync({endpoint,onProgress,signal}={}){
   const base=validatedBase(endpoint||await configuredEndpoint());
   if(!root.__radarIsoWindowed?.current||!root.__radarIsoStreamDistribution?.importEndpoint)throw Error('S14-M streaming modules not loaded');
   const pointer=await json(new URL('manifest.json',base));if(pointer?.schemaVersion!==1||pointer.catalogId!=='iso'||typeof pointer.release!=='string')throw Error('Invalid ISO catalog pointer');
   const prior=await root.__radarIsoWindowed.current();
   const report={operation:'S14-S-CATALOG-SYNC',endpoint:base,release:pointer.release,iso:{status:'unchanged'},ics:{status:'not-published'},warnings:[]};
   if(prior?.summary?.release!==pointer.release){
     const result=await root.__radarIsoStreamDistribution.importEndpoint(base,{expectedRelease:pointer.release,signal,onProgress:p=>onProgress?.({dataset:'iso',...p})});
     report.iso={status:'updated',datasets:result.datasets};
   }
   const icsRoot=new URL('extensions/ics/',base);
   const icsPointer=await json(new URL('manifest.json',icsRoot),{optional:true});
   if(!icsPointer)return report;
   if(icsPointer.schemaVersion!==1||icsPointer.kind!=='ics-extension-pointer'||icsPointer.catalogRelease!==pointer.release)throw Error('ICS extension pointer does not match ISO release');
   const manifestUrl=new URL(safePath(icsPointer.manifest),icsRoot);if(manifestUrl.origin!==icsRoot.origin)throw Error('ICS extension origin mismatch');
   const manifest=await json(manifestUrl),entry=manifest?.datasets?.[0];
   if(manifest?.schemaVersion!==1||manifest.kind!=='ics-extension'||manifest.release!==icsPointer.release||manifest.datasets.length!==1||entry?.id!=='ics'||entry.compression!=='gzip'||!Number.isSafeInteger(entry.records)||entry.records<1||!Number.isSafeInteger(entry.bytes)||!Number.isSafeInteger(entry.uncompressedBytes)||!(/^[a-f0-9]{64}$/i.test(entry.sha256))||!(/^[a-f0-9]{64}$/i.test(entry.uncompressedSha256)))throw Error('Invalid ICS extension manifest');
   const path=new URL(safePath(entry.path),manifestUrl);if(path.origin!==manifestUrl.origin)throw Error('ICS dataset origin mismatch');
   if(!root.__radarIsoIcsExtension?.importStream)throw Error('ICS extension storage module missing');
   try{report.ics=await root.__radarIsoIcsExtension.importStream({entry,release:manifest.release,signal,onProgress:p=>onProgress?.({dataset:'ics',...p}),openStream:async()=>{
       const r=await fetch(path,{credentials:'omit',cache:'no-store',signal});if(!r.ok||!r.body)throw Error('ICS HTTP '+r.status);return r.body;
   }});}catch(e){report.ics={status:'error',message:String(e?.message??e)};report.warnings.push('ICS extension was not installed; previous taxonomy retained');}
   return report;
 }
 root.__radarIsoCatalogClient=Object.freeze({sync,configuredEndpoint,validatedBase,safePath});
 if(typeof module!=='undefined'&&module.exports)module.exports=root.__radarIsoCatalogClient;
})(typeof window!=='undefined'?window:globalThis);
