import { create } from 'zustand'

// Lightweight, infrequently-changing game state for the HUD. Per-frame state
// (the player) lives in systems/playerState.js instead.
export const useGameStore = create(() => ({
  avatarLoaded: false, // player character (incl. Bloxity accessories) finished loading; gates the loading screen
  level: 5,
  xp: 47,
  xpMax: 49,
  explosions: 145,
  money: 320,
  shells: 0,
  rebirths: 0,
  gems: 2,
  rebirthProgress: 33, // % toward the next rebirth
  enchanted: [15, 15],
  friendBoost: 0,
  tnt: 5, // Green TNT in the inventory (hotbar slot 0)
  slot: 0, // selected hotbar slot, or null when nothing is held
  panel: null, // open HUD panel id, or null
}))

export const openPanel = (panel) => useGameStore.setState((s) => ({ panel: s.panel === panel ? null : panel }))
export const closePanel = () => useGameStore.setState({ panel: null })
// Selecting the selected slot again deselects it (slot null = hands free).
export const selectSlot = (slot) => useGameStore.setState((s) => ({ slot: s.slot === slot ? null : slot }))
