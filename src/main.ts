import './styles.css'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { hydrateIcons } from './icons'
import { createScene, drawPhone } from './scene'
import { setupPricing } from './pricing'
import { setupMock, setupProfiles } from './sections'


gsap.registerPlugin(ScrollTrigger)
hydrateIcons()
setupProfiles()
setupMock()
setupPricing()

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  root.querySelector(sel) as T | null
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll(sel)) as T[]

// ---------------------------------------------------------------- smooth scroll + nav

if (!reduced) {
  const lenis = new Lenis({ lerp: 0.12 })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((time) => lenis.raf(time * 1000))
  gsap.ticker.lagSmoothing(0)
  $$<HTMLAnchorElement>('a[href^="#"]').forEach((a) =>
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href')!
      const target = id === '#conteudo' ? document.body : $(id)
      if (!target) return
      e.preventDefault()
      lenis.scrollTo(target as HTMLElement, { offset: -70 })
    }),
  )
}
const nav = $('[data-nav]')!
const onScroll = () => nav.classList.toggle('solid', scrollY > 24)
addEventListener('scroll', onScroll, { passive: true })
onScroll()

// ---------------------------------------------------------------- caption karaoke

function karaoke(el: HTMLElement, step = 0.2): gsap.core.Timeline {
  const words = $$('span', el)
  const tl = gsap.timeline()
  words.forEach((w, i) => {
    tl.call(() => w.classList.add('lit'), [], i * step)
    tl.call(() => w.classList.remove('lit'), [], (i + 1) * step)
  })
  return tl
}
const heroTitle = $('.hero [data-karaoke]')!
if (!reduced) karaoke(heroTitle, 0.22).delay(0.3)
$$('.closing [data-karaoke]').forEach((el) => {
  ScrollTrigger.create({ trigger: el, start: 'top 80%', once: true, onEnter: () => !reduced && karaoke(el, 0.2) })
})

// ---------------------------------------------------------------- the stage

const N = 240 // points on the stage's timeline
const PEAK = 0.62
const DECOY = 0.3 // an explosion in the game: loud, but nobody reacts

function noise(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}
const bump = (x: number, at: number, width: number) => Math.exp(-(((x - at) / width) ** 2))

function laneData(seed: number) {
  const n = noise(seed)
  const chat: number[] = []
  const laugh: number[] = []
  const volume: number[] = []
  const speech: number[] = []
  const score: number[] = []
  for (let i = 0; i < N; i++) {
    const x = i / N
    const c = 0.18 + 0.1 * n() + 0.85 * bump(x, PEAK + 0.025, 0.035) + 0.12 * bump(x, DECOY + 0.02, 0.03)
    const l = 0.04 * n() + 0.95 * bump(x, PEAK, 0.02)
    const v = 0.3 + 0.18 * n() + 0.55 * bump(x, PEAK, 0.025) + 0.7 * bump(x, DECOY, 0.012)
    const s = (Math.sin(i * 0.9) > -0.2 ? 0.45 : 0.08) + 0.2 * n() + 0.3 * bump(x, PEAK - 0.03, 0.04)
    chat.push(Math.min(1, c))
    laugh.push(Math.min(1, l))
    volume.push(Math.min(1, v))
    speech.push(Math.min(1, s))
    score.push(Math.min(1, 0.08 + 0.05 * n() + 0.92 * bump(x, PEAK + 0.005, 0.03) + 0.16 * bump(x, DECOY, 0.015)))
  }
  return { chat, laugh, volume, speech, score }
}
type Lanes = ReturnType<typeof laneData>

function drawLane(canvas: HTMLCanvasElement, values: number[], t: number, color: string, filled: boolean) {
  const dpr = Math.min(2, devicePixelRatio || 1)
  const w = canvas.clientWidth
  const h = canvas.clientHeight
  if (canvas.width !== Math.round(w * dpr)) {
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
  }
  const ctx = canvas.getContext('2d')!
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, w, h)
  const step = w / values.length
  const upto = Math.floor(values.length * t)
  for (let i = 0; i < values.length; i++) {
    const v = values[i]
    const bh = Math.max(1.5, v * (h - 2))
    const past = i <= upto
    ctx.fillStyle = past ? color : 'rgba(154,161,173,0.18)'
    if (filled) ctx.globalAlpha = past ? 0.35 + 0.65 * v : 1
    ctx.fillRect(i * step, h - bh, Math.max(1, step - 1), bh)
    ctx.globalAlpha = 1
  }
}

const CHAT_NAMES = ['vitinho_', 'luagamer', 'kaua09', 'mariz', 'pedrao', 'nanda', 'zeca_', 'biel', 'tutu', 'jow']
const CHAT_COLORS = ['#7dd3fc', '#f9a8d4', '#fcd34d', '#86efac', '#c4b5fd', '#fda4af']
const CHAT_CALM = ['boa', 'que carro é esse', 'vai pela praia', 'kkk', 'lindo esse por do sol', 'acelera', 'hm', 'fala mano', 'vai la']
const CHAT_HYPE = ['KKKKKKKKKK', 'CLIPA ISSO', 'KEKW', 'NAO ACREDITO', 'KKKKKK MORRI', 'clipa clipa', 'SOCORRO', 'LUL LUL', 'kkkkkkkkkk']
const CAPTION = ['E', 'DO', 'NADA', 'ELE', 'FREIA', 'NA', 'MINHA', 'FRENTE', 'NÃO', 'ACREDITO']

function setupStage() {
  const stage = $('[data-stage]')
  if (!stage) return
  const streamCanvas = $<HTMLCanvasElement>('[data-stream]', stage)!
  const phoneCanvas = $<HTMLCanvasElement>('[data-clip]', stage)!
  const sctx = streamCanvas.getContext('2d')!
  const pctx = phoneCanvas.getContext('2d')!
  const scene = createScene()
  const chat = $('[data-chat]', stage)!
  const found = $('[data-found]', stage)!
  const foundWhy = $('[data-found-why]', stage)!
  const playhead = $('[data-playhead]', stage)!
  const cut = $('[data-cut]', stage)!
  const clock = $('[data-clock]', stage)!
  const hook = $('[data-hook]', stage)!
  const caption = $('[data-caption]', stage)!
  const progress = $('[data-progress]', stage)!
  const empty = $('[data-empty]', stage)!
  const wait = $('[data-wait]', stage)!
  const steps = $$('[data-step]', stage)
  const lanesEls = $$<HTMLCanvasElement>('[data-lane] canvas', stage)
  const laneKeys = $$('[data-lane]', stage).map((el) => el.dataset.lane as keyof Lanes)
  const COLORS: Record<string, string> = {
    chat: '#7dd3fc',
    laugh: '#ffe500',
    volume: '#9aa1ad',
    speech: '#c4b5fd',
    score: '#eceef2',
  }

  let lanes = laneData(11)
  let channel = 'canal'
  const SCAN_S = 8 // the playhead crosses the timeline
  const CLIP_S = 7 // the clip plays in the phone
  const HOLD_S = 3
  const LOOP_S = SCAN_S + CLIP_S + HOLD_S
  const CUT_A = PEAK - 0.09
  const CUT_B = PEAK + 0.06
  let start = performance.now()
  let lastChat = 0
  let shownFound = false
  let visible = true
  let decoyShown = false

  const pushChat = (hype: boolean) => {
    const li = document.createElement('li')
    const name = CHAT_NAMES[Math.floor(Math.random() * CHAT_NAMES.length)]
    const color = CHAT_COLORS[Math.floor(Math.random() * CHAT_COLORS.length)]
    const pool = hype ? CHAT_HYPE : CHAT_CALM
    const b = document.createElement('b')
    b.style.color = color
    b.textContent = `${name}: `
    li.append(b, pool[Math.floor(Math.random() * pool.length)])
    chat.append(li)
    while (chat.children.length > 14) chat.firstElementChild?.remove()
  }

  const reset = () => {
    start = performance.now()
    shownFound = false
    decoyShown = false
    chat.replaceChildren()
    found.hidden = true
    cut.hidden = true
    empty.classList.remove('gone')
    wait.textContent = 'Procurando o momento'
    hook.classList.remove('show')
    caption.replaceChildren()
    steps.forEach((s) => s.classList.remove('done'))
  }

  const frame = (now: number) => {
    requestAnimationFrame(frame)
    if (!visible || document.hidden) return
    const t = (now - start) / 1000
    if (t > LOOP_S) {
      reset()
      return
    }
    const scan = Math.min(1, t / SCAN_S) * 0.72
    const x = Math.min(scan, 0.999)
    // how hard the streamer laughs: around the peak while scanning, and again inside the clip
    const clipT = t - SCAN_S
    const inClip = clipT >= 0 && clipT < CLIP_S
    const clipPos = inClip ? CUT_A + (CUT_B - CUT_A) * (clipT / CLIP_S) : 0
    const at = inClip ? clipPos : x
    const react = Math.max(0, bump(at, PEAK, 0.018) * 1.1 - 0.05)
    scene.draw(t, Math.min(1, react))
    sctx.drawImage(scene.canvas, 0, 0, streamCanvas.width, streamCanvas.height)

    // timeline
    playhead.style.setProperty('--t', String(x))
    lanesEls.forEach((c, i) => drawLane(c, lanes[laneKeys[i]], x, COLORS[laneKeys[i]], laneKeys[i] !== 'score'))
    const secs = 8048 + Math.floor(x * 240)
    clock.textContent = `${Math.floor(secs / 3600)}:${String(Math.floor((secs % 3600) / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`

    // chat: rate follows the chat lane
    const rate = lanes.chat[Math.floor(x * (N - 1))]
    if (t < SCAN_S && now - lastChat > 900 - rate * 800) {
      lastChat = now
      pushChat(rate > 0.55)
    }
    if (!decoyShown && x > DECOY + 0.01 && x < DECOY + 0.06) {
      decoyShown = true
      found.hidden = false
      found.querySelector('strong')!.textContent = 'Volume alto, sem reação'
      foundWhy.textContent = 'explosão no jogo: não vira clipe'
      found.style.borderColor = 'var(--line)'
    }
    if (decoyShown && !shownFound && x > DECOY + 0.09) found.hidden = true
    if (!shownFound && x >= PEAK + 0.02) {
      shownFound = true
      found.hidden = false
      found.style.borderColor = ''
      found.querySelector('strong')!.textContent = 'Momento encontrado'
      foundWhy.textContent = 'risada + chat rindo + chat pedindo clipe'
      cut.hidden = false
      cut.style.setProperty('--a', String(CUT_A))
      cut.style.setProperty('--b', String(CUT_B))
      wait.textContent = 'Cortando e legendando'
    }

    // the clip in the phone
    if (inClip) {
      empty.classList.add('gone')
      const zoom = react > 0.45 ? 1.16 : 1
      drawPhone(pctx, scene.canvas, zoom)
      hook.classList.toggle('show', clipT < 2.2)
      const wordAt = Math.floor((clipT / CLIP_S) * (CAPTION.length + 2)) - 1
      const shown = Math.max(0, Math.min(CAPTION.length - 1, wordAt))
      const group = Math.floor(shown / 3) * 3
      const words = CAPTION.slice(group, group + 3)
      if (caption.dataset.group !== String(group)) {
        caption.dataset.group = String(group)
        caption.replaceChildren(
          ...words.map((w) => {
            const s = document.createElement('span')
            s.textContent = w
            return s
          }),
        )
      }
      $$('span', caption).forEach((s, i) => s.classList.toggle('lit', group + i === shown && wordAt >= 0))
      progress.style.setProperty('--p', String(clipT / CLIP_S))
      steps[0].classList.add('done')
      if (clipT > 3) steps[1].classList.add('done')
      if (clipT > 5) steps[2].classList.add('done')
    }
    if (t > SCAN_S + CLIP_S) found.hidden = true
  }

  if (reduced) {
    // the end state, still: a clip in the phone, everything done
    scene.draw(4, 1)
    sctx.drawImage(scene.canvas, 0, 0, streamCanvas.width, streamCanvas.height)
    drawPhone(pctx, scene.canvas, 1.16)
    lanesEls.forEach((c, i) => drawLane(c, lanes[laneKeys[i]], 0.72, COLORS[laneKeys[i]], laneKeys[i] !== 'score'))
    playhead.style.setProperty('--t', '0.72')
    empty.classList.add('gone')
    caption.innerHTML = '<span>NÃO</span> <span class="lit">ACREDITO</span>'
    cut.hidden = false
    cut.style.setProperty('--a', String(CUT_A))
    cut.style.setProperty('--b', String(CUT_B))
    steps.forEach((s) => s.classList.add('done'))
  } else {
    requestAnimationFrame(frame)
    new IntersectionObserver(([entry]) => (visible = entry.isIntersecting)).observe(stage)
  }

  // the composer: restart the simulation "with" the pasted channel
  const form = $<HTMLFormElement>('[data-composer]')!
  form.addEventListener('submit', (e) => {
    e.preventDefault()
    const value = (form.elements.namedItem('link') as HTMLInputElement).value.trim()
    const m = value.match(/(?:twitch\.tv|kick\.com|youtube\.com\/@?)\/?([\w.-]+)/i)
    channel = m?.[1] ?? channel
    lanes = laneData(Math.floor(Math.random() * 1000) + 3)
    wait.textContent = `Acompanhando ${channel}`
    reset()
    wait.textContent = `Acompanhando ${channel}`
    stage.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' })
  })
  $$('[data-replay]').forEach((a) => a.addEventListener('click', () => reset()))
}
setupStage()

// ---------------------------------------------------------------- signals board (scroll scrub)

function setupBoard() {
  const section = $('[data-signals]')
  const board = $('[data-board]')
  if (!section || !board) return
  const M = 400
  const n = noise(5)
  const peaks = [0.22, 0.55, 0.83]
  const decoys = [0.38, 0.7]
  const lanes: { key: string; label: string; values: number[]; score?: boolean }[] = [
    { key: 'chat', label: 'Chat', values: [] },
    { key: 'laugh', label: 'Sons', values: [] },
    { key: 'volume', label: 'Volume', values: [] },
    { key: 'speech', label: 'Fala', values: [] },
    { key: 'score', label: 'Força', values: [], score: true },
  ]
  for (let i = 0; i < M; i++) {
    const x = i / M
    const p = peaks.reduce((a, at) => a + bump(x, at, 0.018), 0)
    const d = decoys.reduce((a, at) => a + bump(x, at, 0.008), 0)
    lanes[0].values.push(Math.min(1, 0.15 + 0.12 * n() + 0.8 * peaks.reduce((a, at) => a + bump(x, at + 0.012, 0.02), 0)))
    lanes[1].values.push(Math.min(1, 0.05 * n() + 0.9 * p))
    lanes[2].values.push(Math.min(1, 0.28 + 0.18 * n() + 0.45 * p + 0.75 * d))
    lanes[3].values.push(Math.min(1, 0.3 + 0.3 * n() * (Math.sin(i * 0.4) > 0 ? 1 : 0.3) + 0.3 * p))
    lanes[4].values.push(Math.min(1, 0.06 + 0.05 * n() + 0.9 * p + 0.12 * d))
  }
  const path = (values: number[]) => {
    let d = `M0 100`
    values.forEach((v, i) => (d += ` L${(i / (values.length - 1)) * 1000} ${100 - v * 96}`))
    return d + ' L1000 100 Z'
  }
  const rows = lanes.map((lane) => {
    const row = document.createElement('div')
    row.className = `board-lane${lane.score ? ' score' : ''}`
    row.dataset.key = lane.key
    const d = path(lane.values)
    row.innerHTML = `<span>${lane.label}</span><svg viewBox="0 0 1000 100" preserveAspectRatio="none"><defs><clipPath id="win-${lane.key}"><rect class="win" x="0" y="-10" width="70" height="120"/></clipPath></defs><path d="${d}"/><path class="hot" clip-path="url(#win-${lane.key})" d="${d}"/></svg>`
    board.append(row)
    return row
  })
  const scan = $('[data-board-scan]')!
  const readout = $('[data-readout]')!
  const keys = $$('[data-signal-keys] li')
  // a lane lights up where it is unusually high for itself (its own 85th percentile)
  const high = lanes.map((lane) => [...lane.values].sort((a, b) => a - b)[Math.floor(M * 0.85)])
  const windows = rows.map((row) => row.querySelector<SVGRectElement>('rect.win')!)
  const update = (s: number) => {
    scan.style.setProperty('--s', String(s))
    windows.forEach((w) => w.setAttribute('x', String(s * 1000 - 70)))
    const i = Math.min(M - 1, Math.floor(s * M))
    const secs = Math.floor(s * 3 * 3600)
    readout.textContent = `${Math.floor(secs / 3600)}:${String(Math.floor((secs % 3600) / 60)).padStart(2, '0')} de live`
    lanes.forEach((lane, k) => {
      const near = lane.values.slice(Math.max(0, i - 6), i + 1)
      const hot = Math.max(...near) > high[k] * (lane.score ? 1.6 : 1.15)
      rows[k].classList.toggle('on', hot)
      keys.find((li) => li.dataset.key === lane.key)?.classList.toggle('on', hot)
    })
  }
  if (reduced || innerWidth < 980) {
    update(0.55)
    if (!reduced) {
      ScrollTrigger.create({
        trigger: section,
        start: 'top 70%',
        end: 'bottom 30%',
        scrub: true,
        onUpdate: (self) => update(self.progress),
      })
    }
    return
  }
  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: '+=160%',
    pin: '.signals-pin',
    scrub: 0.6,
    onUpdate: (self) => update(self.progress),
  })
  update(0)
}
setupBoard()

// ---------------------------------------------------------------- the editing tiles

function setupTiles() {
  // karaoke loop
  const demo = $('[data-karaoke-demo] p')
  if (demo && !reduced) {
    const words = $$('span', demo)
    let i = 0
    setInterval(() => {
      words.forEach((w, k) => w.classList.toggle('lit', k === i))
      i = (i + 1) % (words.length + 2)
    }, 380)
  } else if (demo) {
    $$('span', demo)[1]?.classList.add('lit')
  }

  // zoom wave: a laugh in the middle
  const wave = $<SVGPathElement>('[data-wave]')
  if (wave) {
    const n = noise(3)
    let d = 'M0 20'
    for (let i = 0; i <= 100; i++) {
      const x = i / 100
      const amp = 3 + 4 * n() + 14 * bump(x, 0.5, 0.08)
      d += ` L${i * 2} ${20 + (i % 2 ? amp : -amp)}`
    }
    wave.setAttribute('d', d)
  }

  // silence: bars, then the quiet ones collapse and the rest close up
  const svg = $<SVGSVGElement>('[data-silence]')
  if (svg) {
    const n = noise(9)
    const bars = Array.from({ length: 60 }, (_, i) => {
      const quiet = (i > 14 && i < 22) || (i > 38 && i < 47)
      return { h: quiet ? 2 + n() * 3 : 10 + n() * 38, quiet }
    })
    const render = (p: number) => {
      const widths = bars.map((b) => (b.quiet ? 5 * (1 - p) : 5))
      const total = widths.reduce((a, w) => a + w, 0)
      let x = (300 - total) / 2
      svg.innerHTML = bars
        .map((b, i) => {
          const w = widths[i]
          const rect = `<rect x="${x.toFixed(1)}" y="${(30 - b.h / 2).toFixed(1)}" width="${Math.max(0, w - 1.5).toFixed(1)}" height="${b.h.toFixed(1)}" rx="1" fill="${b.quiet ? '#ff4d4d' : '#9aa1ad'}" opacity="${b.quiet ? 0.7 * (1 - p) + 0.1 : 0.85}"/>`
          x += w
          return rect
        })
        .join('')
    }
    render(0)
    if (!reduced) {
      const state = { p: 0 }
      gsap
        .timeline({ repeat: -1, repeatDelay: 1, scrollTrigger: { trigger: svg, start: 'top 85%' } })
        .to(state, { p: 1, duration: 1.1, delay: 1, ease: 'power3.inOut', onUpdate: () => render(state.p) })
        .to(state, { p: 0, duration: 0.6, delay: 1.6, ease: 'power2.inOut', onUpdate: () => render(state.p) })
    } else render(1)
  }

  // cover: the pick moves along the frames, then lands on the best
  const cover = $('[data-cover-demo]')
  if (cover && !reduced) {
    const frames = $$('span', cover)
    let k = 0
    setInterval(() => {
      frames.forEach((f, i) => f.classList.toggle('best', i === (k < 6 ? k % 5 : 2)))
      k = (k + 1) % 10
    }, 420)
  }
}
setupTiles()

// ---------------------------------------------------------------- live track

function setupLive() {
  const track = $('[data-live-track]')
  if (!track) return
  const blocks = $('.live-blocks', track)!
  const clips = $('.live-clips', track)!
  const cells = Array.from({ length: 12 }, () => {
    const s = document.createElement('span')
    blocks.append(s)
    return s
  })
  const hits = [
    { block: 2, late: '+6 min' },
    { block: 5, late: '+5 min' },
    { block: 6, late: '+7 min' },
    { block: 10, late: '+6 min' },
  ]
  const run = () => {
    clips.replaceChildren()
    const tl = gsap.timeline()
    cells.forEach((_, i) => {
      tl.call(
        () => {
          cells.forEach((x, k) => {
            x.classList.toggle('done', k < i)
            x.classList.toggle('now', k === i)
          })
          const hit = hits.find((h) => h.block === i - 1)
          if (hit) {
            const clip = document.createElement('span')
            clip.className = 'live-clip'
            clip.dataset.late = hit.late
            clip.style.left = `calc(${((hit.block + 0.5) / 12) * 100}% - 17px)`
            clips.append(clip)
          }
        },
        [],
        i * 0.45,
      )
    })
    return tl
  }
  if (reduced) {
    cells.forEach((c) => c.classList.add('done'))
    hits.forEach((hit) => {
      const clip = document.createElement('span')
      clip.className = 'live-clip'
      clip.dataset.late = hit.late
      clip.style.left = `calc(${((hit.block + 0.5) / 12) * 100}% - 17px)`
      clips.append(clip)
    })
    return
  }
  ScrollTrigger.create({ trigger: track, start: 'top 80%', onEnter: () => run(), onEnterBack: () => run() })
}
setupLive()

// ---------------------------------------------------------------- schedule + learning

function setupPublish() {
  const schedule = $('[data-schedule]')
  if (schedule) {
    const slots = [
      ['11:00', 'Canal principal', 'quente 92'],
      ['14:00', 'Canal de cortes', 'quente 87'],
      ['17:30', 'Canal principal', 'quente 81'],
      ['19:00', 'TikTok, rascunho', 'quente 78'],
      ['21:30', 'Instagram Reels', 'quente 74'],
    ]
    slots.forEach(([time, where, heat], i) => {
      const row = document.createElement('div')
      row.className = 'slot'
      row.innerHTML = `<time>${time}</time><span>Clipe ${i + 1}<br><span class="where">${where}</span></span><span class="heat">${heat}</span>`
      schedule.append(row)
    })
    if (!reduced)
      gsap.from($$('.slot', schedule), {
        opacity: 0,
        x: -12,
        stagger: 0.08,
        duration: 0.5,
        ease: 'power3.out',
        scrollTrigger: { trigger: schedule, start: 'top 85%' },
      })
  }
  const weights = $('[data-weights]')
  if (weights) {
    if (reduced) weights.classList.add('learned')
    else
      ScrollTrigger.create({
        trigger: weights,
        start: 'top 75%',
        onEnter: () => setTimeout(() => weights.classList.add('learned'), 400),
      })
  }
}
setupPublish()
