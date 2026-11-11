#!/usr/bin/env node
/** Read-only audit of operator-published catalog bytes on disk and over HTTP.
 * Node.js >=20. Does not alter any catalog or IndexedDB data.
 */
import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const safe = value => typeof value === 'string' && value.length > 0 && !value.startsWith('/') && !value.includes('\\') && !value.split('/').some(x=>!x||x==='.'||x==='..') && !/[:?#]/.test(value);
const positive = n => Number.isSafeInteger(n) && n > 0;
const looksHash = s => /^[a-f0-9]{64}$/i.test(String(s));
function parseArgs(argv) {
  const opts={};
  for(let i=0;i<argv.length;i++) {
    if(!['--repo','--endpoint'].includes(argv[i]) || !argv[i+1] || argv[i+1].startsWith('--'))throw Error('Usage: --repo PATH [--endpoint http://127.0.0.1:PORT/catalog-distribution/]');
    opts[argv[i].slice(2)]=argv[++i];
  }
  return opts;
}
async function readJson(path){return JSON.parse(await readFile(path,'utf8'));}
function validatePointer(pointer){if(pointer?.schemaVersion!==1 || pointer.catalogId!=='iso' || !safe(pointer.manifest))throw Error('Pointeur du catalogue incompatible');return pointer;}
function validateManifest(m,pointer){
  if(m?.schemaVersion!==1 || m.catalogId!=='iso' || m.release!==pointer.release || !Array.isArray(m.datasets))throw Error('Manifeste de release incompatible');
  const ids=new Set();for(const d of m.datasets){if(!safe(d.path)||!looksHash(d.sha256)||!positive(d.bytes)||!positive(d.records)||!['deliverables','committees','ics'].includes(d.id)||ids.has(d.id))throw Error('Entrée du jeu de données invalide');ids.add(d.id);}
  if(!ids.has('deliverables')||!ids.has('committees'))throw Error('Catalogue incomplet');return m;
}
function check(bytes,entry){return {bytes:bytes.length,sha256:sha(bytes),matches:bytes.length===entry.bytes && sha(bytes)===entry.sha256};}
async function get(url){const response=await fetch(url,{cache:'no-store',redirect:'error'});if(!response.ok)throw Error(`HTTP ${response.status} (${url})`);return {body:Buffer.from(await response.arrayBuffer()),contentEncoding:response.headers.get('content-encoding'),contentType:response.headers.get('content-type')};}
function joinUrl(base,path){const u=new URL(path,base);if(u.origin!==new URL(base).origin)throw Error('Origine HTTP inattendue');return u.href;}
export async function audit({repo,endpoint}){
  const root=resolve(repo||process.cwd()), dist=join(root,'catalog-distribution');
  const pointer=validatePointer(await readJson(join(dist,'manifest.json')));
  const manifest=validateManifest(await readJson(join(dist,pointer.manifest)),pointer);
  const releaseBase=dirname(join(dist,pointer.manifest));
  const result={operation:'S14-L5-A-CATALOG-AUDIT',repository:root,release:pointer.release,endpoint:endpoint||null,datasets:[],ok:true};
  let urlBase;
  if(endpoint){const url=new URL(endpoint);if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.search||url.hash)throw Error('URL de service invalide');urlBase=url.href.endsWith('/')?url.href:url.href+'/';}
  for(const entry of manifest.datasets){
    const file=join(releaseBase,entry.path);const bytes=await readFile(file);const disk=check(bytes,entry);
    const item={id:entry.id,expected:{bytes:entry.bytes,sha256:entry.sha256},disk};
    if(!disk.matches) {item.issue='DISK_MANIFEST_MISMATCH';result.ok=false;}
    if(urlBase){
      try{
        const url=joinUrl(urlBase,pointer.manifest.replace(/manifest\.json$/,entry.path));
        const response=await get(url);item.http={url,contentEncoding:response.contentEncoding,contentType:response.contentType,...check(response.body,entry)};
        if(!item.http.matches){
          result.ok=false;
          item.issue= response.contentEncoding?.includes('gzip') ? 'HTTP_AUTOMATIC_DECOMPRESSION_POSSIBLE' : 'HTTP_MANIFEST_MISMATCH';
        }
      }catch(e){result.ok=false;item.http={error:e.message};item.issue='HTTP_FAILURE';}
    }
    result.datasets.push(item);
  }
  return result;
}
if(process.argv[1] && pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
  try{const r=await audit(parseArgs(process.argv.slice(2)));console.log(JSON.stringify(r,null,2));if(!r.ok)process.exitCode=2;}
  catch(e){console.log(JSON.stringify({operation:'S14-L5-A-CATALOG-AUDIT',ok:false,error:e.message},null,2));process.exitCode=1;}
}
