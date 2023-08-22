/// <reference types='vitest' />
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import ViteYaml from '@modyfi/vite-plugin-yaml';

export default defineConfig({
  base: '',

  // worker: {
  //   format: 'es'
  // },

  optimizeDeps: {
    exclude: [
      'hdf5-io'
    ]
  },

  test: {
    environment: 'jsdom'
  },
  
  plugins: [
    dts(),
    ViteYaml()
  ],
})
