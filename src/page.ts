/**
 * The content pages (calculator, affiliates, help, status, comparisons, guides): the same look
 * and buttons as the home page, without its animations.
 */
import './styles.css'
import { BASE, t } from './i18n'
import { hydrateIcons } from './icons'
import { PRICES, guessCountry, setupAppButtons, tierOf } from './pricing'
import { setupWaitlist } from './waitlist'

hydrateIcons()
setupAppButtons()
setupWaitlist()

const nav = document.querySelector('[data-nav]')
addEventListener('scroll', () => nav?.classList.toggle('solid', scrollY > 8), { passive: true })
nav?.classList.toggle('solid', true)

// ---------------------------------------------------------------- the calculator

const PLAN_HOURS: [string, number][] = [
  ['Grátis', 3],
  ['Starter', 30],
  ['Pro', 120],
  ['Agência', 400],
]
const CLIPS_PER_HOUR = 4 // usable clips per hour of live: varies with the streamer and the selection level

function usd(value: number) {
  return new Intl.NumberFormat(document.documentElement.lang, { style: 'currency', currency: 'USD', maximumFractionDigits: value < 100 ? 2 : 0 }).format(value)
}

function setupCalculator() {
  const form = document.querySelector<HTMLFormElement>('[data-calc]')
  if (!form) return
  const out = (name: string) => document.querySelector<HTMLElement>(`[data-out="${name}"]`)!
  const tier = tierOf(guessCountry())
  const usdPrices = PRICES[tier].USD ?? PRICES.T1.USD
  const render = () => {
    const value = (name: string) => Math.max(0, Number((form.elements.namedItem(name) as HTMLInputElement).value) || 0)
    const clipsPerDay = value('clips')
    const views = value('views')
    const cpm = value('cpm')
    const monthViews = clipsPerDay * 30 * views
    const earned = (monthViews / 1000) * cpm
    const hours = Math.ceil((clipsPerDay * 30) / CLIPS_PER_HOUR)
    const plan = PLAN_HOURS.find(([, h]) => h >= hours)
    const planName = plan ? t(plan[0]) : t('Pro com o agente no PC')
    const index = plan ? PLAN_HOURS.indexOf(plan) : 2
    const price = index === 0 ? 0 : usdPrices[index - 1]
    out('views').textContent = new Intl.NumberFormat(document.documentElement.lang).format(monthViews)
    out('earned').textContent = usd(earned)
    out('hours').textContent = `${hours} h`
    out('plan').textContent = `${planName}${price ? ` · ${usd(price)} ${t('por mês')}` : ''}`
    out('share').textContent =
      earned > 0 && price > 0 ? t('O plano custa {share} do que você ganharia.', { share: `${Math.max(1, Math.round((price / earned) * 100))}%` }) : ''
  }
  form.addEventListener('input', render)
  render()
}

// ---------------------------------------------------------------- status

async function setupStatus() {
  const box = document.querySelector<HTMLElement>('[data-status]')
  if (!box) return
  const app = (document.querySelector('meta[name="clipper-app-url"]')?.getAttribute('content') ?? '').replace(/\/$/, '')
  const state = box.querySelector<HTMLElement>('[data-state]')!
  const when = box.querySelector<HTMLElement>('[data-when]')!
  if (!app) {
    state.textContent = t('O painel ainda não foi aberto ao público.')
    return
  }
  const check = async () => {
    let up = false
    try {
      const res = await fetch(`${app}/api/health`, { cache: 'no-store' })
      up = res.ok
    } catch {
      up = false
    }
    state.textContent = up ? t('No ar') : t('Fora do ar')
    state.dataset.up = String(up)
    when.textContent = t('Verificado {when}', { when: new Date().toLocaleTimeString(document.documentElement.lang) })
  }
  await check()
  setInterval(check, 60_000)
}

setupCalculator()
void setupStatus()
void BASE
