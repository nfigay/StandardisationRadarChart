import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,rmSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {stage} from '../tools/deploy-catalog-static.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');
function fixture(){const home=mkdtempSync(join(tmpdir(),'radar-deploy-'));const root=join(home,'repo');const dir=join(root,'catalog-distribution','releases','2026-11-09');mkdirSync(dir,{recursive:true});const datasets=[];for(const id of ['deliverables','committees']){const data=Buffer.from('{"id":"sample"}\n');const packed=gzipSync(data);writeFileSync(join(dir,id+'.jsonl.gz'),packed);datasets.push({id,path:id+'.jsonl.gz',compression:'gzip',bytes:packed.length,sha256:hash(packed),uncompressedBytes:data.length,uncompressedSha256:hash(data)});}writeFileSync(join(dir,'manifest.json'),JSON.stringify({schemaVersion:1,catalogId:'iso',release:'2026-11-09',datasets}));writeFileSync(join(root,'catalog-distribution','manifest.json'),JSON.stringify({schemaVersion:1,catalogId:'iso',release:'2026-11-09',manifest:'releases/2026-11-09/manifest.json'}));return {home,root,dir};}
for(const [name,change] of [
 ['publication HTTPS statique préparée sans toucher à la source',null],
 ['fichier compressé falsifié refusé',f=>writeFileSync(join(f.dir,'deliverables.jsonl.gz'),Buffer.from('bad'))],
 ['manifeste contenant un chemin dangereux refusé',f=>{const p=join(f.dir,'manifest.json');const m=JSON.parse(readFileSync(p));m.datasets[0].path='../evil';writeFileSync(p,JSON.stringify(m));}],
 ])test(name,async()=>{const f=fixture();try{const dest=join(f.home,'deploy');change?.(f);if(change){await assert.rejects(stage({repo:f.root,out:dest}));assert.equal(existsSync(dest),false);}else{const result=await stage({repo:f.root,out:dest});assert.equal(result.ok,true);assert.equal(existsSync(join(dest,'manifest.json')),true);await assert.rejects(stage({repo:f.root,out:dest}));assert.equal(existsSync(join(f.root,'catalog-distribution','manifest.json')),true);}}finally{rmSync(f.home,{recursive:true,force:true});}});
