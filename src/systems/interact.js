// "Hold E to ..." interaction (ported from Laser-Escape's systems/interact.js,
// made generic: zones register themselves instead of being hard-coded). See
// Interact.md for the full picture and usage recipes.
//
// A zone says "when the player is here, show this prompt; if E is held for
// holdMs, run this". Each frame step() asks the zones (lowest `priority`
// first) for the first one that reports the player in range, drives the shared
// hold gate (systems/interactHold.js) against it, and fires its onConfirm()
// once when the hold completes. components/hud/InteractPrompt.jsx polls
// interactState + interactHoldState to draw the prompt and fill ring.
//
// Framework-free: onConfirm runs outside React. To open a panel, call
// openPanel() from the store; to report a blocked action, call
// showActionResult(text, false) (systems/actionResult.js).
import { isInteractKeyDown } from './input.js'
import { player } from './playerState.js'
import { useGameStore } from '../store/useGameStore.js'
import { step as stepHold } from './interactHold.js'
import { playConfirmPop } from './sfx.js'
import { DEFAULT_RANGE } from '../data/interact.js'

// What the HUD reads (polled ~10Hz, never per frame).
export const interactState = {
  zoneId: null, // id of the zone currently offered, or null
  label: null, // prompt text for it ("Open Shop" -> "Press E to Open Shop")
}

const zones = []
let latched = false // true from a confirm until E is released

// zone: {
//   id,                       unique string
//   priority = 0,             lower wins when several zones are in range
//   holdMs,                   optional per-zone hold time (default HOLD_MS; 0 = instant)
//   confirmSound = true,      false to skip the confirm pop (e.g. you play your own)
//   check(player) -> null | { label, key? },
//       null when out of range / not offered. `key` distinguishes sub-targets
//       of one zone (e.g. which of several pads) so walking between them
//       resets the hold.
//   onConfirm(hit),           runs once when the hold completes; hit is check()'s result
// }
// Returns an unregister function (call it from a React effect's cleanup).
export function registerInteractZone(zone) {
  const z = { priority: 0, confirmSound: true, ...zone }
  zones.push(z)
  zones.sort((a, b) => a.priority - b.priority)
  return () => {
    const i = zones.indexOf(z)
    if (i >= 0) zones.splice(i, 1)
  }
}

// Convenience zone for the common case: one or more world positions, a radius,
// a label. `position` is [x,y,z] or an array of them (the nearest in range wins
// and becomes the hold key). `label` may be a string or a function(hit) so it
// can depend on game state. `enabled` (optional) hides the zone when false.
export function proximityZone({ position, range = DEFAULT_RANGE, label, enabled, ...rest }) {
  const points = Array.isArray(position[0]) ? position : [position]
  return registerInteractZone({
    ...rest,
    check(p) {
      if (enabled && !enabled()) return null
      let best = -1
      let bestSq = range * range
      for (let i = 0; i < points.length; i++) {
        const dx = p.position.x - points[i][0]
        const dy = p.position.y - points[i][1]
        const dz = p.position.z - points[i][2]
        const sq = dx * dx + dy * dy + dz * dz
        if (sq <= bestSq) {
          bestSq = sq
          best = i
        }
      }
      if (best < 0) return null
      const hit = { key: String(best), index: best }
      hit.label = typeof label === 'function' ? label(hit) : label
      return hit.label ? hit : null
    },
  })
}

export function step() {
  let zone = null
  let hit = null
  // A modal panel is open: nothing is interactable and any hold is dropped.
  if (useGameStore.getState().panel === null) {
    for (const z of zones) {
      hit = z.check(player)
      if (hit) {
        zone = z
        break
      }
    }
  }

  interactState.zoneId = zone ? zone.id : null
  interactState.label = zone ? hit.label : null

  // After a confirm, E must be released before another hold can start —
  // otherwise keeping it down would re-fire the action every holdMs.
  const down = isInteractKeyDown()
  if (!down) latched = false
  const zoneKey = zone && !latched ? `${zone.id}:${hit.key ?? ''}` : null
  const confirmed = stepHold(zoneKey, down, zone ? zone.holdMs : undefined)
  if (!confirmed) return

  latched = true
  if (zone.confirmSound) playConfirmPop()
  zone.onConfirm?.(hit)
}
