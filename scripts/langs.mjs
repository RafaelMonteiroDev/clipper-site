// The site in every language, from the Portuguese pages (the source).
//
//   node scripts/langs.mjs            write es/, en/, tr/ (and the hreflang links of every page)
//   node scripts/langs.mjs --missing  list the texts a language still lacks, as JSON to fill in
//
// Each page listed in site.config.json is read, and every visible text and the texts of
// placeholder, aria-label, alt, title and the description metas are looked up in
// i18n/<lang>.json (keyed by the Portuguese text, spaces collapsed). A page whose texts aren't
// all translated stops the build: the site never ships half in Portuguese.
// - An element with data-words (the karaoke captions) is translated as one sentence and split
//   back into one <span> per word.
// - Elements with translate="no" or a lang of their own are left as they are.
// - Relative links are rewritten for the language's folder: to the same page in that language
//   when it exists there, to the shared page (terms, privacy...) otherwise.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { HTMLElement, TextNode, parse } from 'node-html-parser'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const config = JSON.parse(fs.readFileSync(path.join(root, 'site.config.json'), 'utf8'))
const ATTRS = ['placeholder', 'aria-label', 'alt', 'title']
const METAS = ['description', 'og:title', 'og:description', 'twitter:title', 'twitter:description']
const SKIP = new Set(['script', 'style', 'code', 'svg', 'canvas'])
const norm = (s) => s.replace(/\s+/g, ' ').trim()
const wordy = (s) => /\p{L}/u.test(s)
const missingMode = process.argv.includes('--missing')

// names and terms that stay as they are in every language (i18n/same.json)
const same = new Set(JSON.parse(fs.readFileSync(path.join(root, 'i18n', 'same.json'), 'utf8')))
const dictionaries = {}
for (const lang of Object.keys(config.languages)) {
  if (lang === 'pt-BR') continue
  const file = path.join(root, 'i18n', `${lang}.json`)
  dictionaries[lang] = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {}
}

function urlOf(page, lang) {
  const dir = config.languages[lang].dir
  const p = page === 'index.html' ? '' : page
  return `${config.url}/${dir ? `${dir}/` : ''}${p}`
}

function langLinks(page) {
  const langs = config.pages[page]
  return langs
    .map((l) => `<link rel="alternate" hreflang="${l}" href="${urlOf(page, l)}" />`)
    .concat(`<link rel="alternate" hreflang="x-default" href="${urlOf(page, 'en' in config.languages && langs.includes('en') ? 'en' : 'pt-BR')}" />`)
    .join('\n    ')
}

function switcher(page, current, depth) {
  const up = '../'.repeat(depth)
  return config.pages[page]
    .map((l) => {
      const dir = config.languages[l].dir
      const href = `${up}${dir ? `${dir}/` : ''}${page}`
      const label = l === 'pt-BR' ? 'PT' : l.toUpperCase()
      return `<a href="${href}" hreflang="${l}" lang="${l}"${l === current ? ' aria-current="true"' : ''} title="${config.languages[l].name}">${label}</a>`
    })
    .join('')
}

/** The head's hreflang block and the language switcher, for one version of a page. */
function decorate(html, page, lang, depth) {
  const block = `<!-- langs -->\n    <link rel="canonical" href="${urlOf(page, lang)}" />\n    ${langLinks(page)}\n    <!-- /langs -->`
  html = html.replace(/<!-- langs -->[\s\S]*?<!-- \/langs -->/, block)
  if (!html.includes('<!-- langs -->')) html = html.replace('</head>', `    ${block}\n  </head>`)
  return html.replace(/(<nav class="lang-switch"[^>]*>)[\s\S]*?(<\/nav>)/, `$1${switcher(page, lang, depth)}$2`)
}

function rewriteLinks(doc, page, lang) {
  const fromDir = path.posix.dirname(page)
  const outDir = path.posix.join(config.languages[lang].dir, fromDir)
  for (const el of doc.querySelectorAll('[href], [src]')) {
    for (const attr of ['href', 'src']) {
      const value = el.getAttribute(attr)
      if (!value || /^([a-z]+:|#|\/|\?)/i.test(value) || value.startsWith('data:')) continue
      const [target, hash = ''] = value.split('#')
      const fromRoot = path.posix.normalize(path.posix.join(fromDir, target || page))
      // the page in this language, else in English, else the Portuguese (or shared) one
      const langs = config.pages[fromRoot] ?? []
      const use = langs.includes(lang) ? lang : langs.includes('en') ? 'en' : 'pt-BR'
      const dest = path.posix.join(config.languages[use].dir, fromRoot)
      let rel = path.posix.relative(outDir || '.', dest) || path.posix.basename(dest)
      if (target === '' || target.endsWith('/')) rel = rel.replace(/index\.html$/, '')
      el.setAttribute(attr, rel + (hash ? `#${hash}` : ''))
    }
  }
}

function translate(page, lang, missing) {
  const dict = dictionaries[lang]
  const source = fs.readFileSync(path.join(root, page), 'utf8')
  const doc = parse(source, { comment: true, blockTextElements: { script: true, style: true, noscript: true, pre: true } })
  const look = (text) => {
    const key = norm(text)
    if (!wordy(key) || same.has(key)) return text
    if (dict[key] === undefined || dict[key] === '') {
      missing.add(key)
      return text
    }
    const lead = text.match(/^\s*/)[0]
    const tail = text.match(/\s*$/)[0]
    return lead + dict[key] + tail
  }
  const walk = (node) => {
    if (node instanceof HTMLElement) {
      const tag = node.rawTagName?.toLowerCase()
      if (SKIP.has(tag) || node.getAttribute('translate') === 'no') return
      if (node.getAttribute('lang') && node !== doc.querySelector('html')) return
      for (const attr of ATTRS) {
        const value = node.getAttribute(attr)
        if (value && wordy(value)) node.setAttribute(attr, look(value))
      }
      if (tag === 'meta' && METAS.includes(node.getAttribute('name') ?? node.getAttribute('property') ?? '')) {
        node.setAttribute('content', look(node.getAttribute('content') ?? ''))
      }
      if (node.getAttribute('data-words') !== undefined) {
        const sentence = norm(node.text)
        const out = norm(look(sentence))
        node.set_content(out.split(' ').map((w) => `<span>${w}</span>`).join(' '))
        return
      }
    }
    if (node instanceof TextNode) {
      if (node.parentNode && SKIP.has(node.parentNode.rawTagName?.toLowerCase())) return
      const raw = node.rawText
      if (wordy(raw) && !raw.trimStart().startsWith('<!')) node.rawText = look(raw)
      return
    }
    for (const child of node.childNodes) walk(child)
  }
  walk(doc)
  doc.querySelector('html')?.setAttribute('lang', lang)
  // screenshots of the panel in the page's language (the panel has PT, EN and ES)
  for (const img of doc.querySelectorAll('img[data-lang-src]')) {
    const shot = lang === 'tr' ? 'en' : lang
    img.setAttribute('src', (img.getAttribute('src') ?? '').replace('/pt-BR/', `/${shot}/`))
  }
  rewriteLinks(doc, page, lang)
  return doc.toString()
}

const report = {}
for (const [page, langs] of Object.entries(config.pages)) {
  const depth = page.split('/').length - 1
  // the Portuguese page keeps its own hreflang block and switcher up to date
  const ptFile = path.join(root, page)
  if (!fs.existsSync(ptFile)) {
    console.error(`missing page: ${page}`)
    process.exitCode = 1
    continue
  }
  fs.writeFileSync(ptFile, decorate(fs.readFileSync(ptFile, 'utf8'), page, 'pt-BR', depth))
  for (const lang of langs) {
    if (lang === 'pt-BR') continue
    const missing = new Set()
    const html = translate(page, lang, missing)
    if (missing.size) {
      report[lang] ??= {}
      for (const key of missing) report[lang][key] = ''
      continue
    }
    const out = path.join(root, config.languages[lang].dir, page)
    fs.mkdirSync(path.dirname(out), { recursive: true })
    fs.writeFileSync(out, decorate(html, page, lang, depth + 1))
  }
}

const languages = Object.keys(report)
if (missingMode) {
  console.log(JSON.stringify(report, null, 1))
} else if (languages.length) {
  for (const lang of languages) console.error(`${lang}: ${Object.keys(report[lang]).length} texts without translation (node scripts/langs.mjs --missing)`)
  process.exitCode = 1
} else {
  console.log('languages ok')
}
