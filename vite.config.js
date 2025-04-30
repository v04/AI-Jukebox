// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  root: '.',         // <-- now index.html is here
  base: './',
  server: {
    port: 5173
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})
