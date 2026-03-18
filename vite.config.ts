import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // D3 and all d3-* sub-packages → neural-graph chunk
          if (id.includes('node_modules/d3') || id.includes('node_modules/d3-')) {
            return 'neural-graph'
          }
          // framer-motion and zustand → core chunk (shared across all zones)
          if (
            id.includes('node_modules/framer-motion') ||
            id.includes('node_modules/zustand')
          ) {
            return 'core'
          }
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
    globals: true,
    passWithNoTests: true,
    typecheck: {
      tsconfig: './tsconfig.test.json',
    },
  },
})