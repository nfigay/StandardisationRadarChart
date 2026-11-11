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
 async function download(entry,manifestUrl){const address=new URL(relative(entry.path),manifestUrl);const response=await fetch(address,{cache:'no-store',credentials:'omit'});if(!response.ok)throw Error('Jeu ISO HTTP '+response.status);const packed=await response.arrayBuffer();if(packed.byteLength!==entry.bytes||await sha256(packed)!==entry.sha256)throw Error('Intégrité SHA-256 incorrecte : '+entry.id);if(typeof root.DecompressionStream!=='function')throw Error('Décompression gzip non disponible dans ce navigateur');const stream=new Blob([packed]).stream().pipeThrough(new root.DecompressionStream('gzip'));const data=await new Response(stream).blob();if(entry.uncompressedSha256&&await sha256(await data.arrayBuffer())!==entry.uncompressedSha256)throw Error('Contenu décompressé non conforme : '+entry.id);return data;}
 async function synchronize(endpoint,onProgress){const iso=root.__radarIsoOpenData;if(!iso?.importJsonLines||!iso?.syncInfo)throw Error('Importateur ISO local indisponible');const {manifest,manifestUrl}=await resolveManifest(endpoint);const sync=await iso.syncInfo();const results=[];
  // Existing importer updates each dataset independently; preserve last good cache for failed downloads by checking both first.
  const blobs=[];for(const entry of manifest.datasets){onProgress?.('Téléchargement '+entry.id);blobs.push({entry,blob:await download(entry,manifestUrl)});}
  for(const {entry,blob} of blobs){onProgress?.('Import '+entry.id);const result=await iso.importJsonLines(entry.id,blob,n=>onProgress?.(entry.id+' : '+n));results.push(result);}
  try{root.localStorage?.setItem('radarCatalogDistributionEndpoint',baseUrl(endpoint));root.localStorage?.setItem('radarCatalogDistributionRelease',manifest.release);}catch(_){}
  return {release:manifest.release,results,source:manifest.source};
 }
 root.__radarCatalogDistribution=Object.freeze({synchronize,resolveManifest,validateManifest});
})(window);
