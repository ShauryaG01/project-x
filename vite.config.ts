import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { copyFileSync, mkdirSync, existsSync, writeFileSync, readdirSync } from 'fs';

// Polyfill for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function copyExtensionFiles() {
  return {
    name: 'copy-extension-files',
    closeBundle() {
      // Find the JS and CSS files in assets
      const assetsDir = path.resolve(__dirname, 'dist/assets');
      const assetFiles = readdirSync(assetsDir);
      const jsFile = assetFiles.find(file => file.endsWith('.js') && !file.endsWith('.map'));
      const cssFile = assetFiles.find(file => file.endsWith('.css'));
      
      if (!jsFile || !cssFile) {
        console.error('Could not find asset files');
        return;
      }

      // Create basic HTML files
      const popupHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MetabaseNL</title>
  <link rel="stylesheet" href="assets/${cssFile}">
</head>
<body>
  <div id="root"></div>
  <script src="assets/${jsFile}"></script>
  <script src="popup/index.js"></script>
</body>
</html>`;

      const settingsHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MetabaseNL Settings</title>
  <link rel="stylesheet" href="assets/${cssFile}">
</head>
<body>
  <div id="root"></div>
  <script src="assets/${jsFile}"></script>
  <script src="settings/index.js"></script>
</body>
</html>`;

      // Copy manifest
      copyFileSync(
        path.resolve(__dirname, 'manifest.json'),
        path.resolve(__dirname, 'dist/manifest.json')
      );
      
      // Create icons directory
      const iconsDir = path.resolve(__dirname, 'dist/icons');
      if (!existsSync(iconsDir)) {
        mkdirSync(iconsDir, { recursive: true });
      }
      
      // Copy icons
      const iconSizes = [16, 48, 128];
      iconSizes.forEach(size => {
        try {
          copyFileSync(
            path.resolve(__dirname, `icons/icon${size}.png`),
            path.resolve(__dirname, `dist/icons/icon${size}.png`)
          );
        } catch (err) {
          // Create empty file
          writeFileSync(path.resolve(__dirname, `dist/icons/icon${size}.png`), '');
        }
      });
      
      // Write HTML files
      writeFileSync(path.resolve(__dirname, 'dist/popup.html'), popupHtml);
      writeFileSync(path.resolve(__dirname, 'dist/settings.html'), settingsHtml);
    }
  };
}

export default defineConfig({
  plugins: [react(), copyExtensionFiles()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        background: path.resolve(__dirname, 'src/background/index.ts'),
        popup: path.resolve(__dirname, 'src/pages/popup.tsx'),
        settings: path.resolve(__dirname, 'src/pages/settings.tsx'),
        metabase: path.resolve(__dirname, 'src/content-scripts/metabase.ts'),
      },
      output: {
        entryFileNames: (chunk) => {
          if (chunk.name === 'background') {
            return 'background.js';
          }
          if (chunk.name === 'metabase') {
            return 'content-scripts/metabase.js';
          }
          return '[name]/index.js';
        },
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
}); 