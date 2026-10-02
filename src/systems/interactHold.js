// Shared "hold E to confirm" gate. One timer no matter which zone is near,
// since only one prompt is ever visible at once. Stepped once per frame from
// systems/interact.js; polled by components/hud/InteractPrompt.jsx at ~10Hz to
// draw the fill ring.
import { HOLD_MS } from '../data/interact.js'

export const interactHoldState = {
  active: false, // a hold is in progress against some zone this frame
  progress: 0, // 0..1 toward the zone's hold time
}

let ownerKey = null
let startedAt = 0

function reset() {
  ownerKey = null
  startedAt = 0
  interactHoldState.active = false
  interactHoldState.progress = 0
}

// zoneKey identifies the interactable currently in range, or null when nothing
// eligible is near this frame. keyDown is whether the interact key is held
// right now (systems/input.js isInteractKeyDown()). Returns true on the exact
// frame a continuous hold against the SAME zoneKey reaches holdMs — the
// caller's cue to fire that zone's action, once. Releasing the key, or the
// zoneKey changing mid-hold, resets the timer to zero.
export function step(zoneKey, keyDown, holdMs = HOLD_MS) {
  if (!zoneKey || !keyDown) {
    reset()
    return false
  }
  if (ownerKey !== zoneKey) {
    ownerKey = zoneKey
    startedAt = performance.now()
  }
  const elapsed = performance.now() - startedAt
  if (elapsed >= holdMs) {
    reset()
    return true
  }
  interactHoldState.active = true
  interactHoldState.progress = holdMs > 0 ? Math.min(1, elapsed / holdMs) : 1
  return false
}
