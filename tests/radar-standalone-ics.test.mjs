import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(
  new URL('../js/radar-standards-panel.js',import.meta.url),
  'utf8'
);

const start=source.indexOf(
  'async function loadIcs(force=false)'
);

const end=source.indexOf(
  'function initialize(',
  start
);

assert.ok(start>=0 && end>start);

const implementation=source.slice(start,end);

async function run({standalone=true,fail=false}={}){
  const calls=[];

  const root={
    __radarStandalone:
      standalone?{profile:'creator'}:undefined,

    fetch:async url=>{
      calls.push({type:'fetch',url});

      return {
        ok:!fail,
        status:fail?404:200,
        text:async()=>(
          'identifier,titleFr,titleEn\n' +
          '35,Informatique,Information technology'
        )
      };
    },

    Papa:{
      parse(input,options){
        calls.push({
          type:'parse',
          input,
          download:options.download
        });

        options.complete({
          errors:[],
          data:[{
            identifier:'35',
            titleFr:'Informatique'
          }]
        });
      }
    }
  };

  const ctx=vm.createContext({
    root,
    ICS_URL:'https://example.test/ICS.csv',
    loading:false,
    icsRows:[],
    icsError:null,
    refresh(){}
  });

  const script=`
    ${implementation}

    this.execute=async function(){
      await loadIcs();
      return {
        rows:icsRows,
        error:icsError,
        loading
      };
    };
  `;

  vm.runInContext(script,ctx);

  return {
    result:await ctx.execute(),
    calls
  };
}

test('standalone parses embedded CSV without XHR download',async()=>{
  const x=await run();

  assert.equal(x.calls[0].type,'fetch');
  assert.equal(x.calls[0].url,'./ICS.csv');

  assert.equal(x.calls[1].type,'parse');
  assert.equal(x.calls[1].download,false);

  assert.match(
    x.calls[1].input,
    /35,Informatique/
  );

  assert.equal(x.result.rows.length,1);
  assert.equal(x.result.error,null);
  assert.equal(x.result.loading,false);
});

test('server retains historical PapaParse download',async()=>{
  const x=await run({standalone:false});

  assert.equal(x.calls.length,1);
  assert.equal(x.calls[0].type,'parse');
  assert.equal(x.calls[0].input,'./ICS.csv');
  assert.equal(x.calls[0].download,true);
  assert.equal(x.result.rows.length,1);
});

test('missing standalone CSV reports failure without XHR',async()=>{
  const x=await run({fail:true});

  assert.equal(
    x.calls.every(c=>c.type==='fetch'),
    true
  );

  assert.equal(x.result.rows.length,0);
  assert.match(x.result.error,/ICS HTTP 404/);
  assert.equal(x.result.loading,false);
});
