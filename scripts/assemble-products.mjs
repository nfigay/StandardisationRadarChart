import {
  existsSync,readFileSync,writeFileSync,
  readdirSync,cpSync,mkdirSync,rmSync
} from 'node:fs';

import {resolve,join,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

import {
  verifyClientBuild
} from './verify-client-build.mjs';

export const RELEASE_FORMAT =
  'standardisation-radar-multi-product';

function assert(condition,message){
  if(!condition)throw Error(message);
}

function digest(buffer){
  return createHash('sha256').update(buffer).digest('hex');
}

function collect(root){
  const result=[];

  function visit(directory){
    for(const item of readdirSync(directory,{
      withFileTypes:true
    })){
      const absolute=join(directory,item.name);

      assert(!item.isSymbolicLink(),
        'Symlink forbidden: '+absolute);

      if(item.isDirectory()){
        visit(absolute);
      }else{
        assert(item.isFile(),
          'Unsupported entry: '+absolute);

        const path=relative(root,absolute)
          .replaceAll('\\','/');

        assert(!path.startsWith('../'),
          'Path escaped distribution: '+path);

        const contents=readFileSync(absolute);

        result.push({
          path,
          bytes:contents.length,
          sha256:digest(contents)
        });
      }
    }
  }

  visit(root);
  return result.sort((a,b)=>
    a.path.localeCompare(b.path,'en')
  );
}

function checkProductSeparation(author,client){
  assert(existsSync(join(author,'radar.html')),
    'Creator radar.html missing');

  assert(existsSync(join(author,'catalog-distribution',
    'manifest.json')),
    'Creator ISO distribution missing');

  assert(existsSync(join(author,'radar-catalog-config.json')),
    'Creator ISO configuration missing');

  const result=verifyClientBuild(client);
  assert(result.catalogueBundled===false,
    'Client must not bundle ISO catalogue');

  assert(!existsSync(join(client,'radar.html')),
    'Creator application included in Client');

  assert(!existsSync(join(client,'catalog-distribution')),
    'ISO catalogue included in Client');
}

function productManifest(name,directory,entry){
  const files=collect(directory);

  assert(files.some(file=>file.path===entry),
    'Missing entry: '+entry);

  return {
    product:name,
    entry,
    files,
    fileCount:files.length,
    totalBytes:files.reduce(
      (sum,file)=>sum+file.bytes,0
    )
  };
}

export function assembleProducts({
  authorDir,
  clientDir,
  outputDir,
  commit
}){
  const author=resolve(authorDir);
  const client=resolve(clientDir);
  const output=resolve(outputDir);

  assert(typeof commit==='string' &&
    /^[0-9a-f]{7,40}$/.test(commit),
    'Invalid Git commit');

  assert(!existsSync(output),
    'Output already exists: '+output);

  checkProductSeparation(author,client);

  // Create only after all input preflight checks succeed.
  mkdirSync(output,{recursive:true});

  try{
    cpSync(author,join(output,'author'),{
      recursive:true,errorOnExist:true,force:false
    });

    cpSync(client,join(output,'client'),{
      recursive:true,errorOnExist:true,force:false
    });

    const manifest={
      format:RELEASE_FORMAT,
      version:1,
      sourceCommit:commit,
      products:{
        author:productManifest(
          'author',join(output,'author'),'radar.html'
        ),
        client:productManifest(
          'client',join(output,'client'),'client.html'
        )
      }
    };

    writeFileSync(
      join(output,'release-manifest.json'),
      JSON.stringify(manifest,null,2)+'\n',
      {flag:'wx'}
    );

    verifyProducts(output);
    return manifest;
  }catch(error){
    // Only the newly created destination is removed.
    rmSync(output,{recursive:true,force:true});
    throw error;
  }
}

export function verifyProducts(outputDir){
  const output=resolve(outputDir);
  const path=join(output,'release-manifest.json');

  assert(existsSync(path),'Missing release manifest');

  const recorded=JSON.parse(
    readFileSync(path,'utf8')
  );

  assert(recorded.format===RELEASE_FORMAT &&
    recorded.version===1,
    'Unsupported release format');

  assert(/^[0-9a-f]{7,40}$/.test(
    recorded.sourceCommit
  ),'Invalid release commit');

  checkProductSeparation(
    join(output,'author'),
    join(output,'client')
  );

  const expected={
    author:productManifest(
      'author',join(output,'author'),'radar.html'
    ),
    client:productManifest(
      'client',join(output,'client'),'client.html'
    )
  };

  assert(
    JSON.stringify(recorded.products)===
    JSON.stringify(expected),
    'Release file inventory or hashes mismatch'
  );

  return recorded;
}

const invoked=process.argv[1] &&
  resolve(process.argv[1])===
    fileURLToPath(import.meta.url);

if(invoked){
  try{
    const mode=process.argv[2];
    const output=process.argv[3] ||
      '.radarchart-build/products';

    if(mode==='assemble'){
      const commit=process.argv[4];

      const result=assembleProducts({
        authorDir:'.radarchart-build/pages',
        clientDir:'.radarchart-build/client',
        outputDir:output,
        commit
      });

      console.log('MULTI-PRODUCT ASSEMBLY OK');
      console.log('Commit:',result.sourceCommit);
    }else if(mode==='verify'){
      const result=verifyProducts(output);
      console.log('MULTI-PRODUCT RELEASE VALID');
      console.log('Commit:',result.sourceCommit);
    }else{
      throw Error('Usage: assemble|verify [output] [commit]');
    }

    for(const name of ['author','client']){
      const product=verifyProducts(output).products[name];

      console.log(
        name+':',
        product.fileCount+' files,',
        product.totalBytes+' bytes'
      );
    }
  }catch(error){
    console.error('MULTI-PRODUCT ERROR:',error.message);
    process.exitCode=1;
  }
}
