export function patchDistribution(source) {
  const marker = '/* S14-L5-B HTTP gzip dual-representation integrity */';
  if (source.includes(marker)) return { source, changed: false };
  if (!source.includes('/* S14-K atomic sync */') || !source.includes('atomic.importPair')) throw Error('Synchronisation atomique S14-K requise');
  const start = 'async function download(entry,manifestUrl){';
  const end = '\n async function synchronize(endpoint,onProgress){';
  const parts = source.split(start);
  if (parts.length !== 2 || !parts[1].includes(end)) throw Error('Ancrage download non trouvé ou ambigu');
  const [oldBody, after] = parts[1].split(end);
  if (after === undefined || !oldBody.includes('DecompressionStream') || !oldBody.includes("'Intégrité SHA-256 incorrecte : '")) {
    throw Error('Version de download incompatible avec le correctif');
  }
  const replacement = `async function download(entry,manifestUrl){ ${marker}
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
 }`;
  return { source:parts[0]+replacement+end+after,changed:true };
}
