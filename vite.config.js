import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // ensures relative paths for JS/CSS
  build: {
    outDir: 'dist', // default, but explicit is better
    emptyOutDir: true // ensures old build files are cleared
  }
});
