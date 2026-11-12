import {defineConfig} from 'vite';
import {resolve} from 'node:path';

export default defineConfig({
  root:process.cwd(),
  base:'./',
  publicDir:false,
  build:{
    modulePreload:false,
    outDir:resolve('.radarchart-build/client'),
    emptyOutDir:false,
    assetsDir:'assets',
    rollupOptions:{
      input:{
        client:resolve('client.html')
      }
    }
  }
});
