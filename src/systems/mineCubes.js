import { HUB_WALL, MINE_CUBES, NORTH } from '../data/world.js'
import { player } from './playerState.js'
import { tntById } from '../data/tnts.js'
import { useGameStore } from '../store/useGameStore.js'

// The Forest Mine floor: a cols x rows grid of columns, each a stack of
// `layers` 2 m cubes. Removing a cube digs the top layer of its column (the
// floor drops 2 m); dug cubes stay gone until the player is back in the hub
// (south of the hub wall), then every column is restored at once. Framework-free: the
// renderer (world/MineGate.jsx) subscribes, terrainHeight.js reads mineFloorAt.
// A column is addressed by (col, row): col 0 is the west edge (x), row 0 the
// north edge (z).
const { size, cols, rows, layers, top } = MINE_CUBES
const { x0, z0 } = NORTH.mine

const placedKind = new Map() // index -> TNT type id it was placed as (data/tnts.js)
const placed = new Set() // indices holding a placed TNT block (one size x size x size cube on top)
const dug = new Uint8Array(cols * rows) // index -> layers dug out of the column (0..layers)
let anyDug = false // true while at least one column has a layer dug out
const listeners = new Set()
let version = 0

const indexOf = (col, row) => row * cols + col
const inGrid = (col, row) => col >= 0 && col < cols && row >= 0 && row < rows

function changed() {
  version++
  for (const fn of listeners) fn()
}

export const getVersion = () => version

export function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

// Grid cell under world (x, z), or null outside the mine.
export function cubeAt(x, z) {
  const col = Math.floor((x - x0) / size)
  const row = Math.floor((z - z0) / size)
  return inGrid(col, row) ? { col, row } : null
}

// Top of a column's remaining cubes (not counting a placed TNT block).
const surfaceY = (i) => top - dug[i] * size

// Centre of the top face of the column's remaining cubes in world space.
export function cubeCenter(col, row) {
  return { x: x0 + (col + 0.5) * size, y: surfaceY(indexOf(col, row)), z: z0 + (row + 0.5) * size }
}

// How many layers are dug out of this column (0 = untouched).
export function dugDepth(col, row) {
  return dug[indexOf(col, row)]
}

// True when the layer-th cube (0 = top) of the column is gone.
export function isRemoved(col, row, layer = 0) {
  return layer < dug[indexOf(col, row)]
}

export function hasTnt(col, row) {
  return placed.has(indexOf(col, row))
}

// All placed TNT blocks as indices, for the renderer (read after subscribe fires).
export function placedTnt() {
  return placed
}

export const tntKindAt = (i) => placedKind.get(i) || 'green'

// Puts a TNT block on top of a column's floor. Returns true if placed.
export function placeTnt(col, row, kind = 'green') {
  if (!inGrid(col, row) || hasTnt(col, row)) return false
  placed.add(indexOf(col, row))
  placedKind.set(indexOf(col, row), kind)
  changed()
  return true
}

// Digs the top remaining cube of the column (its TNT block goes with it).
// Returns false when out of the mine or already dug to the bottom.
function dig(i) {
  if (dug[i] >= layers) return false
  placed.delete(i)
  placedKind.delete(i)
  lit.delete(i)
  dug[i]++
  anyDug = true
  return true
}

export function removeCube(col, row) {
  if (!inGrid(col, row) || !dig(indexOf(col, row))) return false
  changed()
  return true
}

export function removeCubeAt(x, z) {
  const c = cubeAt(x, z)
  return c ? removeCube(c.col, c.row) : false
}

// Puts the deepest dug cube of the column back.
export function restoreCube(col, row) {
  const i = indexOf(col, row)
  if (!inGrid(col, row) || dug[i] === 0) return false
  dug[i]--
  changed()
  return true
}

// Floor height at (x, z) inside the mine (top of the column's remaining cubes);
// null outside it.
export function mineFloorAt(x, z) {
  const c = cubeAt(x, z)
  if (!c) return null
  const i = indexOf(c.col, c.row)
  return surfaceY(i) // placed TNT is not solid: the player walks through it
}

// Cubes whose centre is within PLACE_RANGE metres of the player's feet are
// near enough to place TNT on: the cube under the player and the eight around it (diagonals are 2.83 m at most).
const PLACE_RANGE = 3
// With no pointer aim, aim this far ahead of the feet along the facing.
const AIM_AHEAD = 2.2

const _preview = { col: 0, row: 0 } // reused result of previewCube — read it before the next call

// The intact cube a held-TNT placement preview sits on top of: among the
// columns within PLACE_RANGE of the player (the one the player stands on included, never one that
// already holds TNT), the one whose centre is closest to `aim` {x, z} — the world point
// under the mouse, so the cube pointed at wins when it is in reach, else the
// nearest one to it. Without `aim` it aims AIM_AHEAD along `facing`. Null
// when the player is outside the mine or nothing is in reach.
// `prefCol`/`prefRow` (the cube currently shown) get STICKY metres of head start, so the
// preview doesn't flicker between two cubes when the pointer sits near their border.
const STICKY = 0.45
export function previewCube(x, z, facing, aim, prefCol = -1, prefRow = -1) {
  const ownCol = Math.floor((x - x0) / size)
  const ownRow = Math.floor((z - z0) / size)
  if (!inGrid(ownCol, ownRow)) return null
  const ax = aim ? aim.x : x + Math.sin(facing) * AIM_AHEAD
  const az = aim ? aim.z : z + Math.cos(facing) * AIM_AHEAD
  const span = Math.ceil(PLACE_RANGE / size)
  const reach2 = PLACE_RANGE * PLACE_RANGE
  let found = false
  let bestD = Infinity
  for (let row = Math.max(0, ownRow - span); row <= Math.min(rows - 1, ownRow + span); row++) {
    const cz = z0 + (row + 0.5) * size
    for (let col = Math.max(0, ownCol - span); col <= Math.min(cols - 1, ownCol + span); col++) {
      if (placed.has(indexOf(col, row))) continue
      const cx = x0 + (col + 0.5) * size
      const dx = cx - x
      const dz = cz - z
      if (dx * dx + dz * dz > reach2) continue
      let d = Math.sqrt((cx - ax) * (cx - ax) + (cz - az) * (cz - az))
      if (col === prefCol && row === prefRow) d -= STICKY
      if (d < bestD) {
        bestD = d
        _preview.col = col
        _preview.row = row
        found = true
      }
    }
  }
  return found ? _preview : null
}

// --- Lit TNT: igniting starts a FUSE_MS fuse; at zero the block blasts, taking
// the top layer of every column within the TNT's blast radius (and any TNT among
// them, which goes off with it).
export const FUSE_MS = 5000
// Bigger-power TNT reaches further and deeper: radius 1 for power < 10, +1 per power of ten, max 6.
const blastRadius = (power) => Math.min(6, 1 + Math.floor(Math.log10(power)))
// Depth in layers follows the same steps (max `layers`, the mine's full depth).
const blastDepth = (power) => Math.min(layers, 1 + Math.floor(Math.log10(power)))
const lit = new Map() // index -> performance.now() when it blasts
const blastListeners = new Set()

// Index -> blast time of every lit TNT, for the renderer.
export function litTnt() {
  return lit
}

export function isLit(col, row) {
  return lit.has(indexOf(col, row))
}

// Lights the TNT on a cube. Returns true if a fuse was started.
export function igniteTnt(col, row) {
  const i = indexOf(col, row)
  if (!inGrid(col, row) || !placed.has(i) || lit.has(i)) return false
  lit.set(i, performance.now() + FUSE_MS)
  changed()
  return true
}

// fn({ x, y, z }) runs for every blast, at the centre of the TNT block.
export function onBlast(fn) {
  blastListeners.add(fn)
  return () => blastListeners.delete(fn)
}

// Cubes dug within the player's Collection Range land in the inventory as dirt,
// one per cube times the power of the TNT that blasted it.
function detonate(startIndex) {
  const { range } = useGameStore.getState()
  let mined = 0
  const queue = [startIndex]
  const done = new Set(queue)
  while (queue.length) {
    const i = queue.pop()
    const col = i % cols
    const row = Math.floor(i / cols)
    const c = cubeCenter(col, row)
    const blastX = c.x
    const blastZ = c.z
    const power = tntById(tntKindAt(i)).blast
    const radius = blastRadius(power)
    const depth = blastDepth(power)
    placed.delete(i)
    placedKind.delete(i)
    lit.delete(i)
    for (const fn of blastListeners) fn({ x: c.x, y: c.y + size / 2, z: c.z })
    for (let dr = -radius; dr <= radius; dr++) {
      for (let dc = -radius; dc <= radius; dc++) {
        const cc = col + dc
        const rr = row + dr
        if (!inGrid(cc, rr)) continue
        const j = indexOf(cc, rr)
        if (placed.has(j) && !done.has(j)) {
          done.add(j)
          queue.push(j)
        }
        const inRange = Math.hypot(blastX - player.position.x, blastZ - player.position.z) <= range
        for (let d = 0; d < depth && dig(j); d++) if (inRange) mined += power
      }
    }
  }
  if (mined) useGameStore.setState((s) => ({ dirt: s.dirt + mined }))
  changed()
}

// Puts every dug cube back.
function restoreAll() {
  dug.fill(0)
  anyDug = false
  useGameStore.setState((s) => ({ tnt: Math.max(s.tnt, s.carryMax) })) // restock on return to the hub
  changed()
}

// Call once per frame: blasts TNT whose fuse ran out, and refills the mine once
// the player is back in the hub.
export function step() {
  if (!anyDug && lit.size === 0) return
  const now = performance.now()
  for (const [i, at] of lit) {
    if (at <= now && lit.has(i)) detonate(i)
  }
  if (anyDug && lit.size === 0 && player.position.z > HUB_WALL.z1) restoreAll()
}

if (import.meta.env.DEV) window.__mine = { removeCube, removeCubeAt, restoreCube, cubeAt }
