#!/usr/bin/env node
/* Download only the two official ISO Open Data JSONLines datasets to Vite's same-origin static folder.
 * No public CORS proxy, no credentials and no application-authored data touched.
 */
import { createHash } from 'node:crypto';
import { createWriteStream, existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Readable, Transform } from 'node:stream';
import { fileURLToPath } from 'node:url';

const SOURCES = Object.freeze({
  deliverables: 'https://isopublicstorageprod.blob.core.windows.net/opendata/_latest/iso_deliverables_metadata/json/iso_deliverables_metadata.jsonl',
  committees: 'https://isopublicstorageprod.blob.core.windows.net/opendata/_latest/iso_technical_committees/json/iso_technical_committees.jsonl'
});
const root = resolve(process.argv[2] || resolve(dirname(fileURLToPath(import.meta.url)), '..', '..'));
const out = join(root, 'iso-open-data-cache');
const report = { operation: 'S14-C-ISO-SYNC', repository: root, datasets: [], ok: false };
const MAX_BYTES = 300 * 1024 * 1024;

async function fetchOne(type, url) {
  if (!existsSync(join(root, 'radar.html'))) throw new Error('Le dépôt ne contient pas radar.html : ' + root);
  mkdirSync(out, {recursive:true});
  const name = `${type}.jsonl`, target = join(out, name), tmp = target + '.part';
  rmSync(tmp, {force:true});
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 180000);
  try {
    const response = await fetch(url, {signal: controller.signal, headers: {Accept: 'application/octet-stream,application/x-ndjson,*/*'}});
    if (!response.ok || !response.body) throw new Error(`HTTP ${response.status} pour ${type}`);
    if (new URL(response.url).hostname !== 'isopublicstorageprod.blob.core.windows.net') throw new Error('Hôte de téléchargement inattendu');
    const hash = createHash('sha256'); let bytes = 0;
    await pipeline(Readable.fromWeb(response.body), new Transform({transform(chunk, enc, done) {
      bytes += chunk.length;
      if (bytes > MAX_BYTES) return done(new Error('Jeu ISO trop volumineux (>300 Mio)'));
      hash.update(chunk); done(null, chunk);
    }}), createWriteStream(tmp, {flags:'wx'}));
    if (bytes < 10) throw new Error('Réponse ISO vide');
    const sha256 = hash.digest('hex');
    const first = readFileSync(tmp, 'utf8').slice(0, 2000).trimStart();
    if (!first.startsWith('{')) throw new Error('La réponse ne ressemble pas à du JSONLines');
    renameSync(tmp, target);
    return {type, file:name, bytes, sha256, url};
  } finally {clearTimeout(timer);rmSync(tmp,{force:true});}
}

try {
  const previous = existsSync(join(out,'manifest.json')) ? JSON.parse(readFileSync(join(out,'manifest.json'),'utf8')) : null;
  const results = [];
  for (const [type, url] of Object.entries(SOURCES)) {
    const result = await fetchOne(type, url);
    results.push(result); report.datasets.push({type,bytes:result.bytes,sha256:result.sha256});
  }
  const manifest = {schemaVersion:1,source:'ISO Open Data',license:'ODC-By 1.0',updatedAt:new Date().toISOString(),datasets:results};
  const pending = join(out,'manifest.json.tmp');
  writeFileSync(pending,JSON.stringify(manifest,null,2)+'\n');renameSync(pending,join(out,'manifest.json'));
  report.ok=true; report.manifest=join(out,'manifest.json');
} catch (e) {report.error=String(e?.message||e);process.exitCode=1;}
console.log(JSON.stringify(report,null,2));
