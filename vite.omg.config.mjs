// Development Creator only: preserve the existing Vite configuration.
// Build, standalone and Pages continue to use vite.config.js unchanged.
import {defineConfig,mergeConfig} from 'vite';
import existing from './vite.config.js';
import {omgLocalBridge} from './tools/radar-omg-local-bridge.mjs';

export default defineConfig(async env=>{
  const base=await (typeof existing==='function'?existing(env):existing);
  return mergeConfig(base||{},{plugins:[omgLocalBridge()]});
});
