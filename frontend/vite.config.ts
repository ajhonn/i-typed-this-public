import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

const alias = {
  '@features': path.resolve(__dirname, 'src/features'),
  '@components': path.resolve(__dirname, 'src/components'),
  '@test': path.resolve(__dirname, 'src/test')
};

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias
  }
});
