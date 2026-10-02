import { create } from 'zustand'

// Lightweight, infrequently-changing game state for the HUD. Per-frame state
// (the player) lives in systems/playerState.js instead.
export const useGameStore = create(() => ({
  avatarLoaded: false, // player character (incl. Bloxity accessories) finished loading; gates the loading screen
  level: 5,
  xp: 47,
  xpMax: 49,
  explosions: 145,
  money: Number(import.meta.env.VITE_START_CASH) || 320, // VITE_START_CASH in .env overrides the starting cash
  shells: 0,
  rebirths: 0,
  gems: 2,
  rebirthProgress: 33, // % toward the next rebirth
  enchanted: [15, 15],
  friendBoost: 0,
  tnt: 5, // Green TNT in the inventory (hotbar slot 0)
  carryMax: 5, // most TNT the inventory holds (Upgrades: Carried TNT)
  placeMax: 1, // TNT blocks that can be placed at once (Upgrades: Placed TNT)
  range: 12, // collection range (Upgrades: Collection Range)
  speed: 22, // movement speed stat (Upgrades: Speed)
  tntOwned: ['classic', 'green'], // TNT types bought (TNTs panel)
  tntEquipped: 'green',
  dirt: 0, // Dirt in the inventory (hotbar slot 2), sold in the Sell panel
  slot: 0, // selected hotbar slot, or null when nothing is held
  panel: null, // open HUD panel id, or null
}))

export const openPanel = (panel) => useGameStore.setState((s) => ({ panel: s.panel === panel ? null : panel }))
export const closePanel = () => useGameStore.setState({ panel: null })
// Buys one level of an upgrade (a store key) for `price`; false if too poor.
export function buyUpgrade(key, price) {
  if (useGameStore.getState().money < price) return false
  // More carry capacity comes with the extra TNT filled in.
  useGameStore.setState((s) => ({ money: s.money - price, [key]: s[key] + 1, ...(key === 'carryMax' && { tnt: s.tnt + 1 }) }))
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
// Sells every block of the given { stock, price } items (stock = store count key).
export function sellBlocks(items) {
  useGameStore.setState((s) => {
    const next = { money: s.money }
    for (const { stock, price } of items) { next.money += s[stock] * price; next[stock] = 0 }
    return next
  })
}
// Selecting the selected slot again deselects it (slot null = hands free).
export const selectSlot = (slot) => useGameStore.setState((s) => ({ slot: s.slot === slot ? null : slot }))
