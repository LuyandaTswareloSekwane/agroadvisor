import { defineConfig, searchForWorkspaceRoot } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rolldownOptions: {
      output: {
        // Separate cacheable vendor chunks keep the Firebase SDK from bloating one shared chunk.
        codeSplitting: {
          groups: [
            { name: 'firebase-firestore', test: /node_modules[\\/](@firebase[\\/]firestore|firebase[\\/]firestore)/, priority: 30 },
            { name: 'firebase-auth', test: /node_modules[\\/](@firebase[\\/]auth|firebase[\\/]auth)/, priority: 20 },
            { name: 'firebase-core', test: /node_modules[\\/](@firebase|firebase)[\\/]/, priority: 10 },
          ],
        },
      },
    },
  },
  server: {
    fs: {
      // Allow the shared knowledge base (../config) without exposing the rest of the repo.
      allow: [searchForWorkspaceRoot(process.cwd()), '../config'],
    },
    // Forward /api calls to the local Worker (wrangler dev) during development.
    proxy: {
      // 127.0.0.1 rather than localhost: wrangler listens on IPv4 only.
      '/api': 'http://127.0.0.1:8787',
    },
  },
});
