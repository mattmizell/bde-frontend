import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/start-process': 'http://localhost:8010',
      '/events': 'http://localhost:8010',
      '/status': 'http://localhost:8010',
      '/summary': 'http://localhost:8010',
      '/download': 'http://localhost:8010',
      '/mappings': 'http://localhost:8010',
      '/api/mappings': 'http://localhost:8010',
    }
  }
})
