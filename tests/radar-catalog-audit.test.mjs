import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { audit } from '../tools/audit-catalog-distribution.mjs';
const sha = b => createHash('sha256').update(b).digest('hex');
async function fixture(){
 const root=await mkdtemp(join(tmpdir(),'radar-audit-')),dist=join(root,'catalog-distribution'),rd=join(dist,'releases','2026-11-09');await mkdir(rd,{recursive:true});
 const datasets=[];for(const id of ['deliverables','committees']){const data=Buffer.from(id+'\n');await writeFile(join(rd,id+'.jsonl.gz'),data);datasets.push({id,path:id+'.jsonl.gz',bytes:data.length,sha256:sha(data),records:1});}
 await writeFile(join(rd,'manifest.json'),JSON.stringify({schemaVersion:1,catalogId:'iso',release:'2026-11-09',datasets}));
 await writeFile(join(dist,'manifest.json'),JSON.stringify({schemaVersion:1,catalogId:'iso',release:'2026-11-09',manifest:'releases/2026-11-09/manifest.json'}));
 return {root,dist,rd};
}
test('audit checks immutable release on disk',async()=>{const f=await fixture();try{const r=await audit({repo:f.root});assert.equal(r.ok,true);assert.equal(r.datasets.length,2);}finally{await rm(f.root,{recursive:true,force:true});}});
test('audit detects mismatch without writing',async()=>{const f=await fixture();try{await writeFile(join(f.rd,'deliverables.jsonl.gz'),'changed');const r=await audit({repo:f.root});assert.equal(r.ok,false);assert.equal(r.datasets[0].issue,'DISK_MANIFEST_MISMATCH');}finally{await rm(f.root,{recursive:true,force:true});}});
test('audit compares bytes from HTTP',async()=>{const f=await fixture();const {createServer}=await import('node:http');const {readFile}=await import('node:fs/promises');const server=createServer(async(req,res)=>{const mapping={'/catalog-distribution/releases/2026-11-09/deliverables.jsonl.gz':'deliverables.jsonl.gz','/catalog-distribution/releases/2026-11-09/committees.jsonl.gz':'committees.jsonl.gz'};const name=mapping[req.url];if(!name){res.writeHead(404).end();return;}res.setHeader('Content-Type','application/octet-stream');res.end(await readFile(join(f.rd,name)));});await new Promise(ok=>server.listen(0,'127.0.0.1',ok));try{const port=server.address().port;const r=await audit({repo:f.root,endpoint:`http://127.0.0.1:${port}/catalog-distribution/`});assert.equal(r.ok,true);assert.equal(r.datasets[0].http.matches,true);}finally{server.close();await rm(f.root,{recursive:true,force:true});}});
test('audit detects HTTP mismatch',async()=>{const f=await fixture();const {createServer}=await import('node:http');const server=createServer((req,res)=>{res.setHeader('Content-Encoding','gzip');res.end('different');});await new Promise(ok=>server.listen(0,'127.0.0.1',ok));try{const port=server.address().port;const r=await audit({repo:f.root,endpoint:`http://127.0.0.1:${port}/catalog-distribution/`});assert.equal(r.ok,false);assert.equal(r.datasets.every(x=>x.issue==='HTTP_FAILURE'),true);}finally{server.close();await rm(f.root,{recursive:true,force:true});}});
