import {
  existsSync,readFileSync,readdirSync,
  lstatSync,writeFileSync
} from 'node:fs';
import {resolve,relative,join} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const MANIFEST='distribution-manifest.json';

export function inventory(root){
  const result=[];

  function walk(dir){
    for(const entry of readdirSync(dir,{withFileTypes:true})){
      const file=join(dir,entry.name);

      if(entry.isSymbolicLink()){
        throw Error('Symbolic link forbidden: '+file);
      }

      if(entry.isDirectory()){
        walk(file);
      }else if(entry.isFile()){
        const name=relative(root,file).replaceAll('\\','/');
        if(name!==MANIFEST)result.push(name);
      }else{
        throw Error('Unsupported output entry: '+file);
      }
    }
  }

  walk(root);
  return result.sort();
}

export function verifyClientBuild(root,{
  writeManifest=false
}={}){
  const directory=resolve(root);
  if(!existsSync(directory)){
    throw Error('Missing client distribution: '+directory);
  }

  const files=inventory(directory);
  const html='client.html';

  if(!files.includes(html)){
    throw Error('Missing client.html');
  }

  const forbiddenFiles=[
    'radar.html',
    'radar-catalog-config.json',
    'catalog-distribution/',
    'iso-open-data-cache/',
    'iso-rss-cache/',
    'lib/',
    'webfonts/',
    'js/radar.js',
    'js/blips.js'
  ];

  for(const name of files){
    if(forbiddenFiles.some(bad=>
      name===bad || name.startsWith(bad)
    )){
      throw Error('Forbidden creator asset: '+name);
    }
  }

  const htmlContent=readFileSync(join(directory,html),'utf8');

  if(!htmlContent.includes('id="package-file"')){
    throw Error('Missing client file picker');
  }

  if(!htmlContent.includes('type="module"')){
    throw Error('Missing bundled module entry');
  }

  const forbiddenReferences=[
    /catalog-distribution\//i,
    /radar-catalog-config\.json/i,
    /radar-s14-z-sources/i,
    /radar-catalog-persistence/i,
    /radar-iso-toolbar/i
  ];

  let jsCount=0;
  const assetEntries=[];

  for(const name of files){
    const absolute=join(directory,name);
    const stat=lstatSync(absolute);

    if(!stat.isFile()){
      throw Error('Unexpected non-file: '+name);
    }

    const bytes=readFileSync(absolute);

    if(name.endsWith('.js') || name.endsWith('.html')){
      const content=bytes.toString('utf8');

      if(name.endsWith('.js')){
        jsCount++;
      }

      for(const pattern of forbiddenReferences){
        if(pattern.test(content)){
          throw Error('Forbidden client dependency: '+name);
        }
      }
    }

    assetEntries.push({
      path:name,
      bytes:bytes.length,
      sha256:createHash('sha256').update(bytes).digest('hex')
    });
  }

  if(jsCount===0){
    throw Error('No JavaScript client bundle emitted');
  }

  if(assetEntries.length>30){
    throw Error('Unexpectedly large client asset inventory');
  }

  const manifest={
    format:'standardisation-roadmap-client-distribution',
    version:1,
    product:'client',
    entry:'client.html',
    catalogueBundled:false,
    files:assetEntries
  };

  const manifestPath=join(directory,MANIFEST);

  if(writeManifest){
    if(existsSync(manifestPath)){
      throw Error('Manifest already exists');
    }

    writeFileSync(
      manifestPath,
      JSON.stringify(manifest,null,2)+'\n',
      {flag:'wx'}
    );
  }else{
    if(!existsSync(manifestPath)){
      throw Error('Distribution manifest missing');
    }

    const existing=JSON.parse(
      readFileSync(manifestPath,'utf8')
    );

    if(JSON.stringify(existing)!==JSON.stringify(manifest)){
      throw Error('Client distribution manifest mismatch');
    }
  }

  return manifest;
}

const invoked=process.argv[1] &&
  resolve(process.argv[1])===fileURLToPath(import.meta.url);

if(invoked){
  try{
    const output=process.argv[2] ||
      '.radarchart-build/client';

    const manifest=verifyClientBuild(output,{
      writeManifest:process.argv.includes('--write-manifest')
    });

    console.log('CLIENT BUILD VALID');
    console.log('Entry:',manifest.entry);
    console.log('Files:',manifest.files.length);
    console.log('Catalogue bundled:',manifest.catalogueBundled);
    console.log('SHA-256 manifest: OK');
  }catch(error){
    console.error('CLIENT BUILD INVALID:',error.message);
    process.exitCode=1;
  }
}
