import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// In development the browser talks only to the Vite server (port 5173). Requests under /api are forwarded
// to the Express backend, so the API is same-origin and no CORS configuration is needed.
const apiTarget = process.env.CYBERLAB_API_URL ?? 'http://127.0.0.1:4000'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': { target: apiTarget, changeOrigin: true },
    },
  },
})
