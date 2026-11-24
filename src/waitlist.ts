/**
 * The waitlist (before the launch) and the invite link.
 * - ?ref=<code> and utm_* in the address are kept (localStorage) and go with the sign-up.
 * - Buttons with data-waitlist open a dialog that posts the e-mail to the app
 *   (<meta name="clipper-app-url">/api/waitlist); the app sends the confirmation e-mail.
 * - The confirmation link comes back as ?lista=<code>: the dialog shows the place in line,
 *   the friends who joined and the invite link, with buttons to share it.
 */
import { BASE, LANG, t } from './i18n'
import { guessCountry } from './pricing'

const REF = 'clipper-ref'
const SOURCE = 'clipper-source'
const UTM = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']

const appUrl = () => (document.querySelector('meta[name="clipper-app-url"]')?.getAttribute('content') ?? '').replace(/\/$/, '')

function remember() {
  const params = new URLSearchParams(location.search)
  try {
    const ref = params.get('ref')
    if (ref && /^[a-z0-9]{4,16}$/.test(ref)) localStorage.setItem(REF, ref)
    const source = Object.fromEntries(UTM.filter((k) => params.get(k)).map((k) => [k, params.get(k)!.slice(0, 100)]))
    if (Object.keys(source).length) localStorage.setItem(SOURCE, JSON.stringify(source))
  } catch {
    /* private mode: nothing kept */
  }
}

function storedRef(): string | null {
  try {
    return localStorage.getItem(REF)
  } catch {
    return null
  }
}

function storedSource(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(SOURCE) ?? '{}') as Record<string, string>
  } catch {
    return {}
  }
}

type Props = Record<string, string | boolean | number>

function el<K extends keyof HTMLElementTagNameMap>(tag: K, props: Props = {}, ...children: (Node | string)[]): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  Object.assign(node, props)
  node.append(...children)
  return node
}

function dialog(): HTMLDialogElement {
  let d = document.querySelector<HTMLDialogElement>('dialog.waitlist')
  if (d) return d
  d = el('dialog', { className: 'waitlist' })
  d.setAttribute('aria-labelledby', 'waitlist-title')
  d.addEventListener('click', (e) => e.target === d && d!.close())
  document.body.append(d)
  return d
}

function frame(title: string, ...body: Node[]) {
  const d = dialog()
  const close = el('button', { type: 'button', className: 'waitlist-close', ariaLabel: t('Fechar') }, '×')
  close.addEventListener('click', () => d.close())
  d.replaceChildren(close, el('h2', { id: 'waitlist-title' }, title), ...body)
  if (!d.open) d.showModal()
  return d
}

function joinForm() {
  const input = el('input', { type: 'email', required: true, autocomplete: 'email', placeholder: t('Seu e-mail'), name: 'email' })
  input.setAttribute('aria-label', t('Seu e-mail'))
  const button = el('button', { type: 'submit', className: 'button' }, t('Entrar na fila'))
  const note = el('p', { className: 'waitlist-note' }, t('Grátis. Sem cartão. Um e-mail para confirmar e outro quando chegar a sua vez.'))
  const form = el('form', { className: 'waitlist-form' }, input, button)
  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    button.disabled = true
    try {
      const res = await fetch(`${appUrl()}/api/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: input.value.trim(),
          locale: LANG === 'pt-BR' ? 'pt-BR' : BASE,
          country: guessCountry(),
          ref: storedRef(),
          source: { ...storedSource(), lang: LANG },
        }),
      })
      if (res.ok) {
        note.textContent = t('Confira seu e-mail: falta um clique para garantir seu lugar.')
        note.classList.add('ok')
        form.remove()
      } else {
        note.textContent = res.status === 429 ? t('Muitas tentativas daqui. Tente mais tarde.') : res.status === 422 ? t('E-mail inválido.') : t('Não deu certo. Tente de novo em instantes.')
      }
    } catch {
      note.textContent = t('Não deu certo. Tente de novo em instantes.')
    } finally {
      button.disabled = false
    }
  })
  frame(t('Entrar na lista de espera'), form, note)
  input.focus()
}

type Place = { position: number | null; total: number; referrals: number; founder: boolean; founder_at: number; link: string }

async function showPlace(code: string) {
  if (code === 'vencida') {
    frame(t('Entrar na lista de espera'), el('p', {}, t('O link de confirmação venceu. Entre na fila de novo para receber outro.')))
    return
  }
  try {
    const res = await fetch(`${appUrl()}/api/waitlist/${encodeURIComponent(code)}`)
    if (!res.ok) return
    const place = (await res.json()) as Place
    try {
      localStorage.setItem('clipper-waitlist', code)
    } catch {
      /* fine */
    }
    const figures = el(
      'dl',
      { className: 'waitlist-figures' },
      el('div', {}, el('dt', {}, t('Posição')), el('dd', { className: 'tnum' }, place.position ? `${place.position}` : '—'), el('small', {}, t('de {total}', { total: place.total }))),
      el('div', {}, el('dt', {}, t('Amigos que entraram')), el('dd', { className: 'tnum' }, `${place.referrals}`)),
    )
    const link = el('input', { value: place.link, readOnly: true, className: 'waitlist-link' })
    link.setAttribute('aria-label', t('Copiar link'))
    const copy = el('button', { type: 'button', className: 'button button-quiet' }, t('Copiar link'))
    copy.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(place.link)
        copy.textContent = t('Copiado')
      } catch {
        link.select()
      }
    })
    const message = `${t('Estou usando o clipper para cortar lives no automático. Entra pelo meu link e sobe a gente na fila:')} ${place.link}`
    const shares = [
      ['WhatsApp', `https://wa.me/?text=${encodeURIComponent(message)}`],
      ['Telegram', `https://t.me/share/url?url=${encodeURIComponent(place.link)}&text=${encodeURIComponent(message)}`],
      ['X', `https://x.com/intent/post?text=${encodeURIComponent(message)}`],
    ].map(([label, href]) => el('a', { href, target: '_blank', rel: 'noopener', className: 'button button-quiet' }, label))
    const why = el(
      'p',
      { className: 'waitlist-note' },
      place.founder ? t('Você já ganhou os 30 dias do Pro no lançamento.') : t('Cada amigo que confirmar pelo seu link te sobe 100 posições. Com {n} amigos, você começa com 30 dias do Pro.', { n: place.founder_at }),
    )
    frame(t('Você está na fila'), figures, why, el('div', { className: 'waitlist-share' }, link, copy), el('div', { className: 'waitlist-share' }, ...shares))
  } catch {
    /* the app is away: nothing to show */
  }
}

/** On the Portuguese pages, people whose browser speaks another of the site's languages get a
 * quiet offer to switch (never a redirect: search engines and shared links keep working). */
function offerLanguage() {
  if (LANG !== 'pt-BR') return
  const wanted = (navigator.languages ?? [navigator.language]).map((l) => l.toLowerCase().split('-')[0]).find((l) => l !== 'pt')
  if (!wanted || !['es', 'en', 'tr'].includes(wanted)) return
  if (navigator.language.toLowerCase().startsWith('pt')) return
  try {
    if (localStorage.getItem('clipper-lang-offer')) return
  } catch {
    return
  }
  const target = document.querySelector<HTMLAnchorElement>(`.lang-switch a[hreflang="${wanted}"]`)
  if (!target) return
  const names: Record<string, [string, string]> = { es: ['Español', '¿Ver en Español?'], en: ['English', 'View in English?'], tr: ['Türkçe', 'Türkçe görüntüle?'] }
  const bar = el('div', { className: 'lang-offer' }, el('a', { href: target.href, lang: wanted }, names[wanted][1]))
  const no = el('button', { type: 'button', ariaLabel: t('Fechar') }, '×')
  no.addEventListener('click', () => {
    bar.remove()
    try {
      localStorage.setItem('clipper-lang-offer', 'no')
    } catch {
      /* fine */
    }
  })
  bar.append(no)
  document.body.append(bar)
}

export function setupWaitlist() {
  remember()
  offerLanguage()
  if (!appUrl()) return
  document.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('[data-waitlist]')
    if (!a) return
    e.preventDefault()
    joinForm()
  })
  const code = new URLSearchParams(location.search).get('lista')
  if (code) void showPlace(code)
}
