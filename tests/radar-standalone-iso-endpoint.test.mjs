import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';

const client=readFileSync(
  new URL('../js/radar-iso-catalog-client.js',import.meta.url),
  'utf8'
);

const distribution=readFileSync(
  new URL('../js/radar-iso-stream-distribution.js',import.meta.url),
  'utf8'
);

const endpoint=
  'https://standalone.invalid/StandardisationRadarChart/catalog-distribution/';

const checksum=value=>
  createHash('sha256').update(value).digest('hex');

function setup(extra={}){
  const location=new URL(
    'file:///Users/test/pilot/creator.html'
  );

  const ctx=vm.createContext({
    URL,
    location,
    console,
    __radarStandalone:{profile:'creator'},
    ...extra
  });

  ctx.window=ctx;

  vm.runInContext(distribution,ctx);
  vm.runInContext(client,ctx);

  return ctx;
}

test('standalone accepts only the embedded catalog endpoint',()=>{
  const ctx=setup();
  const api=ctx.__radarIsoCatalogClient;

  assert.equal(
    api.validatedBase('./catalog-distribution/'),
    endpoint
  );

  assert.equal(
    api.validatedBase(endpoint),
    endpoint
  );

  for(const unsafe of [
    'file:///tmp/other/',
    'https://example.test/catalog/',
    'http://localhost/catalog/',
    './other/'
  ]){
    assert.throws(
      ()=>api.validatedBase(unsafe),
      /embedded distribution/
    );
  }
});

test('server endpoint validation remains unchanged',()=>{
  const ctx=setup({
    location:new URL('https://example.test/radar.html'),
    __radarStandalone:undefined
  });

  const api=ctx.__radarIsoCatalogClient;

  assert.equal(
    api.validatedBase('./catalog-distribution/'),
    'https://example.test/catalog-distribution/'
  );

  assert.equal(
    api.validatedBase('http://localhost/iso'),
    'http://localhost/iso/'
  );

  assert.throws(
    ()=>api.validatedBase('http://example.test/iso'),
    /HTTPS/
  );

  assert.throws(
    ()=>api.validatedBase('file:///tmp/iso'),
    /Invalid catalog endpoint/
  );

  assert.throws(
    ()=>api.safePath('../manifest.json'),
    /Unsafe/
  );
});

test('standalone client uses existing streaming importer',async()=>{
  const release='2026-11-09';

  const responses=new Map();

  const calls=[];

  const datasets=[];

  for(const id of ['deliverables','committees']){
    const raw=Buffer.from('{"id":"1"}\n');
    const gz=gzipSync(raw);

    datasets.push({
      id,
      path:id+'.jsonl.gz',
      compression:'gzip',
      bytes:gz.length,
      sha256:checksum(gz),
      uncompressedBytes:raw.length,
      uncompressedSha256:checksum(raw),
      records:1
    });

    responses.set(
      endpoint+'releases/'+release+'/'+id+'.jsonl.gz',
      gz
    );
  }

  responses.set(
    endpoint+'manifest.json',
    {
      schemaVersion:1,
      catalogId:'iso',
      release,
      manifest:'releases/'+release+'/manifest.json'
    }
  );

  responses.set(
    endpoint+'releases/'+release+'/manifest.json',
    {
      schemaVersion:1,
      catalogId:'iso',
      release,
      datasets
    }
  );

  let imported=0;

  const ctx=setup({
    fetch:async url=>{
      const key=String(url);
      calls.push(key);

      if(key.endsWith('radar-catalog-config.json')){
        return new Response(
          JSON.stringify({
            schemaVersion:1,
            endpoint:'./catalog-distribution/'
          }),
          {headers:{'content-type':'application/json'}}
        );
      }

      if(!responses.has(key)){
        return new Response(null,{status:404});
      }

      const data=responses.get(key);

      return Buffer.isBuffer(data)
        ?new Response(data)
        :new Response(
          JSON.stringify(data),
          {headers:{'content-type':'application/json'}}
        );
    },

    __radarIsoOpenData:{
      normalize:(type,raw)=>raw
    },

    __radarIsoWindowed:{
      current:async()=>null,

      importRelease:async request=>{
        imported++;

        assert.equal(request.release,release);
        assert.equal(request.datasets.length,2);

        for(const dataset of request.datasets){

          const body=await dataset.openStream();

          const bytes=Buffer.from(
            await new Response(body).arrayBuffer()
          );

          assert.equal(
            checksum(bytes),
            dataset.entry.sha256
          );
        }

        return {datasets:request.datasets.map(
          d=>({id:d.type,count:1})
        )};
      }
    }
  });

  const result=
    await ctx.__radarIsoCatalogClient.sync();

  assert.equal(imported,1);
  assert.equal(result.iso.status,'updated');
  assert.equal(result.release,release);
  assert.equal(result.ics.status,'not-published');

  assert.ok(
    calls.includes(endpoint+'manifest.json')
  );

  assert.ok(
    calls.some(url=>url.endsWith('deliverables.jsonl.gz'))
  );
});
