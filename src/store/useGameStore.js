import { create } from 'zustand'
import { tntById } from '../data/tnts.js'
import { TUTORIAL_DONE_STEP } from '../data/tutorial.js'

// VITE_CARRY_MAX in .env sets how much TNT the player can hold at the start (defaults to 5).
const CARRY_MAX = Math.max(1, Math.floor(Number(import.meta.env.VITE_CARRY_MAX)) || 5)

// VITE_START_DAMAGE in .env sets the player's damage at the start (defaults to 1).
const START_DAMAGE = Number(import.meta.env.VITE_START_DAMAGE) || 1

const START_CLICK_POWER = 4

// Lightweight, infrequently-changing game state for the HUD. Per-frame state
// (the player) lives in systems/playerState.js instead.
export const useGameStore = create(() => ({
  avatarLoaded: false, // player character (incl. Bloxity accessories) finished loading; gates the loading screen
  money: Number(import.meta.env.VITE_START_CASH) || 0, // VITE_START_CASH in .env overrides the starting cash
  damage: START_DAMAGE, // damage stat (Panels "More Damage"; rebirth multiplies it)
  shells: 0,
  rebirths: 1, // starts at Rebirth 1
  gems: 2,
  enchanted: [15, 15],
  friendBoost: 0,
  tnt: CARRY_MAX, // Equipped TNT in the inventory (hotbar slot 0)
  carryMax: CARRY_MAX, // most TNT the inventory holds (Upgrades: Carried TNT)
  placeMax: 1, // TNT blocks that can be placed at once (Upgrades: Placed TNT)
  range: 3, // collection range in metres: ore within it is pulled to the player (Upgrades: Collection Range)
  speed: 22, // movement speed stat (Upgrades: Speed)
  tntOwned: ['classic'], // TNT types bought (TNTs panel)
  tntEquipped: 'classic',
  dirt: 0, // Dirt in the inventory (hotbar slot 2), sold in the Sell panel
  stone: 0, // mined blocks by data/ores.js `item`, sold in the Sell panel
  coal: 0,
  gold: 0,
  diamond: 0,
  bedrock: 0,
  clickPower: START_CLICK_POWER, // grows with every left click (addClickPower); blastPower = equipped TNT blast + this
  slot: 0, // selected hotbar slot, or null when nothing is held
  panel: null, // open HUD panel id, or null
  tutorialStep: 0, // 0 go to the mine, 1 place TNT, 2 light it, 3 collect, 4 go to SELL, 5 sell, 6 buy TNT, 7 done (data/tutorial.js)
  // Whether we know if this player already has a save (systems/net.js): true once the server's
  // `progress`/`noProgress` reply arrives, or once there is nothing to wait for (guest, no server,
  // timeout). The tutorial stays hidden until then, so a returning player never sees it flash at step 0.
  progressKnown: false,
  // True when the loaded save had already finished the tutorial, so it is never replayed.
  tutorialResumedDone: false,
}))

export const setProgressKnown = () => useGameStore.setState((s) => (s.progressKnown ? s : { progressKnown: true }))

// Extra blastPower needed to pass level n = floor(15 * 1.35^(n-1)): 15, 20, 27, 36, 49, 67, 90, 122, 165, ...
// The costs add up: level 2 at 15 total, level 3 at 35, level 4 at 62, ...
const powerToPass = (level) => Math.floor(15 * 1.35 ** (level - 1))
export function levelFor(power) {
  let level = 1
  let left = power
  while (left >= powerToPass(level)) {
    left -= powerToPass(level)
    level += 1
  }
  return { level, xp: left, need: powerToPass(level) }
}

// Blast power (equipped TNT's blast + click-grown clickPower): the HUD boom number, the level bar,
// the dig size and the "Most Damage" leaderboard stat all read this one definition.
export const blastPower = (s) => tntById(s.tntEquipped).blast + s.clickPower
// Player level from the equipped TNT's blast + clickPower (shown in the HUD level bar).
export const playerLevel = (s) => levelFor(blastPower(s)).level
// Level needed to leave rebirth `n`: 15, 30, 60, 120 ... (doubles each time).
export const rebirthLevelFor = (n) => 15 * 2 ** (n - 1)
// Rebirth bonuses: x1 at Rebirth 1, then +0.5x damage and +0.2x money per further rebirth.
export const damageMult = (rebirths) => 1 + 0.5 * (rebirths - 1)
export const moneyMult = (rebirths) => 1 + 0.2 * (rebirths - 1)
// A left click adds the equipped TNT's power x the rebirth damage multiplier to clickPower; fractions round up.
// `mult` is an extra factor (a Training target's 1.5x, 3x ...). Returns the amount gained.
export function addClickPower(tntBlast, mult = 1) {
  const gain = Math.ceil(tntBlast * damageMult(useGameStore.getState().rebirths) * mult)
  useGameStore.setState((s) => ({ clickPower: s.clickPower + gain }))
  return gain
}

// Rebirth (needs the required level): +1 rebirth; click power (so level) and damage reset.
export function doRebirth() {
  const s = useGameStore.getState()
  if (playerLevel(s) < rebirthLevelFor(s.rebirths)) return false
  useGameStore.setState({ rebirths: s.rebirths + 1, clickPower: START_CLICK_POWER, damage: START_DAMAGE })
  return true
}
export const openPanel = (panel) => useGameStore.setState((s) => ({ panel: s.panel === panel ? null : panel }))
export const closePanel = () => useGameStore.setState({ panel: null })
// Buys one level of an upgrade (a store key) for `price`; false if too poor.
export function buyUpgrade(key, price) {
  if (useGameStore.getState().money < price) return false
  // More carry capacity comes with the extra TNT filled in.
  useGameStore.setState((s) => ({ money: s.money - price, [key]: s[key] + 1, ...(key === 'carryMax' && { tnt: s.tnt + 1 }) }))
  return true
}
// Buys a damage pack: `power` blastPower (added to clickPower) for `price` cash; false if too poor.
export function buyDamage(power, price) {
  if (useGameStore.getState().money < price) return false
  useGameStore.setState((s) => ({ money: s.money - price, clickPower: s.clickPower + power }))
  return true
}
// Equipping restocks the carried TNT of that type.
export const equipTnt = (id) => useGameStore.setState((s) => (s.tntOwned.includes(id) ? { tntEquipped: id, tnt: Math.max(s.tnt, s.carryMax) } : s))
// Buys a TNT type with money or gems (`gem`); false if too poor.
export function buyTnt(id, price, gem) {
  const cur = gem ? 'gems' : 'money'
  const s = useGameStore.getState()
  if (s.tntOwned.includes(id) || s[cur] < price) return false
  useGameStore.setState({ [cur]: s[cur] - price, tntOwned: [...s.tntOwned, id], tntEquipped: id, tnt: s.carryMax })
  return true
}
// Sells every block of the given { stock, price } items (stock = store count key); pays x the rebirth money bonus.
export function sellBlocks(items) {
  useGameStore.setState((s) => {
    const next = { money: s.money }
    for (const { stock, price } of items) { next.money += Math.round(s[stock] * price * moneyMult(s.rebirths)); next[stock] = 0 }
    return next
  })
}
// Selecting the selected slot again deselects it (slot null = hands free).
export const selectSlot = (slot) => useGameStore.setState((s) => ({ slot: s.slot === slot ? null : slot }))

// --- Server persistence (systems/net.js) -------------------------------------
// The blocks held, keyed by data/ores.js `item`; also the backend's ORE_ITEMS.
const ORE_ITEMS = ['dirt', 'stone', 'coal', 'gold', 'diamond', 'bedrock']
const SAVED_NUMBERS = ['money', 'gems', 'shells', 'rebirths', 'clickPower', 'tnt', 'carryMax', 'placeMax', 'range', 'speed']


// Everything the backend saves for a signed-in player (the backend sanitizes it).
export function progressSnapshot() {
  const s = useGameStore.getState()
  const out = { damage: blastPower(s), tntOwned: s.tntOwned, tntEquipped: s.tntEquipped, tutorialStep: s.tutorialStep, ores: {} }
  for (const k of SAVED_NUMBERS) out[k] = s[k]
  for (const k of ORE_ITEMS) out.ores[k] = s[k]
  return out
}

// Applies a saved doc from the backend (`progress` message), ignoring anything malformed.
export function hydrateProgress(d) {
  const s = useGameStore.getState()
  const next = { progressKnown: true }
  // A doc made only by the server's playtime flush has no save in it yet: keep the local values.
  if (Array.isArray(d?.tntOwned) && d.tntOwned.length) {
    for (const k of SAVED_NUMBERS) if (Number.isFinite(d?.[k])) next[k] = d[k]
    next.tntOwned = d.tntOwned
    next.tntEquipped = d.tntOwned.includes(d.tntEquipped) ? d.tntEquipped : d.tntOwned[0]
    for (const k of ORE_ITEMS) if (Number.isFinite(d?.ores?.[k])) next[k] = d.ores[k]
  }
  // The step only ever moves forward.
  const saved = Number.isFinite(d?.tutorialStep) ? Math.min(TUTORIAL_DONE_STEP, Math.max(0, Math.floor(d.tutorialStep))) : 0
  next.tutorialStep = Math.max(s.tutorialStep, saved)
  next.tutorialResumedDone = s.tutorialResumedDone || (next.tutorialStep >= TUTORIAL_DONE_STEP && s.tutorialStep < TUTORIAL_DONE_STEP)
  useGameStore.setState(next)
}
