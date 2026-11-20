import './styles.css'

const nav = document.querySelector('[data-nav]')
const onScroll = () => nav?.classList.toggle('solid', scrollY > 24)
addEventListener('scroll', onScroll, { passive: true })
onScroll()
