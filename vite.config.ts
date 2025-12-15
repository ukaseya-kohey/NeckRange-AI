import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    host: '0.0.0.0',
    port: 4000,
    strictPort: false,
    allowedHosts: [
      '4000-itz4ud088uiwyg8nq8o7f-5c13a017.sandbox.novita.ai',
      '.sandbox.novita.ai'
    ]
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  publicDir: 'public',
  optimizeDeps: {
    exclude: ['@mediapipe/pose']
  }
})
