/* S14-I — Optional client for operator-published, static SDO catalog releases.
 * No mandatory endpoint; same origin or a CORS-enabled URL works.
 * Uses existing ISO IndexedDB importer; never modifies app standards/blips.
 */
(function(root){'use strict';
 const isHash=s=>/^[a-f0-9]{64}$/i.test(String(s||''));
 function baseUrl(s){const u=new URL(s,root.location?.href||'http://localhost/');if(!['http:','https:'].includes(u.protocol)||u.username||u.password||u.search||u.hash)throw Error('Adresse de catalogue invalide');return u.href.endsWith('/')?u.href:u.href+'/';}
 function relative(value){if(typeof value!=='string'||!value||value.startsWith('/')||value.includes('\\')||value.split('/').some(x=>x==='..'||x==='.'||!x)||/[:?#]/.test(value))throw Error('Chemin de manifeste non sûr');return value;}
 async function json(url){const r=await fetch(url,{cache:'no-store',credentials:'omit'});if(!r.ok)throw Error('Catalogue HTTP '+r.status);return r.json();}
 async function sha256(buf){if(!root.crypto?.subtle)throw Error('WebCrypto indisponible (HTTPS ou localhost requis)');const bytes=new Uint8Array(await root.crypto.subtle.digest('SHA-256',buf));return [...bytes].map(v=>v.toString(16).padStart(2,'0')).join('');}
 function validateManifest(m){if(m?.schemaVersion!==1||m.catalogId!=='iso'||!Array.isArray(m.datasets))throw Error('Format de catalogue incompatible');const seen=new Set();for(const x of m.datasets){if(!['deliverables','committees'].includes(x.id)||seen.has(x.id)||!isHash(x.sha256)||x.compression!=='gzip'||!Number.isSafeInteger(x.bytes)||x.bytes<1||!Number.isSafeInteger(x.records)||x.records<1)throw Error('Jeu de données incompatible');seen.add(x.id);relative(x.path);}if(seen.size!==2)throw Error('Catalogue incomplet');return m;}
 async function resolveManifest(endpoint){const rootUrl=baseUrl(endpoint),pointer=await json(new URL('manifest.json',rootUrl));if(pointer?.schemaVersion!==1||pointer.catalogId!=='iso')throw Error('Index de catalogue incompatible');const path=relative(pointer.manifest);const manifestUrl=new URL(path,rootUrl);if(manifestUrl.origin!==new URL(rootUrl).origin)throw Error('Origine inattendue');const m=validateManifest(await json(manifestUrl));if(m.release!==pointer.release)throw Error('Version incohérente');return {manifest:m,manifestUrl};}
 async function download(entry,manifestUrl){ /* S14-L5-B HTTP gzip dual-representation integrity */
  const address=new URL(relative(entry.path),manifestUrl);
  const response=await fetch(address,{cache:'no-store',credentials:'omit'});
  if(!response.ok)throw Error('Jeu ISO HTTP '+response.status);
  const bytes=await response.arrayBuffer();
  const digest=await sha256(bytes);
  let raw;
  // The browser's fetch() may transparently decompress a gzip HTTP response.
  // Trust neither Content-Encoding nor file extension; validate actual received bytes.
  if(bytes.byteLength===entry.bytes && digest.toLowerCase()===entry.sha256.toLowerCase()){
    if(typeof root.DecompressionStream!=='function')throw Error('Décompression gzip non disponible dans ce navigateur');
    const stream=new Blob([bytes]).stream().pipeThrough(new root.DecompressionStream('gzip'));
    raw=await new Response(stream).arrayBuffer();
  }else if(Number.isSafeInteger(entry.uncompressedBytes)&&entry.uncompressedBytes>0&&
           isHash(entry.uncompressedSha256)&&
           bytes.byteLength===entry.uncompressedBytes&&
           digest.toLowerCase()===entry.uncompressedSha256.toLowerCase()){
    raw=bytes;
  }else{
    throw Error('Intégrité SHA-256 incorrecte : '+entry.id);
  }
  // In both transport modes, the *uncompressed* payload must match the manifest.
  if(!Number.isSafeInteger(entry.uncompressedBytes)||entry.uncompressedBytes<1||
     !isHash(entry.uncompressedSha256)||raw.byteLength!==entry.uncompressedBytes||
     (await sha256(raw)).toLowerCase()!==entry.uncompressedSha256.toLowerCase()){
    throw Error('Contenu décompressé non conforme : '+entry.id);
  }
  return new Blob([raw],{type:'application/x-ndjson'});
 }
 async function synchronize(endpoint,onProgress){const iso=root.__radarIsoOpenData;if(!iso?.importJsonLines||!iso?.syncInfo)throw Error('Importateur ISO local indisponible');const {manifest,manifestUrl}=await resolveManifest(endpoint);const results=[]; /* S14-K atomic sync */
  // Existing importer updates each dataset independently; preserve last good cache for failed downloads by checking both first.
  const blobs=[];for(const entry of manifest.datasets){onProgress?.('Téléchargement '+entry.id);blobs.push({entry,blob:await download(entry,manifestUrl)});}
  const atomic=root.__radarCatalogAtomic;
  if(typeof atomic?.importPair!=='function')throw Error('Import atomique S14-K indisponible');
  const pair=Object.fromEntries(blobs.map(x=>[x.entry.id,x.blob]));
  const expectedRecords=Object.fromEntries(blobs.map(x=>[x.entry.id,x.entry.records]));
  const activation=await atomic.importPair(pair,{release:manifest.release,expectedRecords,onProgress});
  results.push(...activation.results);
  try{root.localStorage?.setItem('radarCatalogDistributionEndpoint',baseUrl(endpoint));root.localStorage?.setItem('radarCatalogDistributionRelease',manifest.release);}catch(_){}
  return {release:manifest.release,results,source:manifest.source};
 }
 root.__radarCatalogDistribution=Object.freeze({synchronize,resolveManifest,validateManifest});
})(window);
