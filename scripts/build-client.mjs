import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';

const output=resolve('.radarchart-build/client');

if(existsSync(output)){
  console.error(
    'STOP: existing client distribution preserved:',output
  );
  process.exitCode=1;
}else{
  const commands=[
    [
      resolve('node_modules/.bin/vite'),
      ['build','--config','vite.client.config.js']
    ],
    [
      process.execPath,
      [
        'scripts/build-client-variants.mjs',
        'build',
        '.radarchart-build/client'
      ]
    ],
    [
      process.execPath,
      [
        'scripts/verify-client-build.mjs',
        '.radarchart-build/client',
        '--write-manifest'
      ]
    ],
    [
      process.execPath,
      [
        'scripts/verify-client-build.mjs',
        '.radarchart-build/client'
      ]
    ]
  ];

  for(const [program,args] of commands){
    const run=spawnSync(program,args,{stdio:'inherit'});
    if(run.error || run.status!==0){
      console.error(
        'Client build failed:',
        run.error?.message || run.status
      );
      process.exitCode=1;
      break;
    }
  }
}
