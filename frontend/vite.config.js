import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_URL || 'http://localhost:8081',
        changeOrigin: true,
        secure: false
      },
      '/ws': {
        target: process.env.VITE_BACKEND_URL || 'http://localhost:8081',
        ws: true,
        changeOrigin: true,
        secure: false
      }
    }
  }
})