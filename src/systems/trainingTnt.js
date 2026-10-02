import { emitBlast } from './mineCubes.js'
import { tntById } from '../data/tnts.js'

// Training targets: each auto-train tick puts the equipped TNT on top of the
// target; after a short fuse it blasts (effects only, nothing is dug or hurt).
export const TRAIN_FUSE_MS = 700
// Training blasts are a fifth the size of a mine blast, with no shockwave, camera shake or debris.
const TRAIN_BLAST_SCALE = 0.2
const active = new Map() // id -> { id, kind, x, y, z, at }
const listeners = new Set()
let nextId = 1
let version = 0

const changed = () => {
  version++
  for (const fn of listeners) fn()
}
export const subscribe = (fn) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
export const getVersion = () => version
export const trainingTnt = () => active

// x, y, z = top-centre of the target block; the TNT cube stands on it.
export function placeTrainingTnt(kind, x, y, z) {
  const id = nextId++
  active.set(id, { id, kind, x, y, z, at: performance.now() + TRAIN_FUSE_MS })
  changed()
}

// Call once per frame: blasts TNT whose fuse ran out.
export function stepTrainingTnt() {
  if (!active.size) return
  const now = performance.now()
  for (const t of active.values()) {
    if (t.at > now) continue
    active.delete(t.id)
    emitBlast(t.x, t.y + 0.5, t.z, tntById(t.kind).blast, { scale: TRAIN_BLAST_SCALE, shock: false, debris: false })
    changed()
  }
}
