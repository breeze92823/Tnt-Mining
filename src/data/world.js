// World layout in metres (+X east, +Z south, +Y up). The lobby hub: a round
// plaza at the origin, a cross of paths out to four zones, grass quadrants
// with a shop stall each, and a raised blue-grey floor ringed by terraced
// orange walls.
//
//   north (-Z)  Forest Mine gate
//   west  (-X)  Training ground
//   east  (+X)  Leaderboards
//   south (+Z)  Premium TNT pedestals
//
// Every mesh that the player can stand on or bump into is mirrored by an
// entry in COLLIDERS, which systems/terrainHeight.js reads.
export const GROUND_Y = 0
export const GROUND = { size: 98, depth: 6 } // square slab edge length, thickness
export const GROUT = 0.05 // tile material grout width

export const SPAWN = { x: 0, y: 0.3, z: 2 }
export const SPAWN_FACING = Math.PI // face -Z (camera starts behind, on +Z)

export const PLAYER_MOVE_SPEED = 10

// --- hub ---------------------------------------------------------------
export const PLAZA = { radius: 8.5, rim: 9.4, top: 0.3, rimTop: 0.16 }
export const GRASS_HALF = 21 // the grass square, ±21 m
export const PATH = { width: 8, top: 0.06 }
export const FLOOR_TOP = 0.4 // raised blue-grey outer floor
export const WALL = { inner: 40, height: 7, outerHeight: 13, thick: 4 }

export const COLORS = {
  grass: '#46c41f',
  grassDark: '#3aa819',
  path: '#d4d9b0',
  pathEdge: '#9aa3a6',
  plaza: '#e2d9ab',
  plazaRim: '#97a1a6',
  floor: '#8e98bd',
  floor2: '#7f89ad',
  wall: '#e2762d',
  wall2: '#d36a26',
  wallTop: '#43c51d',
  trunk: '#6b3f1f',
  leaf: '#2fae1c',
  leaf2: '#45c92a',
  orange: '#e8823a',
  gold: '#f2c230',
  carpet: '#c8102e',
}

// Shop stalls in the grass quadrants, turned to face the plaza.
export const STALLS = [
  { id: 'tnt', label: 'TNT', icon: 'tnt', x: -12, z: -12, stripes: ['#e8262b', '#ffffff'], prompt: 'Buy TNT', panel: 'tnts' },
  { id: 'sell', label: 'SELL', icon: 'cash', x: 12, z: -12, stripes: ['#2fd13b', '#ffffff'], prompt: 'Sell Blocks', panel: 'sell' },
  { id: 'shop', label: 'SHOP', icon: 'basket', x: 12, z: 12, stripes: ['#ffd21f', '#ffffff'], prompt: 'Open Shop', panel: 'shop' },
  { id: 'upgrade', label: 'UPGRADE', icon: 'upgrade', x: -12, z: 12, stripes: ['#f4ecd0', '#ffffff'], prompt: 'Upgrades', panel: 'upgrades' },
]
export const STALL_RADIUS = 3.9
export const STALL_SCALE = 1.3

// Premium TNT on pedestals along the south edge.
export const PEDESTALS = [
  { id: 'corrupt', name: 'Corrupt TNT', tagline: 'Big Explosion!', price: 2e9, color: '#ffd400', nameColor: '#ffd23a', x: 10, z: 27 },
  { id: 'admin', name: 'Admin TNT', tagline: 'Massive Explosion!', price: 500e6, color: '#e01b24', nameColor: '#ff3b3b', x: 0, z: 30 },
  { id: 'atomic', name: 'Atomic TNT', tagline: 'Huge Explosion!', price: 3e9, color: '#7ee81e', nameColor: '#5bff2a', x: -10, z: 27 },
]
export const ADMIN_STAGE = { x: 0, z: 30, w: 9, d: 6.5, top: 1.0 }

export const TARGET_TILE = { size: 3.4, h: 0.12 } // coloured floor tile under each target
export const TARGET_BLOCK = 2.4 // target cube edge

// Training ground: a low stage across the back (gold strip in the middle, in
// line with the path) holding the pricier targets, and a front row at floor
// level either side of the path with the unlocked starter target. Each target
// is a block on a coloured floor tile (`pad`). Order is south (+Z) to north.
export const TRAINING_STAGE = { x0: -37, x1: -30, z0: -19, z1: 19, top: 1.0, strip: 4 }
export const TARGET_ROWS = { front: -26, back: -33.5 }
export const TARGETS = [
  // front row, on the floor
  { block: 'stone', mult: '1.5x', cost: 2, currency: 'rebirth', row: 'front', z: 13.5, pad: '#6f7480' },
  { block: 'wood', mult: '1x', cost: 0, currency: 'rebirth', row: 'front', z: 6.5, pad: '#8b5a2b' },
  { block: 'snow', mult: '3x', cost: 3, currency: 'rebirth', row: 'front', z: -6.5, pad: '#5fb4ef' },
  { block: 'emerald', mult: '5x', cost: 5, currency: 'rebirth', row: 'front', z: -13.5, pad: '#f08a2a' },
  // back row, on the stage
  { block: 'sand', mult: '7x', cost: 7, currency: 'rebirth', row: 'back', z: 14, pad: '#e8b923' },
  { block: 'amethyst', mult: '10x', cost: 9, currency: 'rebirth', row: 'back', z: 7, pad: '#8e4fd6' },
  { block: 'crystal', mult: '50x', cost: 20, currency: 'rebirth', row: 'back', z: 0, pad: '#c8202e' },
  { block: 'lava', mult: '25x', cost: 15, currency: 'rebirth', row: 'back', z: -7, pad: '#2e2f36' },
  { block: 'ruby', mult: '10x', cost: 9, currency: 'rebirth', row: 'back', z: -14, pad: '#c8202e' },
].map((t) => {
  const floor = t.row === 'back' ? TRAINING_STAGE.top : FLOOR_TOP
  return { ...t, x: TARGET_ROWS[t.row], floor, top: floor + TARGET_TILE.h + TARGET_BLOCK }
})

// Leaderboards stage on the east side.
export const LB_STAGE = { x0: 29, x1: 40, z0: -13, z1: 13, step: 0.8, top: 1.2 }
export const LB_BOARD_X = 38
export const LB_BOARDS = [
  { id: 'damage', title: 'Most Damage', icon: 'burst', z: -8.5 },
  { id: 'rebirths', title: 'Most Rebirths', icon: 'rebirth', z: 0 },
  { id: 'money', title: 'Most Money', icon: 'cash', z: 8.5 },
]

// North zone: a checkered start line where the hub ends, a bright-green field,
// then a wooden fence with the "Mine" arch opening onto the orange Forest Mine
// floor. The north wall sits behind it all, carrying the black "Forest" sign.
export const NORTH = {
  checkerZ: -27, // south edge of the 2 m checkered line (runs to -29)
  fenceZ: -42, // fence line with the Mine arch
  mine: { x0: -26, x1: 26, z0: -68, z1: -42 }, // orange mine floor, fenced
  wallZ: -76, // inner face of the north wall
  grass: '#0fcf3a',
}
// Dividing wall between the hub and the north zone, just past the Start Line,
// spanning wall to wall (x ±WALL.inner) with a narrow gate in the middle.
export const HUB_WALL = { z0: -33, z1: -29, halfGap: 5, height: 9 }
export const GATE = { z: NORTH.fenceZ, halfW: 3.6, height: 8.4 } // the Mine arch (pillar centres at ±halfW)
// Hung flat on the north wall's inner face, clear of the wall cap's overhang.
export const FOREST_SIGN = { z: NORTH.wallZ + 0.4, w: 11, y0: 6.8, y1: 13.6, price: '$12M' }
// Signboards fanned out in front of the fence, angled toward the plaza.
export const INFO_BOARDS = [
  { id: 'damage', x: -14, z: -37.6, rot: 0.42 },
  { id: 'secret', x: -8, z: -38.8, rot: 0.18 },
  { id: 'luck', x: 8, z: -38.8, rot: -0.18 },
  { id: 'deep', x: 14, z: -37.6, rot: -0.42 },
]
export const NORTH_TREES = [
  [-33, -46], [33, -47], [-33, -61], [34, -62],
  [-31, -72], [-16, -72.5], [16, -72.5], [31, -72],
]
// The Forest Mine floor is a grid of separate 2 m cubes (cols along x, rows
// along z), stacked `layers` deep. Removing a cube digs the top layer of its
// column, lowering the floor 2 m; dug cubes stay gone until the player is back
// in the hub (south of HUB_WALL). See systems/mineCubes.js.
export const MINE_CUBES = {
  size: 1,
  layers: 32,
  cols: (NORTH.mine.x1 - NORTH.mine.x0) / 1,
  rows: (NORTH.mine.z1 - NORTH.mine.z0) / 1,
  top: FLOOR_TOP, // top face of an undug column
  bottom: FLOOR_TOP - 32 * 1, // floor of a fully dug column (layers * size)
}

// The pieces of `outer` left after cutting `hole` out of it (hole is clamped to
// outer first); up to four { x0, x1, z0, z1 } rectangles, empty ones dropped.
export function rectsAround(outer, hole) {
  const h = {
    x0: Math.max(hole.x0, outer.x0),
    x1: Math.min(hole.x1, outer.x1),
    z0: Math.max(hole.z0, outer.z0),
    z1: Math.min(hole.z1, outer.z1),
  }
  if (h.x0 >= h.x1 || h.z0 >= h.z1) return [outer]
  return [
    { x0: outer.x0, x1: outer.x1, z0: outer.z0, z1: h.z0 },
    { x0: outer.x0, x1: outer.x1, z0: h.z1, z1: outer.z1 },
    { x0: outer.x0, x1: h.x0, z0: h.z0, z1: h.z1 },
    { x0: h.x1, x1: outer.x1, z0: h.z0, z1: h.z1 },
  ].filter((r) => r.x1 > r.x0 && r.z1 > r.z0)
}

// Walkable area (the player is clamped to it); the north edge is past the moved wall.
export const WORLD_BOUNDS = { minX: -49, maxX: 49, minZ: -85, maxZ: 49 }

export const TREES = [
  [-18.5, -18], [18.5, -18.5], [18.5, 18], [-18, 18.5],
  [-7.5, -18.5], [7.5, -18], [-18.5, 15], [18.5, -7],
  [-34, -34], [34, 34], [34, -34], [-34, 34], [-25, -34], [25, 35],
]

export const INDEX_POS = { x: 19, z: -24 }
export const MAILBOX_POS = { x: -19, z: -24 }

// --- colliders ------------------------------------------------------------
// Boxes { x0, x1, z0, z1, top } and circles { cx, cz, r, top }: the floor
// height under a point is the highest collider covering it (else GROUND_Y).
// Anything taller than the player's step height acts as a wall.
const box = (x0, x1, z0, z1, top) => ({ x0, x1, z0, z1, top })
const circle = (cx, cz, r, top) => ({ cx, cz, r, top })

const W = WALL.inner
const G = GRASS_HALF

export const COLLIDERS = [
  // plaza + paths
  circle(0, 0, PLAZA.rim, PLAZA.rimTop),
  circle(0, 0, PLAZA.radius, PLAZA.top),
  // raised outer floor (four bands around the grass square)
  // (the north band skips the mine: its floor comes from systems/mineCubes.js)
  ...rectsAround({ x0: -W, x1: W, z0: NORTH.wallZ, z1: -G }, NORTH.mine).map((r) => box(r.x0, r.x1, r.z0, r.z1, FLOOR_TOP)),
  box(-W, W, G, W, FLOOR_TOP),
  box(-W, -G, -G, G, FLOOR_TOP),
  box(G, W, -G, G, FLOOR_TOP),
  // perimeter walls
  box(-60, 60, NORTH.wallZ - 20, NORTH.wallZ, WALL.outerHeight),
  box(-60, 60, W, 60, WALL.outerHeight),
  box(-60, -W, NORTH.wallZ - 20, 60, WALL.outerHeight),
  box(W, 60, NORTH.wallZ - 20, 60, WALL.outerHeight),
  // stalls, trees, props
  ...STALLS.map((s) => circle(s.x, s.z, STALL_RADIUS, 1.3)),
  ...TREES.map(([x, z]) => circle(x, z, 0.8, 6)),
  circle(INDEX_POS.x, INDEX_POS.z, 1.2, 2.5),
  circle(MAILBOX_POS.x, MAILBOX_POS.z, 0.6, 2),
  // south: pedestals + admin stage
  box(ADMIN_STAGE.x - ADMIN_STAGE.w / 2, ADMIN_STAGE.x + ADMIN_STAGE.w / 2, ADMIN_STAGE.z - ADMIN_STAGE.d / 2, ADMIN_STAGE.z + ADMIN_STAGE.d / 2, ADMIN_STAGE.top),
  box(ADMIN_STAGE.x - ADMIN_STAGE.w / 2 - 1, ADMIN_STAGE.x + ADMIN_STAGE.w / 2 + 1, ADMIN_STAGE.z - ADMIN_STAGE.d / 2 - 1, ADMIN_STAGE.z + ADMIN_STAGE.d / 2, 0.7),
  ...PEDESTALS.map((p) => circle(p.x, p.z, 2.8, p.id === 'admin' ? 1.6 : 1.0)),
  // west: training stage + targets + bleachers
  box(TRAINING_STAGE.x0, TRAINING_STAGE.x1, TRAINING_STAGE.z0, TRAINING_STAGE.z1, TRAINING_STAGE.top),
  ...TARGETS.map((t) => box(t.x - TARGET_BLOCK / 2, t.x + TARGET_BLOCK / 2, t.z - TARGET_BLOCK / 2, t.z + TARGET_BLOCK / 2, t.top)),
  box(-W, -W + 3, -G, G, 1.0),
  box(-W, -W + 1.5, -G, G, 1.6),
  // east: leaderboard stage
  box(LB_STAGE.x0, LB_STAGE.x1, LB_STAGE.z0, LB_STAGE.z1, LB_STAGE.step),
  box(LB_STAGE.x0 + 2, LB_STAGE.x1, LB_STAGE.z0, LB_STAGE.z1, LB_STAGE.top),
  ...LB_BOARDS.map((b) => box(LB_BOARD_X - 0.4, LB_BOARD_X + 1, b.z - 3.2, b.z + 3.2, 9)),
  // north: Mine arch pillars, signboards, fences, trees
  box(-GATE.halfW - 0.7, -GATE.halfW + 0.7, GATE.z - 0.7, GATE.z + 0.7, GATE.height),
  box(GATE.halfW - 0.7, GATE.halfW + 0.7, GATE.z - 0.7, GATE.z + 0.7, GATE.height),
  ...INFO_BOARDS.map((b) => circle(b.x, b.z, 2.2, 4)),
  ...fenceColliders(),
  ...NORTH_TREES.map(([x, z]) => circle(x, z, 0.8, 6)),
  // hub / north dividing wall (either side of the gate)
  box(-WALL.inner, -HUB_WALL.halfGap, HUB_WALL.z0, HUB_WALL.z1, HUB_WALL.height),
  box(HUB_WALL.halfGap, WALL.inner, HUB_WALL.z0, HUB_WALL.z1, HUB_WALL.height),
]

// The mine fence as thin wall boxes, with the gap between the arch pillars.
function fenceColliders() {
  const { x0, x1, z0, z1 } = NORTH.mine
  const t = 0.3
  return [
    box(x0, -GATE.halfW, z1 - t, z1 + t, 2.4),
    box(GATE.halfW, x1, z1 - t, z1 + t, 2.4),
    box(x0 - t, x0 + t, z0, z1, 2.4),
    box(x1 - t, x1 + t, z0, z1, 2.4),
    box(x0, x1, z0 - t, z0 + t, 2.4),
  ]
}
