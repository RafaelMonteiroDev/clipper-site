import fs from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'

// Every page in every language (site.config.json; scripts/langs.mjs writes the translations
// first). Relative base: the same build works at rafaelmonteirodev.github.io/clipper-site/ and
// at the domain's root.
const config = JSON.parse(fs.readFileSync(resolve(import.meta.dirname, 'site.config.json'), 'utf8'))
const input: Record<string, string> = {}
for (const page of [...config.shared, ...Object.keys(config.pages)]) {
  const langs: string[] = config.pages[page] ?? ['pt-BR']
  for (const lang of langs) {
    const dir = config.languages[lang].dir
    const file = dir ? `${dir}/${page}` : page
    input[file.replace(/\.html$/, '').replace(/\//g, '-')] = resolve(import.meta.dirname, file)
  }
}

export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    rollupOptions: { input },
  },
})
