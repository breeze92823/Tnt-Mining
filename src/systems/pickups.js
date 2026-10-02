import { player } from './playerState.js'
import { ORES } from '../data/ores.js'
import { useGameStore } from '../store/useGameStore.js'
import { playPickup } from './sfx.js'

// Ore dropped by dug mine cubes. Each dug cube leaves one pickup (worth the
// blasting TNT's power in blocks) that hops out, settles on the pit floor and
// waits. The player collects it by walking over it; within the Collection
// Range stat it is pulled to the player instead. Uncollected pickups vanish
// when the mine refills (mineCubes.js clearPickups). Framework-free: the
// renderer is components/world/Pickups.jsx, which reads `pickups`.
export const PICKUP_SIZE = 0.45 // metres, drawn cube edge
const GRAB_RADIUS = 1.1 // walking this close collects it, whatever the range
const CHEST = 0.9 // metres above the feet the pickups fly to
const MAGNET_DELAY = 0.55 // s after spawning before the magnet can take it, so the burst is seen
const GRAVITY = 26
export const LIFETIME = 10 // s a pickup waits before it vanishes (not once the magnet has it)
export const FADE = 1 // s before that it shrinks away

export const pickups = [] // live pickups; the renderer iterates this

export function spawnPickup(x, y, z, ore, amount) {
  const a = Math.random() * Math.PI * 2
  const s = 1 + Math.random() * 2.5
  pickups.push({ x, y, z, vx: Math.cos(a) * s, vy: 4 + Math.random() * 4, vz: Math.sin(a) * s, ore, amount, age: 0, pull: 0, near: false, spin: Math.random() * 6 })
}

// fn(ore, amount) runs once per ORES index per frame in which pickups were collected.
const collectListeners = new Set()
export function onCollect(fn) {
  collectListeners.add(fn)
  return () => collectListeners.delete(fn)
}

export function clearPickups() {
  pickups.length = 0
}

// Call once per frame after the player moved. `floorAt(x, z)` is the mine floor
// height (null outside the mine).
export function stepPickups(dt, floorAt) {
  if (!pickups.length) return
  const { range } = useGameStore.getState()
  const px = player.position.x
  const py = player.position.y + CHEST
  const pz = player.position.z
  const got = {} // ORES item -> blocks collected
  const gotOre = {} // ORES index -> blocks collected
  let any = false
  for (let n = pickups.length - 1; n >= 0; n--) {
    const p = pickups[n]
    p.age += dt
    p.spin += dt * 2
    const dx = px - p.x
    const dy = py - p.y
    const dz = pz - p.z
    const dist = Math.hypot(dx, dy, dz)
    p.near = p.pull > 0 || Math.hypot(dx, dz) <= range // collectable now without walking over it
    if (p.age > MAGNET_DELAY && p.near) {
      // Flying to the player, faster the longer it has been pulled.
      p.pull += dt
      const v = Math.min(dist / Math.max(dt, 1e-3), 10 + p.pull * 40)
      p.x += (dx / (dist || 1)) * v * dt
      p.y += (dy / (dist || 1)) * v * dt
      p.z += (dz / (dist || 1)) * v * dt
    } else {
      p.vy -= GRAVITY * dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.z += p.vz * dt
      const f = floorAt(p.x, p.z)
      const rest = (f === null ? 0 : f) + PICKUP_SIZE / 2
      if (p.y < rest) {
        p.y = rest
        p.vy = Math.abs(p.vy) > 3 ? -p.vy * 0.35 : 0
        p.vx *= 0.6
        p.vz *= 0.6
      }
    }
    if (p.age > LIFETIME && !p.pull) {
      pickups[n] = pickups[pickups.length - 1]
      pickups.pop()
      continue
    }
    if (dist < GRAB_RADIUS && p.age > 0.25) {
      const item = ORES[p.ore].item
      got[item] = (got[item] || 0) + p.amount
      gotOre[p.ore] = (gotOre[p.ore] || 0) + p.amount
      any = true
      pickups[n] = pickups[pickups.length - 1]
      pickups.pop()
    }
  }
  if (any) {
    useGameStore.setState((s) => Object.fromEntries(Object.keys(got).map((k) => [k, s[k] + got[k]])))
    playPickup()
    for (const k in gotOre) for (const fn of collectListeners) fn(Number(k), gotOre[k])
  }
}
