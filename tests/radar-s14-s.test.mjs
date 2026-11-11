import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {gzipSync,gunzipSync} from 'node:zlib';
import vm from 'node:vm';
import {readFileSync as read} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname} from 'node:path';
import {prepare} from '../tools/prepare-iso-site.mjs';
import {normalizeIcs} from '../tools/publish-ics-extension.mjs';
const here=dirname(fileURLToPath(import.meta.url));
const checksum=data=>createHash('sha256').update(data).digest('hex');
const makeFixture=()=>{
 const root=mkdtempSync(join(tmpdir(),'s14s-'));mkdirSync(join(root,'catalog-distribution','releases','2026-11-09'),{recursive:true});
 const base=join(root,'catalog-distribution'),dir=join(base,'releases','2026-11-09'),datasets=[];
 for(const id of ['deliverables','committees']){
  const raw=Buffer.from(JSON.stringify({id:'1',reference:'ISO 1'})+'\n');const gz=gzipSync(raw);
  writeFileSync(join(dir,id+'.jsonl.gz'),gz);
  datasets.push({id,path:id+'.jsonl.gz',compression:'gzip',sha256:checksum(gz),bytes:gz.length,uncompressedSha256:checksum(raw),uncompressedBytes:raw.length,records:1});
 }
 writeFileSync(join(base,'manifest.json'),JSON.stringify({schemaVersion:1,catalogId:'iso',release:'2026-11-09',manifest:'releases/2026-11-09/manifest.json'}));
 writeFileSync(join(dir,'manifest.json'),JSON.stringify({schemaVersion:1,catalogId:'iso',release:'2026-11-09',datasets}));
 const csv=join(root,'ICS.csv');writeFileSync(csv,'identifier,titleFr,titleEn,parent\n01,Général,General,\n01.020,Terminologie,Terminology,01\n');
 return {root,csv,base};
};
test('taxonomy parser accepts hierarchical CSV and rejects duplicate identifiers',()=>{
 assert.equal(normalizeIcs('identifier,titleFr,titleEn\n01,Général,General\n').length,1);
 assert.throws(()=>normalizeIcs('identifier,titleFr,titleEn\n01,A,A\n01,B,B\n'),/Duplicate/);
});
test('requires explicit redistribution rights before publishing ICS',async()=>{
 const f=makeFixture();try{await assert.rejects(prepare({repo:f.root,out:join(f.root,'export'),ics:f.csv}),/rights/);}finally{rmSync(f.root,{recursive:true,force:true});}
});
test('builds standalone ISO + ICS static release and refuses overwrite',async()=>{
 const f=makeFixture(),out=join(f.root,'export');
 try{
  const r=await prepare({repo:f.root,out,ics:f.csv,acknowledgeRights:true});assert.equal(r.ok,true);assert.equal(r.ics.records,2);
  const ptr=JSON.parse(readFileSync(join(out,'extensions','ics','manifest.json'),'utf8'));
  assert.equal(ptr.catalogRelease,'2026-11-09');
  const manifest=JSON.parse(readFileSync(join(out,'extensions','ics',ptr.manifest),'utf8'));
  const gz=readFileSync(join(out,'extensions','ics','2026-11-09','ics.jsonl.gz'));
  assert.equal(checksum(gz),manifest.datasets[0].sha256);
  const jsonl=gunzipSync(gz);assert.equal(checksum(jsonl),manifest.datasets[0].uncompressedSha256);
  assert.equal(jsonl.toString().trim().split('\n').length,2);
  await assert.rejects(prepare({repo:f.root,out}),/exists/);
 }finally{rmSync(f.root,{recursive:true,force:true});}
});
function harness(source,extra={}){
 const ctx={location:{href:'https://radar.example.org/radar.html'},URL,window:null,console,...extra};ctx.window=ctx;
 vm.runInNewContext(source,ctx);return ctx;
}
test('catalog client validates public HTTPS and rejects unsafe paths',()=>{
 const src=read(join(here,'../js/radar-iso-catalog-client.js'),'utf8');const ctx=harness(src);
 assert.equal(ctx.__radarIsoCatalogClient.validatedBase('https://catalog.example.org/iso'),'https://catalog.example.org/iso/');
 assert.throws(()=>ctx.__radarIsoCatalogClient.validatedBase('http://catalog.example.org/iso'),/HTTPS/);
 assert.throws(()=>ctx.__radarIsoCatalogClient.safePath('../manifest.json'),/Unsafe/);
});
test('catalog unchanged without ICS extension does not import ISO',async()=>{
 const src=read(join(here,'../js/radar-iso-catalog-client.js'),'utf8');let called=0;
 const fetch=async url=>({ok:true,status:200,headers:{get:()=>String(url).includes('extensions/')?'text/html':'application/json'},text:async()=>String(url).includes('extensions/')?'<html>fallback</html>':JSON.stringify({schemaVersion:1,catalogId:'iso',release:'2026-11-09'})});
 const ctx=harness(src,{fetch,__radarIsoWindowed:{current:async()=>({summary:{release:'2026-11-09'}})},__radarIsoStreamDistribution:{importEndpoint:async()=>{called++;}}});
 const result=await ctx.__radarIsoCatalogClient.sync({endpoint:'https://catalog.example.org/iso/'});
 assert.equal(result.iso.status,'unchanged');assert.equal(result.ics.status,'not-published');assert.equal(called,0);
});
test('ICS manifest integrity metadata is required and bad sources do not mutate active cache',async()=>{
 const src=read(join(here,'../js/radar-iso-catalog-client.js'),'utf8');let modified=0;
 const fetch=async url=>({ok:true,status:200,headers:{get:()=> 'application/json'},text:async()=>JSON.stringify(String(url).includes('extensions/ics/2026-11-09/')?{schemaVersion:1,kind:'ics-extension',release:'2026-11-09',datasets:[{id:'ics'}]}:String(url).endsWith('extensions/ics/manifest.json')?{schemaVersion:1,kind:'ics-extension-pointer',catalogRelease:'2026-11-09',release:'2026-11-09',manifest:'2026-11-09/manifest.json'}:{schemaVersion:1,catalogId:'iso',release:'2026-11-09'})});
 const ctx=harness(src,{fetch,__radarIsoWindowed:{current:async()=>({summary:{release:'2026-11-09'}})},__radarIsoStreamDistribution:{importEndpoint:async()=>modified++},__radarIsoIcsExtension:{importStream:async()=>modified++}});
 await assert.rejects(ctx.__radarIsoCatalogClient.sync({endpoint:'https://catalog.example.org/iso/'}),/Invalid ICS extension manifest/);
 assert.equal(modified,0);
});
