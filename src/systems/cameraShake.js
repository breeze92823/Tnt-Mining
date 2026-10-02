import { player } from './playerState.js'

// Blast shockwave timing plus the camera shake it causes. The visual front in
// components/world/Blasts.jsx and the shake both use shockRadius(), so the
// camera jolts at the moment the wave it can see reaches the player.
//
// Each blast queues a wave. When its front passes the player the camera takes
// a sharp kick away from the blast (a damped spring) and gains "trauma" that
// drives a noisy rumble (amplitude = trauma^2) and decays over about a second.

// Front: fast at first, then slowing, reaching SHOCK_REACH * scale after
// SHOCK_LIFE seconds (starting speed is 3 * reach / life).
export const SHOCK_LIFE = 1.1
export const SHOCK_REACH = 22

// Wave size factor from TNT power: Classic (1) ~0.35 (reach ~8 m), Ice (1.5M)
// ~2.8 (reach ~60 m). Visuals and shake both derive from it.
export const shockScale = (power) => 0.35 + Math.log10(Math.max(1, power)) * 0.4
// 0 (Classic) .. 1 (Ice)
const powerFrac = (power) => Math.min(1, Math.log10(Math.max(1, power)) / 6.2)

export function shockRadius(t, scale) {
  const u = Math.min(1, t / SHOCK_LIFE)
  return SHOCK_REACH * scale * (1 - (1 - u) ** 3)
}

// Seconds after the blast at which the front reaches distance d. Past the
// visible reach the (now invisible) wave carries on at its final slow speed.
function arrival(d, scale) {
  const reach = SHOCK_REACH * scale
  if (d < reach) return SHOCK_LIFE * (1 - Math.cbrt(1 - d / reach))
  return SHOCK_LIFE + (d - reach) / (6 * scale)
}

const MAX_POS = 1.0 // metres of rumble at full trauma
const MAX_ROT = 0.13 // radians of rumble at full trauma
const FREQ = 18 // rumble speed
const DECAY = 1.0 // trauma lost per second
const KICK_STIFF = 160
const KICK_DAMP = 14

const waves = [] // { at, x, z, strength }
let trauma = 0
let time = 0
const kick = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0 }
// Last offset applied to the camera, removed again before the next update.
export const shakeOffset = { x: 0, y: 0, z: 0, pitch: 0, yaw: 0, roll: 0 }

// Called once per blast. Strength grows with TNT power (a Classic is a light
// jolt up close, an Ice nuke throws the camera around) and falls off with
// distance relative to the wave's reach, so big blasts are felt much further out.
export function addShockwave(x, z, power) {
  const scale = shockScale(power)
  const d = Math.hypot(x - player.position.x, z - player.position.z)
  const base = 0.35 + 0.65 * powerFrac(power) ** 0.6
  const strength = base / (1 + (d / (SHOCK_REACH * scale * 0.6)) ** 2)
  if (strength < 0.02) return
  waves.push({ at: time + arrival(d, scale), x, z, strength })
}

// Smooth 1D noise in -1..1 (sum of incommensurate sines, per-axis seed).
const wobble = (t, s) => (Math.sin(t * 1.0 + s) * 0.5 + Math.sin(t * 2.31 + s * 1.7) * 0.3 + Math.sin(t * 4.13 + s * 2.9) * 0.2)

export function step(dt) {
  time += dt
  for (let i = waves.length - 1; i >= 0; i--) {
    const w = waves[i]
    if (w.at > time) continue
    waves.splice(i, 1)
    trauma = Math.min(1, trauma + w.strength * 1.3)
    // shove away from the blast and slightly down, like the air hitting you
    const dx = player.position.x - w.x
    const dz = player.position.z - w.z
    const len = Math.hypot(dx, dz) || 1
    const imp = 16 * w.strength
    kick.vx += (dx / len) * imp
    kick.vz += (dz / len) * imp
    kick.vy -= imp * 0.6
  }

  // damped spring back to rest
  for (const a of ['x', 'y', 'z']) {
    const v = 'v' + a
    kick[v] += (-kick[a] * KICK_STIFF - kick[v] * KICK_DAMP) * dt
    kick[a] += kick[v] * dt
  }

  trauma = Math.max(0, trauma - DECAY * dt)
  const amp = trauma * trauma
  const t = time * FREQ
  shakeOffset.x = kick.x + wobble(t, 1.3) * MAX_POS * amp
  shakeOffset.y = kick.y + wobble(t, 7.1) * MAX_POS * amp
  shakeOffset.z = kick.z + wobble(t, 3.7) * MAX_POS * amp
  shakeOffset.pitch = wobble(t, 11.2) * MAX_ROT * amp
  shakeOffset.yaw = wobble(t, 5.9) * MAX_ROT * amp
  shakeOffset.roll = wobble(t, 9.4) * MAX_ROT * amp * 1.3
}
