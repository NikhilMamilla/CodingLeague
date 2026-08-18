import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Increase chunk size warning limit — recharts + firebase are large
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          charts:   ['recharts'],
          router:   ['react-router-dom'],
          // Force db.ts into a single shared chunk so module-level singletons
          // (cache variables, in-flight promise) are shared across all lazy page
          // chunks that import from it. Without this, Rollup can duplicate the
          // module across multiple lazy chunks giving each its own cache instance,
          // which is why getBasicParticipants() was firing two network requests.
          db:       ['./src/lib/db.ts', './src/lib/supabase.ts'],
        },
      },
    },
  },
});
