// Blast-power gain popups: a framework-free, mutable singleton pool stepped once
// per frame from GameLoop. spawnActionPopup(amount) is called with each left-click
// gain; components/hud/ActionPopups.jsx reads the pool each frame and draws it.
// Ported from Laser-Escape's systems/actionPopups.js; the player's screen anchor
// comes from playerState's `playerScreen` (already projected by GameLoop).
import { playerScreen } from './playerState.js'
import { playPowerGainPop } from './sfx.js'
import {
  ACTION_POPUP_POOL_SIZE,
  ACTION_POPUP_LIFETIME,
  ACTION_POPUP_SPREAD_X,
  ACTION_POPUP_SPREAD_Y,
} from '../data/actionPopups.js'

function makeSlot() {
  // ndcX/ndcY: viewport position frozen at spawn (-1..1, x right / y up).
  // seq: bumped on every (re)spawn so the view refreshes the "+N" label once.
  return { alive: false, age: 0, amount: 0, ndcX: 0, ndcY: 0, seq: 0 }
}

// Fixed pool allocated once; spawning recycles the oldest slot.
export const actionPopupPool = []
for (let i = 0; i < ACTION_POPUP_POOL_SIZE; i++) actionPopupPool.push(makeSlot())

let nextSlot = 0
let spawnSeq = 0

export function spawnActionPopup(amount) {
  if (!(amount > 0)) return
  playPowerGainPop()
  const slot = actionPopupPool[nextSlot]
  nextSlot = (nextSlot + 1) % ACTION_POPUP_POOL_SIZE
  spawnSeq += 1

  slot.alive = true
  slot.age = 0
  slot.amount = amount
  slot.ndcX = playerScreen.x * 2 - 1 + (Math.random() * 2 - 1) * ACTION_POPUP_SPREAD_X
  slot.ndcY = 1 - playerScreen.y * 2 + (Math.random() * 2 - 1) * ACTION_POPUP_SPREAD_Y
  slot.seq = spawnSeq
}

export function step(dt) {
  for (let i = 0; i < ACTION_POPUP_POOL_SIZE; i++) {
    const slot = actionPopupPool[i]
    if (!slot.alive) continue
    slot.age += dt
    if (slot.age >= ACTION_POPUP_LIFETIME) slot.alive = false
  }
}
