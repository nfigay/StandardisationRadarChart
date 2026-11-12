import {
  existsSync, readFileSync, writeFileSync, copyFileSync,
  cpSync, mkdirSync, rmSync
} from 'node:fs';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {verifyProducts} from './assemble-products.mjs';

function check(ok,message){
  if(!ok)throw Error(message);
}

export function verifyPagesMultiProducts(outputDir){
  const out=resolve(outputDir);
  const manifest=verifyProducts(out);

  for(const name of [
    'radar.html',
    'index.html',
    'radar-catalog-config.json',
    'catalog-distribution/manifest.json',
    'author/radar.html',
    'author/radar-catalog-config.json',
    'client/client.html',
    'client/distribution-manifest.json',
    'release-manifest.json'
  ]){
    check(existsSync(join(out,name)),
      'Missing Pages asset: '+name);
  }

  const index=readFileSync(
    join(out,'index.html'),'utf8'
  );
  check(index.includes('url=./radar.html'),
    'Historical index redirect changed');

  const rootRadar=readFileSync(join(out,'radar.html'));
  const authorRadar=readFileSync(
    join(out,'author/radar.html')
  );
  check(rootRadar.equals(authorRadar),
    'Historical Creator differs from author entry');

  check(!existsSync(join(out,'client/catalog-distribution')),
    'ISO catalogue leaked into Client');

  check(!existsSync(join(out,'client/radar.html')),
    'Creator leaked into Client');

  return manifest;
}

export function preparePagesMultiProducts({
  pagesDir,
  productsDir,
  outputDir
}){
  const pages=resolve(pagesDir);
  const products=resolve(productsDir);
  const output=resolve(outputDir);

  check(existsSync(join(pages,'radar.html')),
    'Missing historical Pages build');

  // index.html is normally produced by the deployment workflow,
  // after the historical Vite build. It is optional at this stage.

  check(!existsSync(join(pages,'author')),
    'Pages already contain author subtree');
  check(!existsSync(join(pages,'client')),
    'Pages already contain client subtree');
  check(!existsSync(join(pages,'release-manifest.json')),
    'Pages already contain release manifest');

  check(!existsSync(output),
    'Final Pages output already exists');

  verifyProducts(products);

  mkdirSync(output,{recursive:true});

  try{
    // Keep historical root files intact.
    cpSync(pages,output,{
      recursive:true,
      force:false,
      errorOnExist:true
    });

    // Preserve an existing redirect or generate the exact
    // historical redirect when testing a local Pages build.
    const redirect=join(output,'index.html');
    if(!existsSync(redirect)){
      writeFileSync(redirect,
        '<!doctype html><html lang="fr"><head><meta charset="utf-8">'+
        '<meta http-equiv="refresh" content="0; url=./radar.html">'+
        '<title>Standardization Radar Chart</title></head>'+
        '<body><a href="./radar.html">Ouvrir le radar</a></body></html>\n',
        {flag:'wx'}
      );
    }

    cpSync(join(products,'author'),
      join(output,'author'),{
        recursive:true,
        force:false,
        errorOnExist:true
      });

    cpSync(join(products,'client'),
      join(output,'client'),{
        recursive:true,
        force:false,
        errorOnExist:true
      });

    copyFileSync(
      join(products,'release-manifest.json'),
      join(output,'release-manifest.json')
    );

    // Verify the actual final published tree.
    const result=verifyPagesMultiProducts(output);

    check(
      readFileSync(join(pages,'radar.html')).equals(
        readFileSync(join(output,'radar.html'))
      ),
      'Historical Creator modified during staging'
    );

    console.log('PAGES MULTI-PRODUCT STAGING OK');
    console.log('Source commit:',result.sourceCommit);
    console.log('Author files:',
      result.products.author.fileCount);
    console.log('Client files:',
      result.products.client.fileCount);
    return result;
  }catch(error){
    // Remove only the destination created by this operation.
    rmSync(output,{recursive:true,force:true});
    throw error;
  }
}

const invoked=process.argv[1] &&
  resolve(process.argv[1])===
    fileURLToPath(import.meta.url);

if(invoked){
  try{
    const mode=process.argv[2];
    const output='.radarchart-build/pages-multiproduct';

    if(mode==='prepare'){
      preparePagesMultiProducts({
        pagesDir:'.radarchart-build/pages',
        productsDir:'.radarchart-build/products',
        outputDir:output
      });
    }else if(mode==='verify'){
      const m=verifyPagesMultiProducts(output);
      console.log('PAGES MULTI-PRODUCT VERIFIED');
      console.log('Source commit:',m.sourceCommit);
    }else{
      throw Error('Expected prepare or verify');
    }
  }catch(error){
    console.error('PAGES MULTI-PRODUCT ERROR:',
      error.message);
    process.exitCode=1;
  }
}
