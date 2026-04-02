import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    headers: {
      'Cache-Control': 'no-store',
    },
  },
  preview: {
    port: 4173,
    headers: {
      'Cache-Control': 'no-store',
    },
  },
})
