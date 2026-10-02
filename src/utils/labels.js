import { CanvasTexture, NearestFilter, SRGBColorSpace } from 'three'
import { seededRandom } from './random.js'

// Canvas-painted textures for the hub: Roblox-style billboard text, signs,
// TNT and ore block faces, and the leaderboard panels. Built once per key.
// Text uses the Fredoka webfont, so callers must wait for fontsReady() (see
// components/world/useFonts.js) before building anything here.
const cache = new Map()
export const FONT = 'Fredoka, "Lilita One", "Arial Black", sans-serif'

function make(key, w, h, draw, { pixel = false } = {}) {
  if (cache.has(key)) return cache.get(key)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  draw(ctx, w, h)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 8
  if (pixel) texture.magFilter = NearestFilter
  cache.set(key, texture)
  return texture
}

// --- text + icons -----------------------------------------------------------

export function strokeText(ctx, text, x, y, size, fill = '#fff', { stroke = '#141414', align = 'center', weight = 700, strokeScale = 0.2 } = {}) {
  ctx.font = `${weight} ${size}px ${FONT}`
  ctx.textAlign = align
  ctx.textBaseline = 'middle'
  ctx.lineJoin = 'round'
  ctx.miterLimit = 2
  if (stroke) {
    ctx.strokeStyle = stroke
    ctx.lineWidth = size * strokeScale
    ctx.strokeText(text, x, y)
  }
  ctx.fillStyle = fill
  ctx.fillText(text, x, y)
}

function poly(ctx, pts) {
  ctx.beginPath()
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
  ctx.closePath()
}

function hexPts(cx, cy, r) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = Math.PI / 6 + (i * Math.PI) / 3
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]
  })
}

function burstPts(cx, cy, r1, r2, n, rot = 0) {
  const pts = []
  for (let i = 0; i < n * 2; i++) {
    const a = rot + (i * Math.PI) / n
    const r = i % 2 ? r2 : r1
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r])
  }
  return pts
}

// Small icons painted into billboards; s = icon box size in px.
export function drawIcon(ctx, kind, cx, cy, s) {
  const r = s / 2
  ctx.save()
  ctx.lineJoin = 'round'
  if (kind === 'gem') {
    poly(ctx, hexPts(cx, cy, r * 0.95))
    ctx.fillStyle = '#2fd13b'
    ctx.fill()
    ctx.lineWidth = s * 0.1
    ctx.strokeStyle = '#0b4f14'
    ctx.stroke()
    poly(ctx, hexPts(cx, cy, r * 0.48))
    ctx.fillStyle = '#108a23'
    ctx.fill()
    ctx.lineWidth = s * 0.07
    ctx.stroke()
  } else if (kind === 'rebirth') {
    ctx.beginPath()
    ctx.arc(cx, cy, r * 0.9, 0, Math.PI * 2)
    ctx.fillStyle = '#eef4ff'
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(cx - r * 0.9, cy + r * 0.05)
    ctx.quadraticCurveTo(cx, cy - r * 0.45, cx + r * 0.9, cy + r * 0.1)
    ctx.arc(cx, cy, r * 0.9, 0.1, Math.PI + 0.05, true)
    ctx.fillStyle = '#ff2f6d'
    ctx.fill()
    ctx.beginPath()
    ctx.arc(cx, cy, r * 0.9, 0, Math.PI * 2)
    ctx.lineWidth = s * 0.09
    ctx.strokeStyle = '#1b1b2a'
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(cx - r * 0.25, cy - r * 0.4, r * 0.16, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255,255,255,0.8)'
    ctx.fill()
  } else if (kind === 'cash') {
    for (let i = 0; i < 2; i++) {
      ctx.save()
      ctx.translate(cx + (i ? r * 0.12 : -r * 0.12), cy + (i ? r * 0.15 : -r * 0.1))
      ctx.rotate(-0.35)
      ctx.fillStyle = i ? '#39c24a' : '#2a9a38'
      ctx.strokeStyle = '#0d4d17'
      ctx.lineWidth = s * 0.07
      ctx.fillRect(-r * 0.85, -r * 0.45, r * 1.7, r * 0.9)
      ctx.strokeRect(-r * 0.85, -r * 0.45, r * 1.7, r * 0.9)
      if (i) {
        ctx.fillStyle = '#f7d339'
        ctx.fillRect(-r * 0.15, -r * 0.45, r * 0.3, r * 0.9)
      }
      ctx.restore()
    }
  } else if (kind === 'tnt') {
    ctx.fillStyle = '#e3262b'
    ctx.strokeStyle = '#4a0b0b'
    ctx.lineWidth = s * 0.07
    ctx.fillRect(cx - r * 0.85, cy - r * 0.7, r * 1.7, r * 1.4)
    ctx.strokeRect(cx - r * 0.85, cy - r * 0.7, r * 1.7, r * 1.4)
    ctx.fillStyle = '#fff'
    ctx.fillRect(cx - r * 0.85, cy - r * 0.25, r * 1.7, r * 0.5)
    strokeText(ctx, 'TNT', cx, cy + r * 0.02, r * 0.45, '#222', { stroke: null })
  } else if (kind === 'basket') {
    ctx.strokeStyle = '#4a0b0b'
    ctx.lineWidth = s * 0.1
    ctx.beginPath()
    ctx.arc(cx, cy - r * 0.05, r * 0.55, Math.PI * 1.05, Math.PI * 1.95)
    ctx.stroke()
    poly(ctx, [[cx - r * 0.9, cy - r * 0.15], [cx + r * 0.9, cy - r * 0.15], [cx + r * 0.65, cy + r * 0.75], [cx - r * 0.65, cy + r * 0.75]])
    ctx.fillStyle = '#ef2a2a'
    ctx.fill()
    ctx.lineWidth = s * 0.08
    ctx.stroke()
    ctx.lineWidth = s * 0.05
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath()
      ctx.moveTo(cx + i * r * 0.4, cy - r * 0.1)
      ctx.lineTo(cx + i * r * 0.32, cy + r * 0.7)
      ctx.stroke()
    }
  } else if (kind === 'upgrade') {
    for (let i = 0; i < 2; i++) {
      const y = cy - r * 0.35 + i * r * 0.62
      poly(ctx, [[cx, y - r * 0.55], [cx + r * 0.85, y + r * 0.2], [cx + r * 0.45, y + r * 0.45], [cx, y + r * 0.05], [cx - r * 0.45, y + r * 0.45], [cx - r * 0.85, y + r * 0.2]])
      ctx.fillStyle = i ? '#29b52f' : '#7df04a'
      ctx.fill()
      ctx.lineWidth = s * 0.08
      ctx.strokeStyle = '#0c3d10'
      ctx.stroke()
    }
  } else if (kind === 'burst') {
    poly(ctx, burstPts(cx, cy, r * 0.95, r * 0.55, 10))
    ctx.fillStyle = '#ff7a1a'
    ctx.fill()
    poly(ctx, burstPts(cx, cy, r * 0.65, r * 0.35, 8, 0.3))
    ctx.fillStyle = '#ffd43a'
    ctx.fill()
    ctx.beginPath()
    ctx.arc(cx, cy, r * 0.22, 0, Math.PI * 2)
    ctx.fillStyle = '#fff8d8'
    ctx.fill()
  }
  ctx.restore()
}

// Billboard: centred lines of outlined text, each optionally led by an icon.
// line = { text, size, color, icon, stroke }. Returns { texture, aspect }.
export function billboardTexture(lines) {
  const key = 'bb:' + JSON.stringify(lines)
  if (cache.has(key)) return cache.get(key)
  const scratch = document.createElement('canvas').getContext('2d')
  const pad = 16
  let w = 0
  let h = pad * 2
  for (const l of lines) {
    scratch.font = `700 ${l.size}px ${FONT}`
    const tw = scratch.measureText(l.text).width + (l.icon ? l.size * 1.15 : 0)
    w = Math.max(w, tw + l.size * 0.5)
    h += l.size * 1.12
  }
  w = Math.ceil(w + pad * 2)
  h = Math.ceil(h)
  const texture = make(key + ':tex', w, h, (ctx) => {
    let y = pad
    for (const l of lines) {
      const lh = l.size * 1.12
      ctx.font = `700 ${l.size}px ${FONT}`
      const tw = ctx.measureText(l.text).width
      const iw = l.icon ? l.size * 1.15 : 0
      const x0 = (w - tw - iw) / 2
      if (l.icon) drawIcon(ctx, l.icon, x0 + l.size * 0.48, y + lh / 2, l.size * 0.95)
      strokeText(ctx, l.text, x0 + iw, y + lh / 2 + l.size * 0.04, l.size, l.color ?? '#fff', { align: 'left', stroke: l.stroke ?? '#141414' })
      y += lh
    }
  })
  const out = { texture, aspect: w / h }
  cache.set(key, out)
  return out
}

// Big framed banner (Training / Leaderboards / Desert).
export function bannerTexture(text, { bg, border, inner, textColor = '#fff', w = 1024, h = 300, size = 170 }) {
  return make(`banner:${text}:${bg}`, w, h, (ctx) => {
    ctx.fillStyle = border
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = bg
    ctx.fillRect(22, 22, w - 44, h - 44)
    if (inner) {
      ctx.strokeStyle = inner
      ctx.lineWidth = 6
      ctx.strokeRect(34, 34, w - 68, h - 68)
    }
    // soft top sheen
    const g = ctx.createLinearGradient(0, 22, 0, h / 2)
    g.addColorStop(0, 'rgba(255,255,255,0.18)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(22, 22, w - 44, h / 2 - 22)
    ctx.shadowColor = 'rgba(0,0,0,0.45)'
    ctx.shadowOffsetY = 8
    strokeText(ctx, text, w / 2, h / 2 + 6, size, textColor, { strokeScale: 0.14 })
  })
}

// --- block faces --------------------------------------------------------------

function noisyFill(ctx, w, h, base, spots, seed, cell = 8) {
  const rand = seededRandom(seed)
  ctx.fillStyle = base
  ctx.fillRect(0, 0, w, h)
  for (let y = 0; y < h; y += cell) {
    for (let x = 0; x < w; x += cell) {
      const v = rand()
      if (v < 0.35) {
        ctx.fillStyle = `rgba(0,0,0,${0.04 + rand() * 0.1})`
        ctx.fillRect(x, y, cell, cell)
      } else if (v > 0.8) {
        ctx.fillStyle = `rgba(255,255,255,${0.04 + rand() * 0.08})`
        ctx.fillRect(x, y, cell, cell)
      }
    }
  }
  if (spots) {
    for (let i = 0; i < spots.count; i++) {
      const x = Math.floor(rand() * (w / cell)) * cell
      const y = Math.floor(rand() * (h / cell)) * cell
      const sz = cell * (1 + Math.floor(rand() * 2))
      ctx.fillStyle = spots.colors[Math.floor(rand() * spots.colors.length)]
      ctx.fillRect(x, y, sz, sz)
      ctx.fillStyle = 'rgba(0,0,0,0.25)'
      ctx.fillRect(x + sz - cell / 2, y, cell / 2, sz)
    }
  }
}

const ORES = {
  wood: { base: '#9a6232', grain: true },
  stone: { base: '#8a8d93' },
  snow: { base: '#eaf6ff', spots: { count: 26, colors: ['#bfe3ff', '#d6eeff'] } },
  ruby: { base: '#5f5b62', spots: { count: 34, colors: ['#e3183c', '#ff4d6a', '#a10d28'] } },
  emerald: { base: '#6f746d', spots: { count: 38, colors: ['#22d64a', '#64ff7c', '#139b31'] } },
  gold: { base: '#7c7a73', spots: { count: 34, colors: ['#ffd21f', '#ffe970', '#d39b09'] } },
  dirt: { base: '#8b4f2a', spots: { count: 20, colors: ['#6e3b1c', '#a5643a'] } },
}

export function oreTexture(kind) {
  return make(`ore:${kind}`, 128, 128, (ctx, w, h) => {
    const o = ORES[kind] ?? ORES.stone
    noisyFill(ctx, w, h, o.base, o.spots, kind.length * 97 + 3)
    if (o.grain) {
      ctx.fillStyle = 'rgba(60,30,10,0.35)'
      for (let y = 0; y < h; y += 32) ctx.fillRect(0, y, w, 4)
      ctx.fillStyle = 'rgba(255,220,170,0.12)'
      for (let y = 14; y < h; y += 32) ctx.fillRect(0, y, w, 3)
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'
    ctx.lineWidth = 6
    ctx.strokeRect(3, 3, w - 6, h - 6)
  }, { pixel: true })
}

// TNT block: returns a 6-material face list [px, nx, py, ny, pz, nz] as textures.
export function tntFaces(kind) {
  const side = make(`tnt:${kind}:side`, 256, 256, (ctx, w, h) => {
    if (kind === 'green' || kind === 'red') {
      const [a, b, c] = kind === 'green' ? ['#1f9a3a', '#2bc04a', '#156b28'] : ['#d4232a', '#ef3a3a', '#8e1218']
      ctx.fillStyle = a
      ctx.fillRect(0, 0, w, h)
      for (let x = 0; x < w; x += 64) {
        ctx.fillStyle = b
        ctx.fillRect(x + 8, 0, 40, h)
        ctx.fillStyle = c
        ctx.fillRect(x + 48, 0, 6, h)
      }
      ctx.fillStyle = '#f4f4ee'
      ctx.fillRect(0, 88, w, 80)
      ctx.fillStyle = '#c9c9c0'
      ctx.fillRect(0, 160, w, 8)
      strokeText(ctx, 'TNT', w / 2, 130, 70, '#1b1b1b', { stroke: null, weight: 700 })
    } else if (kind === 'corrupt') {
      ctx.fillStyle = '#ffd400'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#ffe766'
      ctx.fillRect(16, 16, w - 32, 40)
      ctx.strokeStyle = '#222'
      ctx.lineWidth = 12
      ctx.strokeRect(6, 6, w - 12, h - 12)
      // checker corruption specks
      const rand = seededRandom(7)
      for (let i = 0; i < 28; i++) {
        ctx.fillStyle = rand() > 0.5 ? '#1b1b1b' : '#fff'
        ctx.fillRect(Math.floor(rand() * 16) * 16, Math.floor(rand() * 16) * 16, 16, 16)
      }
      ctx.fillStyle = '#ffd400'
      ctx.beginPath()
      ctx.arc(w / 2, h / 2, 86, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#1b1b1b'
      ctx.beginPath()
      ctx.ellipse(w / 2 - 34, h / 2 - 22, 13, 24, 0, 0, Math.PI * 2)
      ctx.ellipse(w / 2 + 34, h / 2 - 22, 13, 24, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.lineWidth = 14
      ctx.lineCap = 'round'
      ctx.strokeStyle = '#1b1b1b'
      ctx.beginPath()
      ctx.arc(w / 2, h / 2 + 4, 52, 0.25, Math.PI - 0.25)
      ctx.stroke()
    } else if (kind === 'admin') {
      ctx.fillStyle = '#d81920'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#ff3a3a'
      ctx.fillRect(0, 0, w, 30)
      ctx.fillStyle = '#9a0e13'
      ctx.fillRect(0, h - 30, w, 30)
      // sunglasses
      ctx.fillStyle = '#111'
      ctx.fillRect(40, 56, 176, 14)
      ctx.beginPath()
      ctx.roundRect(46, 64, 72, 48, 12)
      ctx.roundRect(138, 64, 72, 48, 12)
      ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      ctx.fillRect(58, 74, 18, 8)
      ctx.fillRect(150, 74, 18, 8)
      ctx.fillStyle = '#f4f4ee'
      ctx.fillRect(0, 140, w, 66)
      strokeText(ctx, 'ADMIN', w / 2, 175, 56, '#1b1b1b', { stroke: null })
    } else if (kind === 'atomic') {
      ctx.fillStyle = '#86f01f'
      ctx.fillRect(0, 0, w, h)
      ctx.strokeStyle = '#1b1b1b'
      ctx.lineWidth = 14
      ctx.strokeRect(7, 7, w - 14, h - 14)
      ctx.fillStyle = '#1b1b1b'
      const cx = w / 2
      const cy = h / 2
      for (let i = 0; i < 3; i++) {
        const a = -Math.PI / 2 + (i * Math.PI * 2) / 3
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.arc(cx, cy, 92, a - 0.52, a + 0.52)
        ctx.closePath()
        ctx.fill()
      }
      ctx.fillStyle = '#86f01f'
      ctx.beginPath()
      ctx.arc(cx, cy, 30, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#1b1b1b'
      ctx.beginPath()
      ctx.arc(cx, cy, 20, 0, Math.PI * 2)
      ctx.fill()
    }
  })
  const top = make(`tnt:${kind}:top`, 128, 128, (ctx, w, h) => {
    const base = { green: '#2bc04a', red: '#ef3a3a', corrupt: '#ffd400', admin: '#d81920', atomic: '#86f01f' }[kind]
    ctx.fillStyle = base
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = 'rgba(0,0,0,0.4)'
    ctx.lineWidth = 8
    ctx.strokeRect(4, 4, w - 8, h - 8)
    ctx.fillStyle = '#2a2a2a'
    ctx.beginPath()
    ctx.arc(w / 2, h / 2, 18, 0, Math.PI * 2)
    ctx.fill()
  })
  return [side, side, top, top, side, side]
}

// --- boards ---------------------------------------------------------------------

const LB_NAMES = ['BlastKing', 'BoomRider99', 'TNTerror', 'Kaboomz', 'DigDug42', 'CraterPro', 'MinerMax', 'Dynamyte', 'RockSmash', 'PixelPicks']
const LB_VALUES = {
  damage: ['1.55Sx', '817.7Qi', '400.8Qi', '163.0Qi', '96.2Qi', '44.1Qi', '12.9Qi', '5.3Qi', '880Qd', '412Qd'],
  rebirths: ['55', '30', '28', '25', '24', '21', '19', '17', '16', '14'],
  money: ['$297.8K', '$212.4K', '$171.0K', '$98.6K', '$77.2K', '$64.9K', '$51.3K', '$40.0K', '$31.8K', '$25.5K'],
}

export function leaderboardTexture(board) {
  return make(`lb:${board.id}`, 512, 640, (ctx, w, h) => {
    ctx.fillStyle = '#e88c2f'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#1d2238'
    ctx.fillRect(14, 14, w - 28, h - 28)
    // header
    ctx.fillStyle = '#2c3456'
    ctx.fillRect(14, 14, w - 28, 92)
    drawIcon(ctx, board.icon, 70, 60, 56)
    strokeText(ctx, board.title, 106, 62, 46, '#fff', { align: 'left' })
    const names = [...LB_NAMES.slice(board.id.length % 4), ...LB_NAMES.slice(0, board.id.length % 4)]
    const vals = LB_VALUES[board.id]
    const rankColor = ['#ffd33a', '#d9e2ec', '#e09155']
    for (let i = 0; i < 10; i++) {
      const y = 118 + i * 50
      ctx.fillStyle = i % 2 ? '#232a46' : '#2a3254'
      ctx.fillRect(26, y, w - 52, 46)
      strokeText(ctx, `#${i + 1}`, 38, y + 24, 28, rankColor[i] ?? '#fff', { align: 'left' })
      strokeText(ctx, names[i], 102, y + 24, 26, '#fff', { align: 'left', stroke: null, weight: 600 })
      strokeText(ctx, vals[i], w - 38, y + 24, 26, board.id === 'money' ? '#53e05f' : '#ffb347', { align: 'right' })
    }
  })
}

// Info boards next to the mine gate.
export function infoBoardTexture(kind) {
  return make(`info:${kind}`, 384, 256, (ctx, w, h) => {
    const theme = {
      secret: ['#5a2bb0', '#2a1063'],
      luck: ['#1fa83a', '#0d5a1c'],
      deep: ['#3a3f4a', '#1a1d24'],
    }[kind]
    ctx.fillStyle = theme[1]
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = theme[0]
    ctx.fillRect(12, 12, w - 24, h - 24)
    if (kind === 'secret') {
      strokeText(ctx, 'Secrets spawn', w / 2, 62, 40)
      strokeText(ctx, 'in Desert Mine', w / 2, 108, 34, '#e6d4ff')
      ctx.fillStyle = '#ffd33a'
      ctx.beginPath()
      ctx.roundRect(w / 2 - 90, 150, 180, 64, 14)
      ctx.fill()
      strokeText(ctx, 'Track it!', w / 2, 183, 34, '#fff')
    } else if (kind === 'luck') {
      drawIcon(ctx, 'gem', 52, 60, 52)
      strokeText(ctx, 'Mine Luck', 88, 62, 44, '#fff', { align: 'left' })
      strokeText(ctx, '1x  ▸  1.2x', w / 2, 132, 46, '#c8ff9a')
      ctx.fillStyle = '#0d5a1c'
      ctx.beginPath()
      ctx.roundRect(w / 2 - 80, 172, 160, 56, 12)
      ctx.fill()
      drawIcon(ctx, 'gem', w / 2 - 44, 200, 36)
      strokeText(ctx, '25K', w / 2 + 14, 202, 34, '#5bff6a')
    } else {
      strokeText(ctx, 'Deep', w / 2, 70, 52)
      strokeText(ctx, 'Tough', w / 2, 128, 52, '#ffb347')
      strokeText(ctx, 'Block', w / 2, 186, 52)
    }
  })
}

// Dark "Mine" doorway: green glow fading up from the floor.
export function portalTexture() {
  return make('portal', 256, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, h, 0, 0)
    g.addColorStop(0, '#5df07a')
    g.addColorStop(0.35, '#1c8a3a')
    g.addColorStop(1, '#06120a')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
    const rand = seededRandom(5)
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(190,255,200,${0.15 + rand() * 0.4})`
      ctx.fillRect(rand() * w, h * 0.3 + rand() * h * 0.7, 4, 4)
    }
  })
}

// Index book cover.
export function bookTexture() {
  return make('book', 128, 160, (ctx, w, h) => {
    ctx.fillStyle = '#1f6fe0'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#0f3f8f'
    ctx.fillRect(0, 0, 18, h)
    ctx.strokeStyle = '#7fb6ff'
    ctx.lineWidth = 4
    ctx.strokeRect(30, 14, w - 44, h - 28)
    ctx.fillStyle = '#ffd33a'
    poly(ctx, burstPts(w / 2 + 8, h / 2, 26, 11, 5, -Math.PI / 2))
    ctx.fill()
  })
}
