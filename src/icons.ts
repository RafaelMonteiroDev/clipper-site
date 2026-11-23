/**
 * Icons: <i data-icon="Name"> becomes a Lucide icon, <i data-brand="siTwitch"> a platform mark
 * from Simple Icons (CC0), drawn in the text colour. Only the icons used are imported.
 */
import {
  AudioLines,
  CalendarClock,
  Cloud,
  Gauge,
  Image,
  Laugh,
  Layers,
  Link,
  Lock,
  MessageSquare,
  Mic,
  Monitor,
  Play,
  Repeat,
  Scissors,
  Send,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Type,
  Volume2,
  createElement,
  type IconNode,
} from 'lucide'
import { siInstagram, siKick, siTiktok, siTwitch, siYoutube, siYoutubeshorts } from 'simple-icons'

const ICONS: Record<string, IconNode> = {
  AudioLines,
  CalendarClock,
  Cloud,
  Gauge,
  Image,
  Laugh,
  Layers,
  Link,
  Lock,
  MessageSquare,
  Mic,
  Monitor,
  Play,
  Repeat,
  Scissors,
  Send,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Type,
  Volume2,
}
const BRANDS: Record<string, { path: string; title: string }> = {
  siInstagram,
  siKick,
  siTiktok,
  siTwitch,
  siYoutube,
  siYoutubeshorts,
}

export function hydrateIcons(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>('i[data-icon]').forEach((el) => {
    const node = ICONS[el.dataset.icon!]
    if (!node || el.firstChild) return
    const svg = createElement(node, { 'stroke-width': 1.75, 'aria-hidden': 'true' })
    el.append(svg)
    el.classList.add('icon')
  })
  root.querySelectorAll<HTMLElement>('i[data-brand]').forEach((el) => {
    const brand = BRANDS[el.dataset.brand!]
    if (!brand || el.firstChild) return
    el.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="${brand.path}"/></svg>`
    el.classList.add('brand-mark')
    el.title = brand.title
  })
}
