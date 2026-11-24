/** The profile-studio demo and the panel mock: two showcases drawn from the same scene. */
import { pick, t } from './i18n'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { createScene, drawPhone } from './scene'

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  root.querySelector(sel) as T | null
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll(sel)) as T[]
const bump = (x: number, at: number, width: number) => Math.exp(-(((x - at) / width) ** 2))
function noise(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

// ---------------------------------------------------------------- profiles demo

type Preset = {
  font: string
  words: [string, string, string]
  captionTop: string
  accent: string
  stroke: string
  hook: { bg: string; color: string; top: string } | null
  tag: { text: string; top: string } | null
  cta: { text: string; bg: string; color: string } | null
  logo: boolean
  frame: boolean
  spec: [string, string][]
}

const PRESETS: Record<string, Preset> = {
  gameplay: {
    font: "900 22px 'Montserrat', sans-serif",
    words: pick({ pt: ['ELE ', 'CAIU', ' DE'], es: ['SE ', 'CAYÓ', ' OTRA'], en: ['HE ', 'FELL', ' AGAIN'], tr: ['YİNE ', 'DÜŞTÜ', ''] }),
    captionTop: '33%',
    accent: '#ffe500',
    stroke: '#000',
    hook: { bg: '#fff', color: '#141414', top: '12%' },
    tag: { text: t('@seucanal'), top: '72%' },
    cta: null,
    logo: false,
    frame: false,
    spec: [
      [t('Legenda'), t('Montserrat, 3 palavras, na emenda da câmera com o jogo')],
      [t('Gancho'), t('Caixa branca, 2,5 s')],
      [t('Marca'), t('Selo @seucanal na cor de destaque')],
      [t('Edição'), t('Corta silêncio, zoom na reação')],
    ],
  },
  podcast: {
    font: "800 25px 'Archivo Variable', sans-serif",
    words: pick({ pt: ['NÃO ', 'ACREDITO', ''], es: ['NO ', 'PUEDE SER', ''], en: ['NO ', 'WAY', ''], tr: ['', 'İNANAMIYORUM', ''] }),
    captionTop: '58%',
    accent: '#34d27b',
    stroke: '#000',
    hook: { bg: '#101010', color: '#fff', top: '8%' },
    tag: null,
    cta: { text: 'SEGUE PRA MAIS', bg: '#34d27b', color: '#000' },
    logo: true,
    frame: false,
    spec: [
      [t('Legenda'), t('Condensada, 2 palavras, mais baixa')],
      [t('Gancho'), t('Caixa preta, no topo')],
      [t('Elementos'), t('Logo no canto; "segue pra mais" nos 3 s finais')],
      [t('Edição'), t('Final em loop')],
    ],
  },
  minimal: {
    font: "700 19px 'Archivo Variable', sans-serif",
    words: pick({ pt: ['ele caiu ', 'de novo', ''], es: ['se cayó ', 'otra vez', ''], en: ['he fell ', 'again', ''], tr: ['yine ', 'düştü', ''] }),
    captionTop: '68%',
    accent: '#ffffff',
    stroke: 'rgba(0,0,0,.85)',
    hook: null,
    tag: null,
    cta: null,
    logo: false,
    frame: false,
    spec: [
      [t('Legenda'), t('Sem caixa alta, 4 palavras')],
      [t('Gancho'), t('Desligado')],
      [t('Marca'), t('Nenhuma')],
      [t('Edição'), t('Sem zoom')],
    ],
  },
  campaign: {
    font: "900 22px 'Montserrat', sans-serif",
    words: pick({ pt: ['OLHA ', 'ISSO', ''], es: ['MIRA ', 'ESTO', ''], en: ['LOOK ', 'AT THIS', ''], tr: ['ŞUNA ', 'BAK', ''] }),
    captionTop: '33%',
    accent: '#ff4fb8',
    stroke: '#000',
    hook: { bg: '#ff4fb8', color: '#141414', top: '12%' },
    tag: { text: `${t('@seucanal')}  •  twitch.tv/streamer`, top: '72%' },
    cta: { text: 'PARTE 2 NO PERFIL', bg: '#101010', color: '#fff' },
    logo: false,
    frame: true,
    spec: [
      [t('Legenda'), t('Destaque rosa da campanha')],
      [t('Marca'), t('Moldura + selo com o crédito do streamer')],
      [t('Elementos'), t('"Parte 2 no perfil" no fim')],
      [t('Uso'), t('Só nas lives do streamer da campanha')],
    ],
  },
}

export function setupProfiles() {
  const phone = $('[data-demo-phone]')
  if (!phone) return
  const canvas = $<HTMLCanvasElement>('[data-demo-canvas]', phone)!
  const scene = createScene()
  scene.draw(3.2, 0.9)
  drawPhone(canvas.getContext('2d')!, scene.canvas, 1)
  const hook = $('[data-demo-hook]', phone)!
  const caption = $('[data-demo-caption]', phone)!
  const tag = $('[data-demo-tag]', phone)!
  const cta = $('[data-demo-cta]', phone)!
  const logo = $('[data-demo-logo]', phone)!
  const spec = $('[data-demo-spec]')!
  const tabs = $$<HTMLButtonElement>('[data-preset]')

  const show = (key: string) => {
    const p = PRESETS[key]
    tabs.forEach((t) => t.setAttribute('aria-selected', String(t.dataset.preset === key)))
    phone.style.borderColor = p.frame ? p.accent : '#1d1d1d'
    hook.style.display = p.hook ? '' : 'none'
    if (p.hook) Object.assign(hook.style, { background: p.hook.bg, color: p.hook.color, top: p.hook.top })
    const lit = document.createElement('b')
    lit.textContent = p.words[1]
    lit.style.color = p.accent
    caption.replaceChildren(p.words[0], lit, p.words[2])
    Object.assign(caption.style, { font: p.font, top: p.captionTop })
    caption.style.setProperty('-webkit-text-stroke', `5px ${p.stroke}`)
    tag.style.display = p.tag ? '' : 'none'
    if (p.tag) {
      Object.assign(tag.style, { top: p.tag.top, background: p.accent })
      tag.textContent = p.tag.text
    }
    cta.style.display = p.cta ? '' : 'none'
    if (p.cta) {
      Object.assign(cta.style, { background: p.cta.bg, color: p.cta.color })
      cta.textContent = p.cta.text
    }
    logo.style.display = p.logo ? '' : 'none'
    logo.style.color = p.accent
    spec.replaceChildren(
      ...p.spec.map(([dt, dd]) => {
        const row = document.createElement('div')
        const a = document.createElement('dt')
        const b = document.createElement('dd')
        a.textContent = dt
        b.textContent = dd
        row.append(a, b)
        return row
      }),
    )
  }
  show('gameplay')
  const keys = Object.keys(PRESETS)
  let k = 0
  let timer = 0
  const stop = () => window.clearInterval(timer)
  tabs.forEach((t) =>
    t.addEventListener('click', () => {
      stop()
      show(t.dataset.preset!)
    }),
  )
  if (!reduced)
    ScrollTrigger.create({
      trigger: phone,
      start: 'top 85%',
      end: 'bottom 15%',
      onToggle: (self) => {
        stop()
        if (self.isActive) timer = window.setInterval(() => show(keys[++k % keys.length]), 3200)
      },
    })
}

// ---------------------------------------------------------------- panel mock

const QUEUE: [string, string, boolean][] = [
  ['O chat não acreditou', 'quente 92', true],
  ['Freou na frente de todo mundo', 'quente 87', true],
  ['A risada no final', 'quente 81', false],
  ['Ninguém esperava a polícia', 'quente 74', false],
  ['Perdeu tudo no último segundo', 'quente 70', false],
  ['O carro voou da ponte', 'quente 66', false],
]

export function setupMock() {
  setupZoomTile()
  const mock = $('[data-mock]')
  if (!mock) return
  const scene = createScene()
  const thumb = document.createElement('canvas')
  thumb.width = 90
  thumb.height = 160
  const tctx = thumb.getContext('2d')!
  const queue = $('[data-mock-queue]', mock)!
  QUEUE.forEach(([title, heat, ok], i) => {
    scene.draw(1 + i * 2.3, i === 0 ? 1 : 0.2)
    drawPhone(tctx, scene.canvas, 1)
    const row = document.createElement('div')
    row.className = `q${i === 0 ? ' on' : ''}${ok ? ' ok' : ''}`
    const img = document.createElement('img')
    img.src = thumb.toDataURL('image/jpeg', 0.7)
    img.alt = ''
    const text = document.createElement('div')
    const b = document.createElement('b')
    b.textContent = title
    const meta = document.createElement('span')
    const hot = document.createElement('span')
    hot.className = 'heat'
    hot.textContent = heat
    meta.append(`${32 + i} s · `, hot)
    text.append(b, meta)
    row.append(document.createElement('i'), img, text)
    queue.append(row)
  })

  const player = $<HTMLCanvasElement>('[data-mock-player]', mock)!
  const pctx = player.getContext('2d')!
  const timeline = $('[data-mock-timeline]', mock)!
  const n = noise(21)
  let d = 'M0 100'
  for (let i = 0; i <= 200; i++) {
    const v = 0.2 + 0.25 * n() + 0.55 * bump(i / 200, 0.55, 0.05)
    d += ` L${i * 5} ${(100 - v * 80).toFixed(1)}`
  }
  const NS = 'http://www.w3.org/2000/svg'
  const svg = document.createElementNS(NS, 'svg')
  svg.setAttribute('viewBox', '0 0 1000 100')
  svg.setAttribute('preserveAspectRatio', 'none')
  const el = (tag: string, attrs: Record<string, string>) => {
    const node = document.createElementNS(NS, tag)
    Object.entries({ 'vector-effect': 'non-scaling-stroke', ...attrs }).forEach(([k, v]) => node.setAttribute(k, v))
    svg.append(node)
    return node
  }
  el('path', { d: `${d} L1000 100 Z`, fill: 'rgba(245,245,245,.12)', stroke: '#666', 'stroke-width': '1' })
  el('rect', { x: '420', y: '6', width: '260', height: '92', fill: 'rgba(255,229,0,.06)', stroke: '#ffe500', 'stroke-width': '1.5' })
  const head = el('line', { x1: '420', x2: '420', y1: '0', y2: '100', stroke: '#f5f5f5', 'stroke-width': '1.5' })
  timeline.append(svg)

  if (reduced) {
    scene.draw(4, 0.8)
    drawPhone(pctx, scene.canvas, 1)
    return
  }
  let visible = false
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(mock)
  const start = performance.now()
  const frame = (now: number) => {
    requestAnimationFrame(frame)
    if (!visible) return
    const t = ((now - start) / 1000) % 7
    scene.draw(3 + t, Math.max(0, bump(t / 7, 0.5, 0.12)))
    drawPhone(pctx, scene.canvas, t > 3 && t < 4.6 ? 1.16 : 1)
    const x = String(420 + (t / 7) * 260)
    head.setAttribute('x1', x)
    head.setAttribute('x2', x)
  }
  requestAnimationFrame(frame)
}

/** The zoom tile shows the same scene, punched in by the CSS animation. */
export function setupZoomTile() {
  const canvas = $<HTMLCanvasElement>('[data-zoom-canvas]')
  if (!canvas) return
  const scene = createScene()
  scene.draw(4, 1)
  drawPhone(canvas.getContext('2d')!, scene.canvas, 1)
}
