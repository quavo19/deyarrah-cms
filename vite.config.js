import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // Only needed for dev, but preview respects this too
    host: '0.0.0.0',
    allowedHosts: ['cms.platinumvaultltd.com'],
  },
})
