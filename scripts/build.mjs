import { build } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

async function buildAll() {
  console.log('📦 Building GitOctant extension...');

  // 1. Build UI Pages (popup & newtab)
  console.log('🔹 Building HTML surfaces (popup, newtab)...');
  await build({
    root,
    base: './',
    configFile: false,
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(root, 'src'),
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      modulePreload: false,
      rollupOptions: {
        input: {
          popup: path.resolve(root, 'popup.html'),
          newtab: path.resolve(root, 'newtab.html'),
        },
      },
    },
  });

  // 2. Build Service Worker as Standalone Bundle
  console.log('🔹 Building Background Service Worker...');
  await build({
    root,
    configFile: false,
    resolve: {
      alias: {
        '@': path.resolve(root, 'src'),
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      lib: {
        entry: path.resolve(root, 'src/background/service-worker.ts'),
        name: 'serviceWorker',
        formats: ['iife'],
        fileName: () => 'service-worker.js',
      },
      rollupOptions: {
        output: {
          inlineDynamicImports: true,
        },
      },
    },
  });

  // 3. Copy Manifest & Icons
  console.log('🔹 Copying manifest and icons...');
  fs.copyFileSync(
    path.resolve(root, 'public/manifest.json'),
    path.resolve(root, 'dist/manifest.json')
  );

  const iconsSrc = path.resolve(root, 'public/icons');
  const iconsDist = path.resolve(root, 'dist/icons');
  if (fs.existsSync(iconsSrc)) {
    if (!fs.existsSync(iconsDist)) {
      fs.mkdirSync(iconsDist, { recursive: true });
    }
    for (const icon of fs.readdirSync(iconsSrc)) {
      fs.copyFileSync(path.join(iconsSrc, icon), path.join(iconsDist, icon));
    }
  }

  console.log('✅ Build complete! Extension ready in dist/');
}

buildAll().catch((err) => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
