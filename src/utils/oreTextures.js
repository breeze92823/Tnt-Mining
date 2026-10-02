import { CanvasTexture, LinearMipmapLinearFilter, MeshStandardMaterial, SRGBColorSpace } from 'three'

// Stylized, clean face textures for the mine ores: a smooth blue-grey stone
// face with a soft tonal wash and a thin light bevel line, plus per-ore
// features — studded clay (Common), plain stone (Uncommon), chunky coal blobs
// (Rare) and bright glowing nuggets (Legendary / Mythic / Secret). The nuggets
// also go into an emissive map so they glow in the dark of the pit.
const N = 256

function rng(seed) {
  let s = seed >>> 0 || 1
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 4294967296
  }
}

const SPECS = {
  common: { base: '#9a5124', light: '#b3632f', dark: '#7d3f1a', line: '#c97a44', studs: true },
  uncommon: { base: '#5b6c86', light: '#6a7b95', dark: '#4c5b73', line: '#8797b0' },
  rare: { base: '#4d5b75', light: '#5b6982', dark: '#3f4b62', line: '#7787a2', coal: 8 },
  legendary: { base: '#55647e', light: '#64738c', dark: '#46546b', line: '#8191ab', ore: ['#b84a00', '#ff9a12', '#ffe07a'] },
  mythic: { base: '#55647e', light: '#64738c', dark: '#46546b', line: '#8191ab', ore: ['#0a63b8', '#22b2ff', '#bff0ff'] },
  secret: { base: '#262e4a', light: '#303a5a', dark: '#1c2238', line: '#4a5680', ore: ['#1a2fa8', '#3d6bff', '#c7d6ff'] },
}

// Rounded irregular blob path around (x, y).
function blob(g, r, x, y, rad, squash = 0.8, pts = 9) {
  const p = Array.from({ length: pts }, (_, i) => {
    const a = (i / pts) * Math.PI * 2
    const rr = rad * (0.75 + r() * 0.4)
    return [x + Math.cos(a) * rr, y + Math.sin(a) * rr * squash]
  })
  g.beginPath()
  for (let i = 0; i < pts; i++) {
    const a = p[i]
    const b = p[(i + 1) % pts]
    const mx = (a[0] + b[0]) / 2
    const my = (a[1] + b[1]) / 2
    if (i === 0) g.moveTo(mx, my)
    else g.quadraticCurveTo(a[0], a[1], mx, my)
  }
  g.quadraticCurveTo(p[0][0], p[0][1], (p[0][0] + p[1][0]) / 2, (p[0][1] + p[1][1]) / 2)
  g.closePath()
}

// A shiny nugget: dark rim, bright body, light highlight on the upper-left.
function nugget(g, eg, r, x, y, rad, pal) {
  const seed = Math.floor(r() * 1e9)
  const rr = () => rng(seed)
  blob(g, rr(), x, y, rad * 1.12, 0.78)
  g.fillStyle = pal[0]
  g.fill()
  blob(g, rr(), x, y, rad, 0.78)
  const grd = g.createRadialGradient(x - rad * 0.3, y - rad * 0.35, rad * 0.1, x, y, rad)
  grd.addColorStop(0, pal[2])
  grd.addColorStop(0.45, pal[1])
  grd.addColorStop(1, pal[0])
  g.fillStyle = grd
  g.fill()
  g.fillStyle = 'rgba(255,255,255,0.7)'
  g.beginPath()
  g.ellipse(x - rad * 0.32, y - rad * 0.3, rad * 0.28, rad * 0.16, -0.5, 0, Math.PI * 2)
  g.fill()
  blob(eg, rr(), x, y, rad * 1.05, 0.78)
  eg.fillStyle = pal[1]
  eg.fill()
}

function build(id, seed) {
  const sp = SPECS[id]
  const r = rng(seed * 7919)
  const col = document.createElement('canvas')
  const glow = document.createElement('canvas')
  col.width = col.height = glow.width = glow.height = N
  const g = col.getContext('2d')
  const eg = glow.getContext('2d')
  eg.fillStyle = '#000'
  eg.fillRect(0, 0, N, N)

  // smooth face: base + soft diagonal light wash + a few large faint patches
  g.fillStyle = sp.base
  g.fillRect(0, 0, N, N)
  const wash = g.createLinearGradient(0, 0, N, N)
  wash.addColorStop(0, sp.light)
  wash.addColorStop(0.55, sp.base)
  wash.addColorStop(1, sp.dark)
  g.globalAlpha = 0.6
  g.fillStyle = wash
  g.fillRect(0, 0, N, N)
  g.globalAlpha = 0.12
  for (let i = 0; i < 6; i++) {
    blob(g, r, r() * N, r() * N, 30 + r() * 40, 0.7)
    g.fillStyle = r() > 0.5 ? sp.light : sp.dark
    g.fill()
  }
  g.globalAlpha = 1

  // Common: a grid of small round dimples, like moulded clay
  if (sp.studs) {
    const step = 32
    for (let y = step / 2; y < N; y += step) {
      for (let x = step / 2; x < N; x += step) {
        g.fillStyle = sp.dark
        g.beginPath()
        g.arc(x + 1, y + 1.5, 5, 0, Math.PI * 2)
        g.fill()
        g.fillStyle = sp.light
        g.beginPath()
        g.arc(x, y, 4, 0, Math.PI * 2)
        g.fill()
      }
    }
  }

  // Rare: chunky dark coal blobs with a soft top highlight
  for (let i = 0; i < (sp.coal || 0); i++) {
    const x = 34 + r() * (N - 68)
    const y = 34 + r() * (N - 68)
    const rad = 10 + r() * 9
    const s = Math.floor(r() * 1e9)
    blob(g, rng(s), x, y, rad, 0.75)
    g.fillStyle = '#15181f'
    g.fill()
    blob(g, rng(s), x - rad * 0.12, y - rad * 0.15, rad * 0.6, 0.6)
    g.fillStyle = 'rgba(120,135,160,0.35)'
    g.fill()
  }

  // Ores: one big nugget cluster in the middle, small flecks around it
  if (sp.ore) {
    const cx = N / 2 + (r() - 0.5) * 30
    const cy = N / 2 + (r() - 0.5) * 30
    nugget(g, eg, r, cx, cy, 26, sp.ore)
    for (let i = 0; i < 3; i++) {
      const a = r() * Math.PI * 2
      nugget(g, eg, r, cx + Math.cos(a) * 28, cy + Math.sin(a) * 22, 12 + r() * 6, sp.ore)
    }
    for (let i = 0; i < 6; i++) {
      let x
      let y
      do {
        x = 26 + r() * (N - 52)
        y = 26 + r() * (N - 52)
      } while (Math.hypot(x - cx, y - cy) < 70)
      nugget(g, eg, r, x, y, 6 + r() * 6, sp.ore)
    }
  }

  // thin bevel: light inner line, dark outer edge
  g.strokeStyle = sp.dark
  g.lineWidth = 6
  g.strokeRect(0, 0, N, N)
  g.strokeStyle = sp.line
  g.globalAlpha = 0.7
  g.lineWidth = 3
  g.strokeRect(5, 5, N - 10, N - 10)
  g.globalAlpha = 1

  const tex = (c) => {
    const t = new CanvasTexture(c)
    t.colorSpace = SRGBColorSpace
    t.minFilter = LinearMipmapLinearFilter
    t.anisotropy = 8
    return t
  }
  return { map: tex(col), emissiveMap: sp.ore ? tex(glow) : null }
}

// A material per ore, in ORES order.
export function oreMaterial(id, index) {
  const t = build(id, index + 1)
  const mat = new MeshStandardMaterial({ map: t.map, roughness: 0.8, metalness: 0 })
  if (t.emissiveMap) {
    mat.emissiveMap = t.emissiveMap
    mat.emissive.set('#ffffff')
    mat.emissiveIntensity = 1.1
  }
  return mat
}
