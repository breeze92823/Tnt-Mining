import { tileMaterial } from './tile.js'
import { COLORS } from '../data/world.js'

// Shared studded materials for the hub. All world-space (tile.js), so boxes
// of any size can share one material without UV work.
const studded = (top, side, extra = {}) =>
  tileMaterial({ top, side: side ?? top, studs: 1, studAmt: 1, speckle: 0.6, roughness: 0.85, ...extra })

export const MAT = {
  grass: studded(COLORS.grass, COLORS.wall, { side2: COLORS.wall2, mottle: 0.12, mottleScale: 6, studAmt: 0.55 }),
  wall: studded(COLORS.wallTop, COLORS.wall, { side2: COLORS.wall2, mottle: 0.1, mottleScale: 4 }),
  wallCap: studded(COLORS.wallTop, COLORS.grassDark),
  floor: studded(COLORS.floor, COLORS.floor2),
  floorDark: studded('#7a85a8', '#6c7698'),
  path: tileMaterial({ top: COLORS.path, top2: '#cfd4aa', side: COLORS.pathEdge, checker: 1, grout: '#b9bf98', speckle: 0.8, roughness: 0.9 }),
  pathEdge: studded(COLORS.pathEdge, '#8a9396'),
  plaza: tileMaterial({ top: COLORS.plaza, top2: '#dcd2a2', side: COLORS.plazaRim, checker: 1.2, grout: '#bfb588', speckle: 0.8, roughness: 0.9 }),
  plazaRim: studded(COLORS.plazaRim, '#87929a', { studAmt: 0.7 }),
  brick: studded(COLORS.orange, '#e0742c', { studAmt: 0.8 }),
  wood: studded('#b8763c', '#a9692f', { studAmt: 0.6 }),
  trunk: studded(COLORS.trunk, '#5e3519', { studAmt: 0.5 }),
  leaf: studded(COLORS.leaf2, COLORS.leaf, { mottle: 0.2, mottleScale: 1.5 }),
  gold: studded(COLORS.gold, '#d9a71c'),
  carpet: studded(COLORS.carpet, '#a40c25', { studAmt: 0.5 }),
  dark: studded('#2e2f36', '#25262c', { studAmt: 0.6 }),
  black: studded('#141418', '#101014', { studAmt: 0.4 }),
  metal: studded('#a3a9b3', '#8d939d', { studAmt: 0.5 }),
  white: studded('#f4f4f4', '#e6e6e6', { studAmt: 0.6 }),
  red: studded('#e01b24', '#b9141b'),
  lime: studded('#7ee81e', '#62c214'),
  yellow: studded('#ffd400', '#e0b800'),
  blue: studded('#3c8ae6', '#2f74c8'),
}

// Plain studded colour, cached by tile.js.
export const solid = (color, side) => studded(color, side ?? color)
