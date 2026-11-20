/**
 * The "stream" drawn in the hero: a generic night drive (no game footage, no real streamer)
 * with a webcam box in the corner. One offscreen canvas is drawn per frame; the 16:9 stream and
 * the 9:16 phone both copy from it, the way the real clipper crops the source.
 */

export const W = 960
export const H = 540
// the webcam overlay, in scene pixels
export const CAM = { x: 22, y: 318, w: 250, h: 200 }

const rand = (seed: number) => {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

const r = rand(7)
const STARS = Array.from({ length: 70 }, () => [r() * W, r() * H * 0.45, r() * 1.4 + 0.3])
const SKYLINE = Array.from({ length: 34 }, (_, i) => ({
  x: i * 38,
  w: 26 + r() * 26,
  h: 30 + r() * 110,
  lit: Array.from({ length: 6 }, () => r() > 0.55),
}))
const HILLS = Array.from({ length: 14 }, (_, i) => ({ x: i * 110, h: 40 + r() * 60 }))

export function createScene() {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  /** t: seconds; react: 0..1 how hard the streamer is laughing right now */
  function draw(t: number, react: number) {
    const horizon = H * 0.56
    // sky
    const sky = ctx.createLinearGradient(0, 0, 0, horizon)
    sky.addColorStop(0, '#120b2a')
    sky.addColorStop(0.55, '#3b1453')
    sky.addColorStop(1, '#c43a6c')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, W, horizon)
    for (const [x, y, s] of STARS) {
      ctx.globalAlpha = 0.35 + 0.35 * Math.sin(t * 1.3 + x)
      ctx.fillStyle = '#fff'
      ctx.fillRect(x, y, s, s)
    }
    ctx.globalAlpha = 1

    // sun with scanline cuts
    const sunX = W * 0.6
    const sunY = horizon - 18
    const sun = ctx.createLinearGradient(0, sunY - 120, 0, sunY + 40)
    sun.addColorStop(0, '#ffe36b')
    sun.addColorStop(1, '#ff4d8a')
    ctx.fillStyle = sun
    ctx.beginPath()
    ctx.arc(sunX, sunY, 118, Math.PI, 0)
    ctx.fill()
    ctx.fillStyle = '#c43a6c'
    for (let i = 0; i < 7; i++) {
      const y = sunY - 60 + i * 11 + ((t * 8) % 11)
      ctx.fillRect(sunX - 130, y, 260, 2 + i * 0.7)
    }

    // hills and skyline, parallax
    ctx.fillStyle = '#2a0f3d'
    const hillShift = (t * 12) % 110
    ctx.beginPath()
    ctx.moveTo(0, horizon)
    for (const hill of HILLS) {
      const x = hill.x - hillShift
      ctx.quadraticCurveTo(x + 55, horizon - hill.h, x + 110, horizon)
    }
    ctx.lineTo(W, horizon)
    ctx.fill()
    const cityShift = (t * 26) % 38
    for (const b of SKYLINE) {
      const x = b.x - cityShift
      ctx.fillStyle = '#170a26'
      ctx.fillRect(x, horizon - b.h, b.w, b.h)
      ctx.fillStyle = '#ffcf6b'
      b.lit.forEach((on, k) => {
        if (on) ctx.fillRect(x + 5 + (k % 2) * 10, horizon - b.h + 10 + Math.floor(k / 2) * 14, 4, 5)
      })
    }

    // road with perspective lines
    const ground = ctx.createLinearGradient(0, horizon, 0, H)
    ground.addColorStop(0, '#1a0a26')
    ground.addColorStop(1, '#07040c')
    ctx.fillStyle = ground
    ctx.fillRect(0, horizon, W, H - horizon)
    ctx.strokeStyle = 'rgba(255,77,138,0.55)'
    ctx.lineWidth = 1.2
    for (let i = -12; i <= 12; i++) {
      ctx.beginPath()
      ctx.moveTo(W / 2 + i * 14, horizon)
      ctx.lineTo(W / 2 + i * 120, H)
      ctx.stroke()
    }
    const speed = (t * 0.9) % 1
    for (let k = 0; k < 9; k++) {
      const p = (k + speed) / 9
      const y = horizon + (H - horizon) * p * p
      ctx.globalAlpha = p
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(W, y)
      ctx.stroke()
    }
    ctx.globalAlpha = 1

    // the car
    const bob = Math.sin(t * 9) * 1.5
    const carX = W * 0.56 + Math.sin(t * 0.7) * 30
    const carY = H * 0.8 + bob
    ctx.fillStyle = '#0b0b12'
    ctx.beginPath()
    ctx.roundRect(carX - 90, carY - 26, 180, 46, 12)
    ctx.fill()
    ctx.beginPath()
    ctx.roundRect(carX - 56, carY - 56, 112, 36, 14)
    ctx.fill()
    ctx.fillStyle = '#ff3355'
    ctx.fillRect(carX - 82, carY - 14, 34, 8)
    ctx.fillRect(carX + 48, carY - 14, 34, 8)
    ctx.shadowColor = '#ff3355'
    ctx.shadowBlur = 18
    ctx.fillRect(carX - 82, carY - 14, 34, 8)
    ctx.fillRect(carX + 48, carY - 14, 34, 8)
    ctx.shadowBlur = 0

    drawCam(t, react)
  }

  function drawCam(t: number, react: number) {
    const { x, y, w, h } = CAM
    ctx.save()
    ctx.beginPath()
    ctx.roundRect(x, y, w, h, 10)
    ctx.clip()
    const room = ctx.createLinearGradient(x, y, x + w, y + h)
    room.addColorStop(0, '#2d3443')
    room.addColorStop(1, '#161a22')
    ctx.fillStyle = room
    ctx.fillRect(x, y, w, h)
    // shelf lights behind
    ctx.fillStyle = 'rgba(255, 210, 120, 0.35)'
    for (let i = 0; i < 5; i++) ctx.fillRect(x + 14 + i * 46, y + 22, 24, 3)

    const shake = react > 0.2 ? Math.sin(t * 38) * 3 * react : 0
    const lean = react * 6
    const cx = x + w * 0.5 + shake
    const cy = y + h * 0.5 - lean
    // shoulders
    ctx.fillStyle = '#0f1116'
    ctx.beginPath()
    ctx.ellipse(cx, y + h + 10, 92, 62, 0, Math.PI, 0)
    ctx.fill()
    // head
    ctx.fillStyle = '#d8b89c'
    ctx.beginPath()
    ctx.ellipse(cx, cy, 36, 44, 0, 0, Math.PI * 2)
    ctx.fill()
    // hair
    ctx.fillStyle = '#20160f'
    ctx.beginPath()
    ctx.ellipse(cx, cy - 26, 38, 22, 0, Math.PI, 0)
    ctx.fill()
    // headset
    ctx.strokeStyle = '#0b0c10'
    ctx.lineWidth = 7
    ctx.beginPath()
    ctx.arc(cx, cy - 4, 46, Math.PI * 1.08, Math.PI * 1.92)
    ctx.stroke()
    ctx.fillStyle = '#0b0c10'
    ctx.beginPath()
    ctx.roundRect(cx - 52, cy - 10, 14, 30, 5)
    ctx.roundRect(cx + 38, cy - 10, 14, 30, 5)
    ctx.fill()
    // eyes: squint when laughing
    ctx.fillStyle = '#1a1310'
    const eyeH = Math.max(1.2, 5 * (1 - react * 0.85))
    ctx.fillRect(cx - 17, cy - 6, 10, eyeH)
    ctx.fillRect(cx + 7, cy - 6, 10, eyeH)
    // mouth: open on a laugh
    ctx.fillStyle = '#5a1f1f'
    ctx.beginPath()
    const open = 2 + react * (12 + Math.abs(Math.sin(t * 22)) * 6)
    ctx.ellipse(cx, cy + 20, 12 + react * 4, open / 2, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    // the overlay's frame and name bar, like a real stream layout
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.roundRect(x, y, w, h, 10)
    ctx.stroke()
  }

  return { canvas, draw }
}

/** Copy the scene into the phone as the "split" layout: webcam on top, the action below. */
export function drawPhone(
  target: CanvasRenderingContext2D,
  scene: HTMLCanvasElement,
  zoom: number,
) {
  const pw = target.canvas.width
  const ph = target.canvas.height
  const camH = Math.round(ph * 0.4)
  target.fillStyle = '#000'
  target.fillRect(0, 0, pw, ph)
  // webcam: crop to the phone's width ratio
  const camRatio = pw / camH
  const cw = CAM.w
  const ch = cw / camRatio
  target.drawImage(scene, CAM.x, CAM.y + (CAM.h - ch) / 2, cw, ch, 0, 0, pw, camH)
  // the action: centre crop of the stream, punched in on the reaction
  const gh = ph - camH
  const ratio = pw / gh
  const srcH = (H * 0.92) / zoom
  const srcW = srcH * ratio
  const sx = W * 0.56 - srcW / 2
  const sy = H * 0.5 - srcH / 2 + 20
  target.drawImage(scene, sx, sy, srcW, srcH, 0, camH, pw, gh)
  target.fillStyle = '#000'
  target.fillRect(0, camH - 1, pw, 2)
}
