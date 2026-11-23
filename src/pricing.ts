/**
 * The price section: each plan in the visitor's currency. The country is a guess for display
 * (time zone, then browser language); the price actually charged is set at checkout from the
 * billing country. Same table as the service (clip-pipeline/src/clipper/cloud/pricing.py);
 * a test there keeps the two equal.
 */

type Tier = 'T1' | 'T2' | 'T3' | 'T4'
export const TIERS: Record<Tier, string[]> = {
  T1: ['US', 'GB', 'CA', 'AU', 'NZ', 'DE', 'FR', 'NL', 'BE', 'AT', 'CH', 'IE', 'SE', 'NO', 'DK', 'FI', 'JP', 'SG', 'IL', 'AE'],
  T2: ['ES', 'PT', 'IT', 'CL', 'UY', 'PL', 'CZ', 'GR', 'SA', 'KR'],
  T3: ['BR', 'MX', 'CO', 'PE', 'EC', 'CR', 'PA', 'DO', 'GT', 'ZA', 'MY', 'TH'],
  T4: ['AR', 'TR', 'IN', 'ID', 'PH', 'VN', 'PK', 'EG', 'NG', 'BO', 'PY', 'VE'],
}
// monthly: starter, pro, agency
export const PRICES: Record<Tier, Record<string, [number, number, number]>> = {
  T1: { USD: [12, 29, 79], EUR: [12, 27, 75], GBP: [10, 24, 65], JPY: [1800, 4400, 11800] },
  T2: { EUR: [10, 23, 63], USD: [10, 24, 65], CLP: [9900, 22900, 59900] },
  T3: { BRL: [39, 89, 249], MXN: [139, 329, 899], COP: [29900, 69900, 189900], USD: [7, 17, 45] },
  T4: { USD: [5, 12, 35] },
}
const CURRENCY: Record<string, string> = {
  BR: 'BRL', MX: 'MXN', CO: 'COP', CL: 'CLP', GB: 'GBP', JP: 'JPY',
  ...Object.fromEntries(['DE', 'FR', 'NL', 'BE', 'AT', 'IE', 'FI', 'ES', 'PT', 'IT', 'GR'].map((c) => [c, 'EUR'])),
}
const YEARLY_FACTOR = 0.6
const PLANS = ['starter', 'pro', 'agency'] as const

// time zones of the countries that matter most here (the browser's language says the rest)
const ZONES: Record<string, string> = {
  'America/Sao_Paulo': 'BR', 'America/Fortaleza': 'BR', 'America/Recife': 'BR', 'America/Bahia': 'BR',
  'America/Manaus': 'BR', 'America/Belem': 'BR', 'America/Cuiaba': 'BR', 'America/Campo_Grande': 'BR',
  'America/Porto_Velho': 'BR', 'America/Boa_Vista': 'BR', 'America/Rio_Branco': 'BR', 'America/Maceio': 'BR',
  'America/Araguaina': 'BR', 'America/Santarem': 'BR', 'America/Noronha': 'BR',
  'America/Mexico_City': 'MX', 'America/Monterrey': 'MX', 'America/Tijuana': 'MX', 'America/Cancun': 'MX',
  'America/Bogota': 'CO', 'America/Lima': 'PE', 'America/Santiago': 'CL', 'America/Buenos_Aires': 'AR',
  'America/Argentina/Buenos_Aires': 'AR', 'America/Montevideo': 'UY', 'America/Asuncion': 'PY',
  'America/La_Paz': 'BO', 'America/Caracas': 'VE', 'America/Guayaquil': 'EC',
  'Europe/Madrid': 'ES', 'Europe/Lisbon': 'PT', 'Europe/London': 'GB', 'Europe/Berlin': 'DE', 'Europe/Paris': 'FR',
  'Europe/Rome': 'IT', 'Europe/Istanbul': 'TR', 'Asia/Tokyo': 'JP', 'Asia/Kolkata': 'IN', 'Asia/Jakarta': 'ID',
  'Asia/Manila': 'PH',
}

export function guessCountry(): string {
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone
  if (ZONES[zone]) return ZONES[zone]
  const region = (navigator.language.split('-')[1] ?? '').toUpperCase()
  return region.length === 2 ? region : 'US'
}

export function tierOf(country: string): Tier {
  return (Object.keys(TIERS) as Tier[]).find((t) => TIERS[t].includes(country)) ?? 'T1'
}

export function offer(country: string) {
  const tier = tierOf(country)
  const table = PRICES[tier]
  let currency = CURRENCY[country] ?? 'USD'
  if (!(currency in table)) currency = 'USD' in table ? 'USD' : Object.keys(table)[0]
  const monthly = Object.fromEntries(PLANS.map((p, i) => [p, table[currency][i]])) as Record<(typeof PLANS)[number], number>
  return { country, tier, currency, monthly }
}

function money(value: number, currency: string, lang: string) {
  return new Intl.NumberFormat(lang, { style: 'currency', currency, maximumFractionDigits: value % 1 ? 2 : 0 }).format(value)
}

export function setupPricing() {
  const root = document.querySelector<HTMLElement>('[data-pricing]')
  if (!root) return
  const lang = document.documentElement.lang || 'pt-BR'
  const o = offer(guessCountry())
  let yearly = false

  const render = () => {
    const free = root.querySelector<HTMLElement>('[data-price="free"]')
    if (free) free.textContent = money(0, o.currency, lang)
    for (const plan of PLANS) {
      const cell = root.querySelector<HTMLElement>(`[data-price="${plan}"]`)
      const per = root.querySelector<HTMLElement>(`[data-per="${plan}"]`)
      if (!cell || !per) continue
      const month = o.monthly[plan]
      // yearly shown as the monthly equivalent, with the yearly total under it
      const value = yearly ? Math.round(month * YEARLY_FACTOR * 100) / 100 : month
      cell.textContent = money(value, o.currency, lang)
      per.textContent = yearly ? `/mês, ${money(Math.round(month * 12 * YEARLY_FACTOR * 100) / 100, o.currency, lang)} por ano` : '/mês'
    }
    root.querySelectorAll<HTMLButtonElement>('[data-interval]').forEach((b) => {
      b.setAttribute('aria-pressed', String((b.dataset.interval === 'year') === yearly))
    })
  }
  root.querySelectorAll<HTMLButtonElement>('[data-interval]').forEach((b) =>
    b.addEventListener('click', () => {
      yearly = b.dataset.interval === 'year'
      render()
    }),
  )
  const where = root.querySelector('[data-currency-note]')
  if (where) where.textContent = `Preços em ${o.currency}. O valor final aparece no pagamento, pelo país do seu cartão.`
  render()

  // the buttons go to the app once its address is set; until then they say so
  const app = document.querySelector('meta[name="clipper-app-url"]')?.getAttribute('content') ?? ''
  document.querySelectorAll<HTMLAnchorElement>('[data-app]').forEach((a) => {
    if (app) {
      a.href = app
    } else {
      a.removeAttribute('href')
      a.setAttribute('aria-disabled', 'true')
      a.textContent = 'Em breve'
    }
  })
}
