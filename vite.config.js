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

  build: {
    target: 'esnext',
    lib: {
      name: 'nwb',
      entry: 'src/index',
      fileName: (format) => `index.${format}.js`,
    },
    rollupOptions: {
      external: [
        'hdf5-io'
      ],
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
