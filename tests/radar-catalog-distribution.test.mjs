import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,existsSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {runInNewContext} from 'node:vm';
import {publish} from '../tools/publish-catalog.mjs';
const sha = data=>createHash('sha256').update(data).digest('hex');
function fixture(){const root=mkdtempSync(join(tmpdir(),'s14-i-'));const dir=join(root,'iso-open-data-cache');mkdirSync(dir);const datasets=[];
 for(const [type,rows] of [['deliverables',[{id:101,reference:'ISO 123',title:{fr:'Titre',en:'Title'},icsCode:['35.020']}]],['committees',[{id:201,reference:'ISO/TC 1',title:{en:'Example'}}]]]){const text=rows.map(r=>JSON.stringify(r)).join('\n')+'\n';writeFileSync(join(dir,type+'.jsonl'),text);datasets.push({type,file:type+'.jsonl',bytes:Buffer.byteLength(text),sha256:sha(text)});}
 writeFileSync(join(dir,'manifest.json'),JSON.stringify({schemaVersion:1,updatedAt:'2026-11-09T00:00:00Z',datasets}));return root;}
test('publishes versioned immutable gzip and integrity manifest',async()=>{const root=fixture();try{const out=join(root,'dist-data');const report=await publish({repo:root,out,release:'2026-11-09'});assert.equal(report.ok,true);const pointer=JSON.parse(readFileSync(join(out,'manifest.json')));assert.equal(pointer.release,'2026-11-09');const m=JSON.parse(readFileSync(join(out,pointer.manifest)));assert.equal(m.datasets.length,2);for(const entry of m.datasets){const packed=readFileSync(join(out,'releases','2026-11-09',entry.path));assert.equal(sha(packed),entry.sha256);assert.equal(entry.records,1);}
 await assert.rejects(publish({repo:root,out,release:'2026-11-09'}),/immuable/);
 }finally{rmSync(root,{recursive:true,force:true});}});
test('rejects source tampering without publishing',async()=>{const root=fixture();try{writeFileSync(join(root,'iso-open-data-cache','deliverables.jsonl'),'garbage\n');await assert.rejects(publish({repo:root,out:join(root,'out'),release:'2026-11-09'}),/Empreinte/);assert.equal(existsSync(join(root,'out','manifest.json')),false);}finally{rmSync(root,{recursive:true,force:true});}});
test('requires ISO manifests to have exactly two safe, verifiable datasets',()=>{const src=readFileSync(new URL('../js/radar-catalog-distribution.js',import.meta.url),'utf8');const window={location:{href:'http://localhost/radar.html'},crypto:{subtle:{}}};runInNewContext(src,{window,URL,fetch(){}});const validate=window.__radarCatalogDistribution.validateManifest;
 const item=id=>({id,path:id+'.jsonl.gz',compression:'gzip',sha256:'a'.repeat(64),bytes:10,records:1});assert.equal(validate({schemaVersion:1,catalogId:'iso',datasets:[item('deliverables'),item('committees')]}).datasets.length,2);
 assert.throws(()=>validate({schemaVersion:1,catalogId:'iso',datasets:[{...item('deliverables'),path:'../secret'},item('committees')]}),/Chemin/);
 assert.throws(()=>validate({schemaVersion:1,catalogId:'iso',datasets:[item('deliverables')]}),/incomplet/);
});
