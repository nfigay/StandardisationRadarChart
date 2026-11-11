/* S14-M: pure, bounded-memory NDJSON and incremental SHA-256. No dependencies. */
(function(root) {
  'use strict';
  const K = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  const rotate=(x,n)=>(x>>>n)|(x<<(32-n));
  class Sha256 {
    constructor(){this.h=new Uint32Array([0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19]);this.block=new Uint8Array(64);this.used=0;this.bytes=0;this.done=false;}
    compress(block){const w=new Uint32Array(64);for(let i=0;i<16;i++)w[i]=((block[4*i]<<24)|(block[4*i+1]<<16)|(block[4*i+2]<<8)|block[4*i+3])>>>0;
      for(let i=16;i<64;i++){const a=w[i-15],b=w[i-2];w[i]=(w[i-16]+(rotate(a,7)^rotate(a,18)^(a>>>3))+w[i-7]+(rotate(b,17)^rotate(b,19)^(b>>>10)))>>>0;}
      let [a,b,c,d,e,f,g,h]=this.h;
      for(let i=0;i<64;i++){const t1=(h+(rotate(e,6)^rotate(e,11)^rotate(e,25))+((e&f)^(~e&g))+K[i]+w[i])>>>0;const t2=((rotate(a,2)^rotate(a,13)^rotate(a,22))+((a&b)^(a&c)^(b&c)))>>>0;h=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0;}
      for(let i=0;i<8;i++)this.h[i]=(this.h[i]+[a,b,c,d,e,f,g,h][i])>>>0;
    }
    update(bytes){if(this.done)throw Error('SHA256 already finalized');if(!(bytes instanceof Uint8Array))bytes=new Uint8Array(bytes);this.bytes+=bytes.length;let at=0;while(at<bytes.length){const n=Math.min(64-this.used,bytes.length-at);this.block.set(bytes.subarray(at,at+n),this.used);this.used+=n;at+=n;if(this.used===64){this.compress(this.block);this.used=0;}}return this;}
    digest(){if(this.done)throw Error('SHA256 already finalized');this.done=true;const bitHi=Math.floor(this.bytes/0x20000000);const bitLo=(this.bytes*8)>>>0;this.block[this.used++]=0x80;if(this.used>56){this.block.fill(0,this.used);this.compress(this.block);this.used=0;}this.block.fill(0,this.used,56);for(let i=0;i<4;i++){this.block[56+i]=(bitHi>>>(24-8*i))&255;this.block[60+i]=(bitLo>>>(24-8*i))&255;}this.compress(this.block);return Array.from(this.h,x=>x.toString(16).padStart(8,'0')).join('');}
  }
  function wrapHash(stream,hash){return stream.pipeThrough(new TransformStream({transform(chunk,controller){hash.update(chunk);controller.enqueue(chunk);}}));}
  async function sniffGzip(stream){const reader=stream.getReader();let first=await reader.read();if(first.done){reader.releaseLock();throw Error('Empty dataset');}const fragments=[first.value];let len=first.value.length;while(len<2){first=await reader.read();if(first.done)break;fragments.push(first.value);len+=first.value.length;}if(!len){reader.releaseLock();throw Error('Empty dataset');}const chunk=new Uint8Array(len);let offset=0;for(const part of fragments){chunk.set(part,offset);offset+=part.length;}const gzip=chunk.length>=2&&chunk[0]===31&&chunk[1]===139;const restored=new ReadableStream({start(controller){controller.enqueue(chunk);},async pull(controller){try{const x=await reader.read();if(x.done){controller.close();reader.releaseLock();}else controller.enqueue(x.value);}catch(e){controller.error(e);reader.releaseLock();}},cancel(){reader.cancel();}});return {gzip,stream:restored};}
  async function* jsonLines(stream,{maxLineBytes=4*1024*1024}={}){
    const reader=stream.getReader();const decoder=new TextDecoder('utf-8',{fatal:true});let remaining='';let line=0;
    try{for(;;){const r=await reader.read();if(r.done)break;remaining+=decoder.decode(r.value,{stream:true});let pos;
      while((pos=remaining.indexOf('\n'))!==-1){const value=remaining.slice(0,pos).replace(/\r$/,'');remaining=remaining.slice(pos+1);line++;if(value.trim())yield {value,line};}
      if(remaining.length>maxLineBytes)throw Error('JSONL line exceeds limit');}
      remaining+=decoder.decode();if(remaining.trim())yield {value:remaining,line:++line};
    }finally{reader.releaseLock();}
  }
  async function ingestStream({stream,entry,writeBatch,normalize,batchSize=300,onProgress,signal}){
    if(!stream||typeof writeBatch!=='function'||!entry||!normalize)throw Error('Invalid streaming import');
    const sniff=await sniffGzip(stream);const rawHash=new Sha256(),compressedHash=new Sha256();let rawBytes=0,compressedBytes=0;
    let bytes=sniff.stream;
    if(sniff.gzip){bytes=wrapHash(bytes,compressedHash);bytes=bytes.pipeThrough(new TransformStream({transform(v,c){compressedBytes+=v.length;c.enqueue(v);}}));if(typeof DecompressionStream!=='function')throw Error('gzip streaming unavailable');bytes=bytes.pipeThrough(new DecompressionStream('gzip'));}
    bytes=bytes.pipeThrough(new TransformStream({transform(v,c){rawBytes+=v.length;rawHash.update(v);c.enqueue(v);}}));
    let count=0,batch=[];
    for await(const {value,line} of jsonLines(bytes)){
      if(signal?.aborted)throw Error('Import cancelled');let raw;try{raw=JSON.parse(value);}catch(e){throw Error('Invalid JSONL at line '+line+': '+e.message);}
      const record=normalize(raw);if(!record||record.id==null||record.id==='')throw Error('Invalid ISO record at line '+line);
      batch.push(record);count++;
      if(batch.length>=batchSize){await writeBatch(batch);batch=[];onProgress?.({count,bytes:rawBytes});}
    }
    if(batch.length)await writeBatch(batch);
    const actualRaw=rawHash.digest();
    if(rawBytes!==entry.uncompressedBytes||actualRaw.toLowerCase()!==String(entry.uncompressedSha256).toLowerCase())throw Error('Uncompressed integrity mismatch: '+entry.id);
    if(sniff.gzip&&(compressedBytes!==entry.bytes||compressedHash.digest().toLowerCase()!==String(entry.sha256).toLowerCase()))throw Error('Compressed integrity mismatch: '+entry.id);
    if(entry.records!=null&&count!==entry.records)throw Error('Record count mismatch: '+entry.id);
    return {count,bytes:rawBytes,mode:sniff.gzip?'gzip':'decoded',sha256:actualRaw};
  }
  root.__radarIsoStreamCore=Object.freeze({Sha256,jsonLines,ingestStream,sniffGzip});
  if(typeof module!=='undefined'&&module.exports)module.exports=root.__radarIsoStreamCore;
})(typeof window!=='undefined'?window:globalThis);
