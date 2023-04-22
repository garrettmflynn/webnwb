/// <reference types='vitest' />
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import ViteYaml from '@modyfi/vite-plugin-yaml';

export default defineConfig({
  base: '',
  build: {
    outDir: 'dist',
    lib: {
      name: 'nwb',
      entry: {
        index: 'src/index'
      }
    },
    rollupOptions: {
      output: {
        exports: 'named',
      }
    }
  },
  test: {
    environment: 'jsdom'
  },
  plugins: [
    dts(),
    ViteYaml()
  ],
})
