import { paraglideVitePlugin } from '@inlang/paraglide-js'
import viteReact from '@vitejs/plugin-react'
import { URL, fileURLToPath } from 'node:url'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    paraglideVitePlugin({
      outdir: './src/paraglide',
      project: './project.inlang',
      strategy: ['cookie', 'localStorage', 'baseLocale'],
    }),
    viteTsConfigPaths({ projects: ['./tsconfig.json'] }),
    viteReact(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    env: {
      VITE_API_BASE_URL: 'http://localhost:7000',
      VITE_MOCK_AUTH: 'false',
      VITE_MOCK_DOCUMENTS: 'false',
      VITE_MOCK_USER_KEYS: 'false',
    },
  },
})
