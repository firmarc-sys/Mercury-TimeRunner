import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Preserve the canonical multi-page Mercury runtime in ../static.
    outDir: '../static/legacy-react',
    emptyOutDir: true,
  }
})
