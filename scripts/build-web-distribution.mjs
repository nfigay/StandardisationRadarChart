import {
  readFileSync,
  writeFileSync,
  readdirSync,
  existsSync,
  cpSync,
  mkdirSync,
  rmSync,
  copyFileSync
} from 'node:fs';

import {
  join,
  resolve,
  relative,
  sep
} from 'node:path';

import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';

import {
  verifyProducts
} from './assemble-products.mjs';

import {
  verifyPagesMultiProducts
} from './prepare-pages-products.mjs';

export function contract(commit){
  return {
    format:'standardisation-radar-distributions',
    version:1,
    sourceCommit:commit,

    variants:['author','client'].flatMap(product=>
      ['standalone','bundled','modules'].map(mode=>({
        product,
        mode,
        requiresServer:mode!=='standalone',
        isoCatalogue:product==='author',

        status:product==='client' && mode==='bundled'
          ?'available'
          :'planned',

        entry:product==='client' && mode==='bundled'
          ?'client/client.html'
          :null,

        target:`${product}/${mode}/${
          mode==='standalone'
            ?`radar-${product}.html`
            :'index.html'
        }`
      }))
    ),

    compatibilityEntries:[
      'index.html',
      'radar.html',
      'author/radar.html',
      'client/client.html'
    ]
  };
}

export function inventory(directory){
  const root=resolve(directory);
  const files=[];

  function walk(dir){
    for(const entry of readdirSync(dir,{
      withFileTypes:true
    })){
      const full=join(dir,entry.name);

      const filename=relative(root,full)
        .split(sep).join('/');

      assert(
        !entry.isSymbolicLink(),
        'Symlink forbidden: '+filename
      );

      assert(
        ![
          '.git',
          'node_modules',
          'iso-open-data-cache',
          'iso-rss-cache',
          'tests',
          '.github'
        ].includes(entry.name),
        'Development resource: '+filename
      );

      if(entry.isDirectory()){
        walk(full);
      }else{
        assert(entry.isFile(),
          'Unsupported file: '+filename);

        if(filename==='site-manifest.json')
          continue;

        const data=readFileSync(full);

        files.push({
          path:filename,
          bytes:data.length,
          sha256:createHash('sha256')
            .update(data).digest('hex')
        });
      }
    }
  }

  walk(root);

  return files.sort((a,b)=>
    a.path.localeCompare(b.path,'en')
  );
}

export function verifyInventory(root,files){
  assert.deepEqual(
    inventory(root),
    files,
    'Site inventory mismatch'
  );
}

export function checkEntry(root,entry){
  const base=
    'https://example.invalid/StandardisationRadarChart/';

  const html=readFileSync(
    join(root,entry),'utf8'
  );

  for(const tag of html.matchAll(
    /<(?:script|link)\b[^>]*>/gi
  )){
    const match=tag[0].match(
      /\b(?:src|href)\s*=\s*(["'])(.*?)\1/i
    );

    if(!match)continue;

    const url=new URL(match[2],base+entry);

    if(url.origin!==new URL(base).origin)
      continue;

    assert(
      url.href.startsWith(base),
      'Resource outside project: '+url.href
    );

    const filename=decodeURIComponent(
      url.pathname.slice(
        new URL(base).pathname.length
      )
    );

    assert(
      existsSync(join(root,filename)),
      `Missing resource ${filename} in ${entry}`
    );
  }
}

function json(filename,data){
  writeFileSync(
    filename,
    JSON.stringify(data,null,2)+'\n',
    {flag:'wx'}
  );
}

export function verify(directory){
  const root=resolve(directory);

  const release=verifyProducts(root);

  const site=JSON.parse(readFileSync(
    join(root,'site-manifest.json'),'utf8'
  ));

  const distributions=JSON.parse(readFileSync(
    join(root,'distributions.json'),'utf8'
  ));

  assert.equal(
    site.format,
    'standardisation-radar-web-site'
  );

  assert.equal(site.version,1);

  assert.equal(
    site.sourceCommit,
    release.sourceCommit
  );

  assert.deepEqual(
    distributions,
    contract(release.sourceCommit)
  );

  verifyInventory(root,site.files);

  for(const resource of [
    '.nojekyll',
    'distributions.html',
    ...distributions.compatibilityEntries
  ]){
    assert(
      existsSync(join(root,resource)),
      'Missing entry: '+resource
    );
  }

  const historical=readFileSync(
    join(root,'index.html'),'utf8'
  );

  assert(
    historical.includes('WorkingGroup="PLM"'),
    'Historical PLM page missing'
  );

  for(const entry of [
    'index.html',
    'radar.html',
    'author/radar.html',
    'client/client.html'
  ]){
    checkEntry(root,entry);
  }

  for(const prefix of ['', 'author/']){
    assert(
      existsSync(join(
        root,
        prefix+'src/domain/roadmap-published-projection.mjs'
      )),
      'Export module missing: '+prefix
    );
  }

  const clientJS=inventory(
    join(root,'client')
  ).filter(f=>/\.(js|mjs)$/.test(f.path));

  assert.equal(
    clientJS.length,1,
    'Client must have one JS bundle'
  );

  return {
    sourceCommit:release.sourceCommit,
    files:site.files.length,
    variants:distributions.variants.length,
    available:distributions.variants.filter(
      v=>v.status==='available'
    ).length
  };
}

function portal(commit){
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport"
      content="width=device-width,initial-scale=1">
<title>Standardization Radar Chart - Distributions</title>
<style>
body {
  font:16px/1.6 system-ui,sans-serif;
  max-width:980px;
  margin:3rem auto;
  padding:1rem;
  background:#f5f7fa;
  color:#24364a
}
h1 {font-size:2rem}
section {
  background:white;
  padding:24px;
  margin:20px 0;
  border:1px solid #d5dfe8;
  border-radius:10px
}
.grid {
  display:grid;
  grid-template-columns:
    repeat(auto-fit,minmax(260px,1fr));
  gap:20px
}
a {color:#155b98}
.action {
  display:inline-block;
  padding:10px 16px;
  background:#155b98;
  color:white;
  border-radius:6px;
  text-decoration:none
}
table {
  border-collapse:collapse;
  width:100%
}
td,th {
  padding:12px;
  border-bottom:1px solid #ccd5df;
  text-align:left
}
small {color:#64748b}
</style>
</head>
<body>
<h1>Standardization Radar Chart</h1>
<p>Distributions du Créateur et du Client.</p>
<small>Livraison issue du commit ${commit}</small>

<div class="grid">
<section>
<h2>Créateur</h2>
<p>Édition des radars, catalogue ISO,
gestion des révisions et publication.</p>
<a class="action" href="author/radar.html">
Ouvrir le Créateur
</a>
<p><small>Distribution Web historique.</small></p>
</section>

<section>
<h2>Client</h2>
<p>Consultation des roadmaps publiées,
sans catalogue ISO global.</p>
<a class="action" href="client/client.html">
Ouvrir le Client
</a>
<p><small>Distribution JavaScript packagée.</small></p>
</section>
</div>

<section>
<h2>Six distributions cibles</h2>
<table>
<thead>
<tr><th>Mode</th><th>Créateur</th><th>Client</th></tr>
</thead>
<tbody>
<tr>
<td>Standalone HTML</td>
<td>Planifié</td>
<td>Planifié</td>
</tr>
<tr>
<td>Bundle JavaScript</td>
<td>Planifié</td>
<td><a href="client/client.html">Disponible</a></td>
</tr>
<tr>
<td>Modules ES6</td>
<td>Planifié</td>
<td>Planifié</td>
</tr>
</tbody>
</table>
</section>

<section>
<h2>Compatibilité historique</h2>
<p><a href="index.html">Radar PLM historique</a></p>
<p><a href="radar.html">Créateur historique</a></p>
</section>

<section>
<h2>Manifestes de livraison</h2>
<p><a href="distributions.json">
Contrat des six distributions</a></p>
<p><a href="release-manifest.json">
Intégrité des produits</a></p>
<p><a href="site-manifest.json">
Intégrité du site complet</a></p>
</section>
</body>
</html>
`;
}

export function build({
  staged,
  legacy,
  output,
  commit
}){
  assert(
    !existsSync(output),
    'Output exists: '+output
  );

  assert.equal(
    verifyPagesMultiProducts(staged).sourceCommit,
    commit
  );

  mkdirSync(output,{recursive:true});

  try{
    cpSync(staged,output,{
      recursive:true,
      force:false,
      errorOnExist:true
    });

    // Preserve the historical PLM home page.
    copyFileSync(
      legacy,
      join(output,'index.html')
    );

    writeFileSync(
      join(output,'.nojekyll'),''
    );

    json(
      join(output,'distributions.json'),
      contract(commit)
    );

    writeFileSync(
      join(output,'distributions.html'),
      portal(commit),
      {flag:'wx'}
    );

    json(
      join(output,'site-manifest.json'),
      {
        format:'standardisation-radar-web-site',
        version:1,
        sourceCommit:commit,
        files:inventory(output)
      }
    );

    return verify(output);

  }catch(error){
    rmSync(output,{
      recursive:true,
      force:true
    });

    throw error;
  }
}

const invoked=process.argv[1] &&
  resolve(process.argv[1])===
    fileURLToPath(import.meta.url);

if(invoked){
  const mode=process.argv[2];

  assert(
    ['build','verify'].includes(mode),
    'Expected build or verify'
  );

  const commit=execFileSync(
    'git',
    ['rev-parse','--short','HEAD'],
    {encoding:'utf8'}
  ).trim();

  const result=mode==='build'
    ?build({
      staged:'.radarchart-build/pages-multiproduct',
      legacy:'index.html',
      output:'dist',
      commit
    })
    :verify(process.argv[3]||'dist');

  console.log('WEB DISTRIBUTION OK');

  console.log(
    JSON.stringify(result,null,2)
  );
}
