import { resolve } from 'node:path'
import { defineConfig } from 'vite'

// Relative base: the same build works at rafaelmonteirodev.github.io/clipper-site/ and locally.
export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    rollupOptions: {
      input: {
        index: resolve(import.meta.dirname, 'index.html'),
        terms: resolve(import.meta.dirname, 'terms.html'),
        privacy: resolve(import.meta.dirname, 'privacy.html'),
        refund: resolve(import.meta.dirname, 'refund.html'),
        copyright: resolve(import.meta.dirname, 'copyright.html'),
      },
    },
  },
})
