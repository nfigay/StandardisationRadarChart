import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash, webcrypto } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import vm from 'node:vm';
import { patchDistribution } from '../tools/radar-s14-l5-b-patch.mjs';
const fixture=new URL('../js/radar-catalog-distribution.js',import.meta.url);
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
async function testDownload(source,payload,manifestEntry){
 const window={crypto:webcrypto,DecompressionStream};
 const context={window,Blob,Response,DecompressionStream,Uint8Array,URL,
  fetch:async()=>({ok:true,arrayBuffer:async()=>Uint8Array.from(payload).buffer})};
 vm.runInNewContext(source.replace('root.__radarCatalogDistribution=Object.freeze(', 'root.__testDownload=download;root.__radarCatalogDistribution=Object.freeze('),context);
 return context.window.__testDownload(manifestEntry,'http://localhost/catalog/releases/v1/manifest.json');
}
const raw=Buffer.from('{"id":"iso1","reference":"ISO 1"}\n');
const packed=gzipSync(raw);
const entry={id:'deliverables',path:'deliverables.jsonl.gz',bytes:packed.length,sha256:hash(packed),uncompressedBytes:raw.length,uncompressedSha256:hash(raw)};
test('patch idempotent et non destructif',async()=>{
 const src=await readFile(fixture,'utf8'); const once=patchDistribution(src);
 assert.equal(patchDistribution(once.source).changed,false);
 assert.match(once.source,/atomic\.importPair/);
});
test('fichier gzip intact est validé puis décompressé',async()=>{
 const src=(await readFile(fixture,'utf8'));const blob=await testDownload(patchDistribution(src).source,packed,entry);
 assert.equal(Buffer.from(await blob.arrayBuffer()).toString(),raw.toString());
});
test('HTTP déjà décompressé valide avec la seconde empreinte',async()=>{
 const src=(await readFile(fixture,'utf8'));const blob=await testDownload(patchDistribution(src).source,raw,entry);
 assert.equal(Buffer.from(await blob.arrayBuffer()).toString(),raw.toString());
});
test('contenu corrompu refusé dans les deux représentations',async()=>{
 const src=(await readFile(fixture,'utf8'));const script=patchDistribution(src).source;
 await assert.rejects(testDownload(script,Buffer.from('corrupted'),entry),/Intégrité SHA-256/);
 await assert.rejects(testDownload(script,raw,{...entry,uncompressedSha256:'f'.repeat(64)}),/Intégrité SHA-256/);
});
test('ancienne version de code incompatible refusée',()=>assert.throws(()=>patchDistribution('code'),/Synchronisation atomique|Ancrage/));
