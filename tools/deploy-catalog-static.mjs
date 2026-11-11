#!/usr/bin/env node
/** Stage an immutable, verified catalog release for any static HTTPS host.
 * No external dependencies, network or app/radar mutation. Node >= 20.
 */
import { createHash } from 'node:crypto';
import { createReadStream, createWriteStream, existsSync, mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { createGunzip } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const sha = /^[0-9a-f]{64}$/i;
const rel = /^[0-9]{4}-[0-9]{2}-[0-9]{2}(?:[.-][A-Za-z0-9_-]+)?$/;
function safePath(s){if(typeof s!=='string'||!s||s.startsWith('/')||s.includes('\\')||/[:?#]/.test(s)||s.split('/').some(x=>!x||x==='.'||x==='..'))throw Error('Chemin non sûr : '+s);return s;}
function json(path){return JSON.parse(readFileSync(path,'utf8'));}
function parse(argv){const o={};for(let i=0;i<argv.length;i++){if(!['--repo','--out'].includes(argv[i])||!argv[i+1]||argv[i+1].startsWith('--'))throw Error('Usage: --repo <dépôt> --out <dossier-nouveau>');o[argv[i].slice(2)]=argv[++i];}if(!o.out)throw Error('Option --out obligatoire');return o;}
async function hashFile(path){const h=createHash('sha256');let bytes=0;for await(const b of createReadStream(path)){h.update(b);bytes+=b.length;}return {bytes,sha256:h.digest('hex')};}
async function hashGunzip(path){const input=createReadStream(path).pipe(createGunzip());const h=createHash('sha256');let bytes=0;for await(const b of input){h.update(b);bytes+=b.length;}return {bytes,sha256:h.digest('hex')};}
function match(result,expectedSize,expectedHash,label){if(result.bytes!==expectedSize||result.sha256!==expectedHash)throw Error('Contrôle SHA-256/taille échoué : '+label);}
export async function stage({repo,out}){
 const origin=resolve(repo),source=join(origin,'catalog-distribution'),dest=resolve(out);
 if(dest===origin||dest===source||dest.startsWith(source+'/')||source.startsWith(dest+'/'))throw Error('Sortie non indépendante de la publication source');
 if(existsSync(dest))throw Error('Destination existante (publication sans écrasement) : '+dest);
 const pointer=json(join(source,'manifest.json'));
 if(pointer.schemaVersion!==1||pointer.catalogId!=='iso'||!rel.test(pointer.release)||pointer.manifest!==`releases/${pointer.release}/manifest.json`)throw Error('Manifeste racine incompatible');
 const releaseDir=join(source,'releases',pointer.release),manifest=json(join(releaseDir,'manifest.json'));
 if(manifest.schemaVersion!==1||manifest.catalogId!=='iso'||manifest.release!==pointer.release||!Array.isArray(manifest.datasets))throw Error('Manifeste de version incompatible');
 const ids=new Set(),files=[];
 for(const entry of manifest.datasets){
  if(!['deliverables','committees'].includes(entry.id)||ids.has(entry.id)||entry.path!==`${entry.id}.jsonl.gz`||entry.compression!=='gzip'||!sha.test(entry.sha256)||!sha.test(entry.uncompressedSha256)||!Number.isSafeInteger(entry.bytes)||entry.bytes<=0||!Number.isSafeInteger(entry.uncompressedBytes)||entry.uncompressedBytes<=0)throw Error('Jeu incompatible');
  ids.add(entry.id);const file=join(releaseDir,safePath(entry.path));if(!statSync(file).isFile())throw Error('Fichier non régulier');
  match(await hashFile(file),entry.bytes,entry.sha256,entry.id+' compressé');
  match(await hashGunzip(file),entry.uncompressedBytes,entry.uncompressedSha256,entry.id+' décompressé');
  files.push({id:entry.id,bytes:entry.bytes,sha256:entry.sha256});
 }
 if(ids.size!==2)throw Error('Jeux obligatoires manquants');
 const temp=dest+'.partial-'+process.pid;mkdirSync(join(temp,'releases',pointer.release),{recursive:true});
 try{
  writeFileSync(join(temp,'manifest.json'),JSON.stringify(pointer,null,2)+'\n');
  writeFileSync(join(temp,'releases',pointer.release,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  for(const entry of manifest.datasets){await pipeline(createReadStream(join(releaseDir,entry.path)),createWriteStream(join(temp,'releases',pointer.release,entry.path),{flags:'wx'}));}
  // Cloudflare Pages/Netlify-style static headers. Other hosts use the documented equivalent.
  writeFileSync(join(temp,'_headers'),`/*\n  Access-Control-Allow-Origin: *\n  Access-Control-Allow-Methods: GET, HEAD, OPTIONS\n\n/releases/*\n  Cache-Control: public, max-age=31536000, immutable\n\n/manifest.json\n  Cache-Control: no-cache\n\n/**/*.gz\n  Content-Type: application/gzip\n  Content-Disposition: attachment\n`);
  writeFileSync(join(temp,'DEPLOYMENT-NOTES.txt'),`Release ISO ${pointer.release}\nPublish this entire folder at a stable HTTPS base URL.\nTest URL: <base>/manifest.json\nThe Vite build and the distribution host are independent.\nFor *.jsonl.gz, serve as application/gzip WITHOUT Content-Encoding: gzip.\nIf a host adds Content-Encoding:gzip, the S14-L5-B client also validates uncompressed SHA-256.\nEnsure CORS permits your web application origin (wildcard only for public, credential-free files).\nThe _headers file is recognized by some static hosts; configure equivalent headers on others.\nNo ISO data may be published without checking attribution/licensing.\n`);
  renameSync(temp,dest);
 }catch(e){rmSync(temp,{recursive:true,force:true});throw e;}
 return {operation:'S14-L5-C-STATIC-DEPLOY',ok:true,release:pointer.release,destination:dest,datasets:files,manifest:'manifest.json',userAction:'Upload destination as a static HTTPS site; configure the application catalog URL to this base URL'};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{const opts=parse(process.argv.slice(2));console.log(JSON.stringify(await stage({repo:opts.repo||process.cwd(),out:opts.out}),null,2));}catch(e){console.log(JSON.stringify({operation:'S14-L5-C-STATIC-DEPLOY',ok:false,error:e.message},null,2));process.exitCode=1;}
}
