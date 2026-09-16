import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({ root: 'src/frontend', plugins: [react(), tailwindcss()], server: { proxy: { '/api': 'http://127.0.0.1:3001' } }, build: { outDir: '../../dist/client', emptyOutDir: true } });

