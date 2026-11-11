#!/usr/bin/env node
/* Standalone ICS extension publication; does NOT mutate v1 ISO manifests. */
import { createHash } from 'node:crypto';
import { createReadStream, createWriteStream, existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { createGzip } from 'node:zlib';
import { fileURLToPath } from 'node:url';
function csvRecords(text){const records=[];let row=[],field='',quoted=false;
 for(let i=0;i<text.length;i++){
  const c=text[i];if(quoted){if(c==='"'&&text[i+1]==='"'){field+='"';i++;}else if(c==='"')quoted=false;else field+=c;}
  else if(c==='"'){if(field)throw Error('Malformed CSV quote');quoted=true;}
  else if(c===','){row.push(field);field='';}
  else if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;row.push(field);field='';if(row.some(v=>v.trim()))records.push(row);row=[];}
  else field+=c;
 }
 if(quoted)throw Error('Unterminated quoted CSV field');if(field||row.length){row.push(field);records.push(row);}return records;
}
const digest=b=>createHash('sha256').update(b).digest('hex');
export function normalizeIcs(csv){const rows=csvRecords(csv.replace(/^\uFEFF/,''));if(rows.length<2)throw Error('ICS.csv empty');
 const header=rows.shift().map(s=>s.trim());const index=header.indexOf('identifier');if(index<0)throw Error('ICS.csv lacks identifier column');
 const title=header.indexOf('titleFr'),english=header.indexOf('titleEn');if(title<0&&english<0)throw Error('ICS.csv lacks title column');
 const seen=new Set(),out=[];
 for(const values of rows){if(values.length!==header.length)throw Error('ICS.csv column mismatch');const record=Object.fromEntries(header.map((h,i)=>[h,values[i]]));
  const id=String(record.identifier||'').trim();if(!id)continue;
  if(!/^\d{2}(?:\.\d{3})?(?:\.\d{2})?$/.test(id))throw Error('Invalid ICS identifier: '+id);
  if(seen.has(id))throw Error('Duplicate ICS identifier: '+id);seen.add(id);
  if(!String(record.titleFr||record.titleEn||'').trim())throw Error('ICS title absent: '+id);
  out.push({id,identifier:id,titleFr:record.titleFr??'',titleEn:record.titleEn??'',...record});
 }
 if(!out.length)throw Error('No valid ICS records');return out;
}
async function hashFile(p){const h=createHash('sha256');let bytes=0;for await(const c of createReadStream(p)){h.update(c);bytes+=c.length;}return {bytes,sha256:h.digest('hex')};}
export async function publishIcs({input,out,release}){
 if(!/^\d{4}-\d{2}-\d{2}(?:[.-][A-Za-z0-9_-]+)?$/.test(release))throw Error('Invalid release');
 const dest=resolve(out),source=resolve(input),releaseDir=join(dest,'extensions','ics',release);
 if(existsSync(releaseDir))throw Error('Immutable ICS extension already exists');
 const inputBytes=readFileSync(source),records=normalizeIcs(inputBytes.toString('utf8'));
 mkdirSync(join(dest,'extensions','ics'),{recursive:true});const tmp=releaseDir+'.partial-'+process.pid;
 mkdirSync(tmp);
 try{
  const raw=join(tmp,'ics.jsonl'),compressed=join(tmp,'ics.jsonl.gz');
  writeFileSync(raw,records.map(r=>JSON.stringify(r)).join('\n')+'\n',{flag:'wx'});
  const decoded=await hashFile(raw);
  await pipeline(createReadStream(raw),createGzip({level:6,mtime:0}),createWriteStream(compressed,{flags:'wx'}));
  const packed=await hashFile(compressed);rmSync(raw);
  const manifest={schemaVersion:1,kind:'ics-extension',catalogId:'iso',release,source:'ICS.csv (local operator input)',sourceSha256:digest(inputBytes),generatedAt:new Date().toISOString(),datasets:[{id:'ics',path:'ics.jsonl.gz',compression:'gzip',mediaType:'application/x-ndjson',records:records.length,...packed,uncompressedBytes:decoded.bytes,uncompressedSha256:decoded.sha256}]};
  writeFileSync(join(tmp,'manifest.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});renameSync(tmp,releaseDir);
  return {operation:'S14-R-ICS-EXTENSION',ok:true,output:releaseDir,records:records.length,manifest};
 }catch(e){rmSync(tmp,{recursive:true,force:true});throw e;}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{const args=Object.fromEntries(process.argv.slice(2).reduce((a,v,i,all)=>{if(i%2===0){if(!['--input','--out','--release'].includes(v)||!all[i+1])throw Error('Usage --input ICS.csv --out directory --release YYYY-MM-DD');a.push([v.slice(2),all[i+1]]);}return a;},[]));
 const result=await publishIcs({input:args.input||'ICS.csv',out:args.out||'catalog-distribution',release:args.release});console.log(JSON.stringify(result,null,2));}
 catch(e){console.error(JSON.stringify({operation:'S14-R-ICS-EXTENSION',ok:false,error:String(e.message??e)}));process.exitCode=1;}
}
