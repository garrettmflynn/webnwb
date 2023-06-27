/// <reference types='vitest' />
import { defineConfig } from 'vite'

export default defineConfig({
  base: '',

  build: {
    target: 'esnext',
    lib: {
      name: 'dandi',
      entry: './src/index',
      fileName: (format) => `index.${format}.js`,
    }
  },
})
