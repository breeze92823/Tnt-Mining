import { useEffect, useState } from 'react'
import { ORES } from '../../data/ores.js'
import { onCollect } from '../../systems/pickups.js'
import { playerScreen } from '../../systems/playerState.js'
import { compact } from '../../utils/compact.js'

// "Common x3" cards that pop up at a random spot around the player whenever ore
// is collected: the item name small on top, the rarity big, the block and the
// amount. Collecting the same ore again while its card is up adds to that card
// (and keeps it alive); a different ore gets its own card. A card leaves
// IDLE_MS after its last pickup. The inventory itself is credited immediately,
// in systems/pickups.js. Styles in hud.css (`hud-collect*`).
const IDLE_MS = 1100
const LEAVE_MS = 450
let nextId = 1

// Mixes a #rrggbb colour toward white (f > 0) or black (f < 0).
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16)
  const ch = (v) => Math.round(f >= 0 ? v + (255 - v) * f : v * (1 + f))
  return `rgb(${ch((n >> 16) & 255)},${ch((n >> 8) & 255)},${ch(n & 255)})`
}

function Cube({ base }) {
  const top = shade(base, 0.3)
  const right = shade(base, -0.3)
  return (
    <svg className="hud-collect-cube" viewBox="0 0 100 100" aria-hidden="true">
      <g strokeLinejoin="round" stroke="#1b1109" strokeWidth="5">
        <polygon points="50,6 92,28 50,50 8,28" fill={top} />
        <polygon points="8,28 50,50 50,94 8,72" fill={base} />
        <polygon points="92,28 50,50 50,94 92,72" fill={right} />
      </g>
    </svg>
  )
}

export default function CollectPopups() {
  const [cards, setCards] = useState([])

  useEffect(() => {
    const timers = new Map() // ORES index -> { idle, gone } timeouts of its live card
    const live = new Map() // ORES index -> card id currently accepting pickups
    const patch = (id, fn) => setCards((c) => c.map((k) => (k.id === id ? fn(k) : k)))
    const arm = (ore, id) => {
      const t = timers.get(ore) || {}
      clearTimeout(t.idle)
      clearTimeout(t.gone)
      t.idle = setTimeout(() => {
        live.delete(ore)
        patch(id, (k) => ({ ...k, leaving: true }))
        t.gone = setTimeout(() => setCards((c) => c.filter((k) => k.id !== id)), LEAVE_MS)
      }, IDLE_MS)
      timers.set(ore, t)
    }
    const off = onCollect((ore, amount) => {
      const id = live.get(ore)
      if (id !== undefined) {
        patch(id, (k) => ({ ...k, amount: k.amount + amount, bump: k.bump + 1 }))
        arm(ore, id)
        return
      }
      // New card at a random spot on a ring around the player's chest.
      const s = Math.max(0.42, Math.min(innerWidth / 1920, innerHeight / 991))
      const a = Math.random() * Math.PI * 2
      const r = (120 + Math.random() * 120) * s
      const card = {
        id: nextId++,
        ore,
        amount,
        bump: 0,
        leaving: false,
        x: Math.min(innerWidth - 90 * s, Math.max(90 * s, playerScreen.x * innerWidth + Math.cos(a) * r * 1.3)),
        y: Math.min(innerHeight - 90 * s, Math.max(90 * s, playerScreen.y * innerHeight + Math.sin(a) * r)),
        tilt: (Math.random() - 0.5) * 14,
      }
      live.set(ore, card.id)
      timers.set(ore, {}) // fresh timers: the previous card of this ore may still be leaving
      setCards((c) => [...c, card])
      arm(ore, card.id)
    })
    return () => {
      off()
      for (const t of timers.values()) {
        clearTimeout(t.idle)
        clearTimeout(t.gone)
      }
    }
  }, [])

  return (
    <div className="hud-collect-layer">
      {cards.map((c) => {
        const o = ORES[c.ore]
        return (
          <div key={c.id} className="hud-collect" style={{ left: c.x, top: c.y, '--tilt': `${c.tilt}deg` }}>
            <div className={`hud-collect-inner${c.leaving ? ' is-leaving' : ''}`}>
              <span className="hud-collect-item">{o.itemName}</span>
              <span className="hud-collect-name">{o.name}</span>
              <Cube base={o.base} />
              <span key={c.bump} className="hud-collect-amount">x{compact(c.amount)}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
