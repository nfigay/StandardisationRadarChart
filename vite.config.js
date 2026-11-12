import { defineConfig } from 'vite';
import { resolve, dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, cpSync } from 'node:fs';

const root = dirname(fileURLToPath(import.meta.url));
const legacyDirectories = ['js', 'lib', 'css', 'webfonts'];
const legacyFiles = [
    'ICS.csv',
    'src/domain/roadmap-published-projection.mjs'
  ];

// The legacy application depends on classic <script> tags and globals.
// Vite does not bundle classic scripts: preserve their original paths in dist.
function preserveLegacyAssets() {
  return {
    name: 'radarchart-preserve-legacy-assets',
    apply: 'build',
    writeBundle(options) {
      const dest = options.dir;
      if (!dest) throw new Error('Missing Vite output directory');
      for (const name of [...legacyDirectories, ...legacyFiles]) {
        const from = join(root, name);
        if (!existsSync(from)) continue;
        cpSync(from, join(dest, name), {
          recursive: true,
          force: true,
          errorOnExist: false,
          filter(resource) {
            const filename = basename(resource);
            return filename !== '.DS_Store' &&
              !/\.s14-.*-backup$|\.bak$/.test(filename);
          }
        });
      }
    }
  };
}

export default defineConfig(({ mode }) => {
  if (!['development', 'local', 'pages'].includes(mode)) {
    throw new Error(`Unsupported build mode: ${mode}`);
  }
  return {
    root,
    base: mode === 'pages' ? '/StandardisationRadarChart/' : './',
    plugins: [preserveLegacyAssets()],
    build: {
      outDir: resolve(root, `.radarchart-build/${mode === 'development' ? 'local' : mode}`),
      emptyOutDir: false,
      rollupOptions: {
        input: { radar: resolve(root, 'radar.html') }
      }
    }
  };
});
