import {execFileSync} from 'node:child_process';
const sourceCommit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
import assert from 'node:assert/strict';

import {
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
  existsSync
} from 'node:fs';

import {
  resolve,
  relative,
  dirname,
  extname,
  join
} from 'node:path';

import {
  createHash
} from 'node:crypto';

import {
  build
} from 'esbuild';

const root=resolve(
  '.radarchart-build/pages'
);

const output=process.env.PILOT_DIR;

assert.ok(output);

const prefix='/StandardisationRadarChart/';

const origin='https://standalone.invalid';

const sourceHTML=readFileSync(
  join(root,'radar.html'),
  'utf8'
);

const mimeTypes={
  '.json':'application/json',
  '.csv':'text/csv',
  '.jsonl':'application/x-ndjson',
  '.gz':'application/gzip',
  '.txt':'text/plain',
  '.svg':'image/svg+xml',
  '.png':'image/png',
  '.jpg':'image/jpeg',
  '.jpeg':'image/jpeg',
  '.gif':'image/gif',
  '.webp':'image/webp',
  '.ico':'image/x-icon',
  '.woff':'font/woff',
  '.woff2':'font/woff2',
  '.ttf':'font/ttf',
  '.otf':'font/otf',
  '.css':'text/css',
  '.js':'text/javascript',
  '.mjs':'text/javascript',
  '.html':'text/html'
};

function mime(file){
  return mimeTypes[
    extname(file).toLowerCase()
  ] || 'application/octet-stream';
}

function resolveAsset(reference,owner='radar.html'){

  const url=new URL(
    reference,
    origin+prefix+owner
  );

  assert.equal(
    url.origin,
    origin,
    'Ressource externe non embarquee : '+
      reference+' dans '+owner
  );

  assert.ok(
    url.pathname.startsWith(prefix),
    'Ressource hors distribution : '+reference
  );

  const name=decodeURIComponent(
    url.pathname.slice(prefix.length)
  );

  const file=resolve(root,name);

  assert.ok(
    file.startsWith(root+'/'),
    'Chemin hors distribution : '+reference
  );

  assert.ok(
    existsSync(file) &&
    statSync(file).isFile(),
    'Ressource absente : '+name
  );

  return {name,file};
}

function dataURI(reference,owner){

  if(
    reference.startsWith('data:') ||
    reference.startsWith('#')
  ){
    return reference;
  }

  const asset=resolveAsset(
    reference,
    owner
  );

  return 'data:'+
    mime(asset.name)+
    ';base64,'+
    readFileSync(asset.file)
      .toString('base64');
}

function escapeScript(source){
  return source.replace(
    /<\/script/gi,
    '<\\/script'
  );
}

function attr(source,name){

  const pattern=new RegExp(
    '(?:^|\\s)'+name+
    '\\s*=\\s*(?:"([^"]*)"|\\x27([^\\x27]*)\\x27|([^\\s>]+))',
    'i'
  );

  const match=source.match(pattern);

  return match
    ?match[1]??match[2]??match[3]
    :null;
}

async function replaceAsync(source,pattern,fn){

  const parts=[];

  let offset=0;

  for(const match of source.matchAll(pattern)){

    parts.push(
      source.slice(offset,match.index)
    );

    parts.push(
      await fn(...match)
    );

    offset=match.index+match[0].length;
  }

  parts.push(source.slice(offset));

  return parts.join('');
}

function inlineCSS(source,owner,stack=[]){

  assert.ok(
    !stack.includes(owner),
    'Import CSS cyclique : '+owner
  );

  const nextStack=[...stack,owner];

  let css=source.replace(
    /@import\s+(?:url\(\s*)?["']([^"']+)["']\s*\)?\s*;/gi,
    (_,reference)=>{

      const asset=resolveAsset(
        reference,
        owner
      );

      return inlineCSS(
        readFileSync(asset.file,'utf8'),
        asset.name,
        nextStack
      );
    }
  );

  assert.ok(
    !/@import\s/i.test(css),
    'Import CSS non traite : '+owner
  );

  css=css.replace(
    /url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*))\s*\)/gi,
    (_,a,b,c)=>{

      const reference=(a??b??c).trim();

      if(!reference)return 'url("")';

      const embedded=dataURI(
        reference,
        owner
      );

      return 'url("'+embedded+'")';
    }
  );

  return css;
}

const localModulePlugin={
  name:'standalone-pages-paths',

  setup(api){

    api.onResolve(
      {filter:/^\/StandardisationRadarChart\//},
      args=>{

        const asset=resolveAsset(
          args.path
        );

        return {path:asset.file};
      }
    );
  }
};

async function bundleModule(file){

  const result=await build({
    entryPoints:[file],
    bundle:true,
    write:false,
    splitting:false,
    format:'esm',
    platform:'browser',
    target:'es2022',
    legalComments:'inline',
    plugins:[localModulePlugin]
  });

  assert.equal(
    result.outputFiles.length,
    1,
    'Module non autonome : '+file
  );

  return result.outputFiles[0].text;
}

const moduleCache=new Map();

async function moduleDataURI(reference,owner){

  const asset=resolveAsset(
    reference,
    owner
  );

  if(!moduleCache.has(asset.file)){

    const bundled=await bundleModule(
      asset.file
    );

    moduleCache.set(
      asset.file,
      'data:text/javascript;base64,'+
        Buffer.from(bundled)
          .toString('base64')
    );
  }

  return moduleCache.get(asset.file);
}

function inlineDynamicClassicScripts(source,owner){

  if(owner!=='radar.html')return source;

  const pattern=
    /(\bscript2?\.src\s*=\s*)(["'])(lib\/cytoscape-(?:cola|dagre)\.js)\2/g;

  const matches=[...source.matchAll(pattern)];

  if(matches.length===0)return source;

  return source.replace(
    pattern,
    (_,assignment,quote,reference)=>{

      const asset=resolveAsset(
        reference,owner
      );

      const uri=
        'data:text/javascript;base64,'+
        readFileSync(asset.file)
          .toString('base64');

      console.log(
        'Dynamic classic script embedded:',
        reference
      );

      return assignment+JSON.stringify(uri);
    }
  );
}

async function inlineDynamicImports(source,owner){

  return replaceAsync(
    source,

    /\bimport\s*\(\s*(['"])((?:\.{1,2}\/|\/StandardisationRadarChart\/)[^'"]+)\1\s*\)/g,

    async (_,quote,reference)=>{

      const uri=await moduleDataURI(
        reference,
        owner
      );

      return 'import('+JSON.stringify(uri)+')';
    }
  );
}

function fixProfile(source,profile){

  const anchor=
    "const requested=params.getAll('profile');";

  assert.equal(
    source.split(anchor).length,
    2,
    'Ancrage profil absent ou ambigu'
  );

  return source.replace(
    anchor,
    'const requested=['+
      JSON.stringify(profile)+'];'
  );
}

function walk(directory){

  const result=[];

  for(const entry of readdirSync(
    directory,
    {withFileTypes:true}
  )){

    const file=join(
      directory,
      entry.name
    );

    if(entry.isSymbolicLink()){
      throw Error(
        'Lien symbolique inattendu : '+file
      );
    }

    if(entry.isDirectory()){

      result.push(...walk(file));

    }else if(entry.isFile()){

      result.push(file);
    }
  }

  return result;
}

function resourceTable(profile){

  const resources={};

  const extensions=new Set([
    '.json',
    '.csv',
    '.jsonl',
    '.gz',
    '.txt',
    '.svg',
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.webp',
    '.ico'
  ]);

  for(const file of walk(root)){

    const name=relative(root,file);

    if(
      !extensions.has(
        extname(name).toLowerCase()
      )
    ){
      continue;
    }

    if(
      name.includes('/.DS_Store') ||
      name.endsWith('.bak')
    ){
      continue;
    }

    if(profile==='viewer'){

      if(
        name.startsWith('catalog-distribution/') ||
        name==='radar-catalog-config.json'
      ){
        continue;
      }
    }

    resources[name]={
      type:mime(name),
      base64:readFileSync(file)
        .toString('base64')
    };
  }

  return resources;
}

function offlineBootstrap(resources,profile){

  const encoded=JSON.stringify(
    resources
  ).replaceAll('<','\\u003c');

  return `
<script>
(function(){
  'use strict';

  const resources=${encoded};

  const originalFetch=
    window.fetch.bind(window);

  const profile=${JSON.stringify(profile)};

  const directory=
    new URL('.',location.href).pathname;

  function resourceName(url){

    if(
      url.pathname.startsWith(
        '/StandardisationRadarChart/'
      )
    ){
      return decodeURIComponent(
        url.pathname.slice(
          '/StandardisationRadarChart/'.length
        )
      );
    }

    if(
      url.protocol==='file:' &&
      url.pathname.startsWith(directory)
    ){
      return decodeURIComponent(
        url.pathname.slice(directory.length)
      );
    }

    if(
      url.origin===location.origin &&
      url.pathname.startsWith(directory)
    ){
      return decodeURIComponent(
        url.pathname.slice(directory.length)
      );
    }

    return null;
  }

  function makeResponse(entry,url,head){

    const text=atob(entry.base64);

    const bytes=new Uint8Array(
      text.length
    );

    for(let i=0;i<text.length;i++){
      bytes[i]=text.charCodeAt(i);
    }

    const response=new Response(
      head?null:bytes,
      {
        status:200,
        headers:{
          'Content-Type':entry.type,
          'Content-Length':String(bytes.length)
        }
      }
    );

    Object.defineProperty(
      response,
      'url',
      {
        value:url.href,
        configurable:true
      }
    );

    return response;
  }

  window.fetch=async function(input,options){

    const reference=
      input instanceof Request
        ?input.url
        :String(input);

    const url=new URL(
      reference,
      location.href
    );

    if(
      url.protocol==='data:' ||
      url.protocol==='blob:'
    ){
      return originalFetch(input,options);
    }

    const method=(
      options?.method ||
      input?.method ||
      'GET'
    ).toUpperCase();

    if(
      method!=='GET' &&
      method!=='HEAD'
    ){
      throw Error(
        'Operation reseau non disponible en standalone'
      );
    }

    const key=resourceName(url);

    const entry=
      key!==null &&
      Object.hasOwn(resources,key)
        ?resources[key]
        :null;

    if(entry){

      return makeResponse(
        entry,
        url,
        method==='HEAD'
      );
    }

    console.warn(
      'Standalone resource unavailable:',
      reference
    );

    return new Response(
      null,
      {
        status:404,
        statusText:'Offline resource unavailable'
      }
    );
  };

  Object.defineProperty(
    window,
    '__radarStandalone',
    {
      value:Object.freeze({
        profile,
        sourceCommit:${JSON.stringify(sourceCommit)},
        resourceCount:Object.keys(
          resources
        ).length,
        resourceNames:Object.freeze(
          Object.keys(resources)
        )
      })
    }
  );
})();
</script>`;
}

async function generate(profile,filename){

  let scripts=0;
  let styles=0;
  let fixedProfiles=0;

  const resources=resourceTable(
    profile
  );

  // Preserve the original order of classic scripts.
  // Ignore commented-out HTML resources.

  const pattern=
    /<!--[\s\S]*?-->|<script\b([^>]*)>([\s\S]*?)<\/script\s*>|<style\b([^>]*)>([\s\S]*?)<\/style\s*>|<link\b([^>]*)>|<(img|source|input)\b([^>]*)>/gi;

  let html=await replaceAsync(

    sourceHTML,

    pattern,

    async (
      full,
      scriptAttrs,
      scriptBody,
      styleAttrs,
      styleBody,
      linkAttrs,
      mediaTag,
      mediaAttrs
    )=>{

      if(full.startsWith('<!--')){
        return full;
      }

      if(scriptAttrs!==undefined){

        const type=attr(
          scriptAttrs,
          'type'
        )||'';

        const src=attr(
          scriptAttrs,
          'src'
        );

        let source=scriptBody;

        let owner='radar.html';

        if(src){

          const asset=resolveAsset(src);

          owner=asset.name;

          if(type==='module'){

            source=await bundleModule(
              asset.file
            );

          }else{

            assert.ok(
              !/\b(async|defer)\b/i.test(
                scriptAttrs
              ),
              'Script classique asynchrone a qualifier : '+src
            );

            source=readFileSync(
              asset.file,
              'utf8'
            );
          }
        }

        if(
          owner==='js/radar-application-profile.js'
        ){

          source=fixProfile(
            source,
            profile
          );

          fixedProfiles++;
        }

        if(
          owner==='radar.html' ||
          owner.startsWith('js/')
        ){

          source=inlineDynamicClassicScripts(
            source,
            owner
          );

          source=await inlineDynamicImports(
            source,
            owner
          );
        }

        if(type==='module'){

          assert.ok(
            !/\bfrom\s*['"](?:\.|\/)/.test(source),
            'Import ES6 externe restant : '+owner
          );
        }

        scripts++;

        return '<script'+
          (type
            ?' type="'+type+'"'
            :'')+
          '>\n'+
          escapeScript(source)+
          '\n</script>';
      }

      if(styleAttrs!==undefined){

        styles++;

        return '<style'+styleAttrs+'>\n'+
          inlineCSS(
            styleBody,
            'radar.html'
          )+
          '\n</style>';
      }

      if(linkAttrs!==undefined){

        const rel=(
          attr(linkAttrs,'rel')||''
        ).toLowerCase();

        const href=attr(
          linkAttrs,
          'href'
        );

        if(rel==='modulepreload'){
          return '';
        }

        if(rel==='stylesheet' && href){

          const asset=resolveAsset(
            href
          );

          const css=inlineCSS(
            readFileSync(
              asset.file,
              'utf8'
            ),
            asset.name
          );

          const media=attr(
            linkAttrs,
            'media'
          );

          styles++;

          return '<style'+
            (media
              ?' media="'+media+'"'
              :'')+
            '>\n'+css+'\n</style>';
        }

        if(
          href &&
          /\bicon\b/.test(rel)
        ){

          return '<link rel="'+rel+
            '" href="'+
            dataURI(href,'radar.html')+
            '">';
        }

        if(
          href &&
          /preload|prefetch|manifest/.test(rel)
        ){
          throw Error(
            'Ressource link a qualifier : '+full
          );
        }

        return full;
      }

      if(mediaTag){

        const src=attr(
          mediaAttrs,
          'src'
        );

        if(!src)return full;

        const uri=dataURI(
          src,
          'radar.html'
        );

        return full.replace(
          /(\bsrc\s*=\s*)(?:"[^"]*"|'[^']*'|[^\s>]+)/i,
          '$1"'+uri+'"'
        );
      }

      return full;
    }
  );

  assert.equal(
    fixedProfiles,
    1,
    'Le profil doit etre embarque exactement une fois'
  );

  const head=/<head\b[^>]*>/i;

  assert.ok(head.test(html));

  html=html.replace(
    head,
    match=>match+'\n'+
      offlineBootstrap(
        resources,
        profile
      )
  );

  assert.ok(
    !/<script\b[^>]*\bsrc\s*=/i.test(
      html.replace(
        /<!--[\s\S]*?-->/g,
        ''
      )
    ),
    'Script externe restant'
  );

  const file=join(
    output,
    filename
  );

  writeFileSync(
    file,
    html,
    {flag:'wx'}
  );

  const bytes=Buffer.byteLength(
    html
  );

  console.log(
    JSON.stringify({
      profile,
      file,
      bytes,
      scripts,
      styles,
      embeddedResources:
        Object.keys(resources).length,
      catalogDistributionEmbedded:
        Object.keys(resources).some(
          name=>name.startsWith(
            'catalog-distribution/'
          )
        ),
      sha256:createHash('sha256')
        .update(html)
        .digest('hex')
    },null,2)
  );
}

await generate(
  'creator',
  'standardization-radar-creator.html'
);

await generate(
  'viewer',
  'standardization-radar-viewer.html'
);

console.log(
  'Deux applications candidates construites.'
);
