// World layout in metres (+X east, +Z south, +Y up). The lobby hub: a round
// plaza at the origin, a cross of paths out to four zones, grass quadrants
// with a shop stall each, and a raised blue-grey floor ringed by terraced
// orange walls.
//
//   north (-Z)  Desert Mine gate
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
  { id: 'tnt', label: 'TNT', icon: 'tnt', x: -12, z: -12, stripes: ['#e8262b', '#ffffff'] },
  { id: 'sell', label: 'SELL', icon: 'cash', x: 12, z: -12, stripes: ['#2fd13b', '#ffffff'] },
  { id: 'shop', label: 'SHOP', icon: 'basket', x: 12, z: 12, stripes: ['#ffd21f', '#ffffff'] },
  { id: 'upgrade', label: 'UPGRADE', icon: 'upgrade', x: -12, z: 12, stripes: ['#f4ecd0', '#ffffff'] },
]
export const STALL_RADIUS = 3.9
export const STALL_SCALE = 1.3

// Premium TNT on pedestals along the south edge.
export const PEDESTALS = [
  { id: 'corrupt', name: 'Corrupt TNT', tagline: 'Big Explosion!', price: 69, color: '#ffd400', nameColor: '#ffd23a', x: 10, z: 27 },
  { id: 'admin', name: 'Admin TNT', tagline: 'Massive Explosion!', price: 449, color: '#e01b24', nameColor: '#ff3b3b', x: 0, z: 30 },
  { id: 'atomic', name: 'Atomic TNT', tagline: 'Huge Explosion!', price: 205, color: '#7ee81e', nameColor: '#5bff2a', x: -10, z: 27 },
]
export const ADMIN_STAGE = { x: 0, z: 30, w: 9, d: 6.5, top: 1.0 }

// Training targets: blocks you blast for damage multipliers.
export const TARGETS = [
  { block: 'wood', mult: '1x', unlocked: true, x: -25, z: 12.5 },
  { block: 'stone', mult: '1.5x', cost: 1, currency: 'rebirth', x: -29.5, z: 9 },
  { block: 'snow', mult: '3x', cost: 3, currency: 'rebirth', x: -33, z: 5.2 },
  { block: 'crystal', mult: '50x', cost: 449, currency: 'gem', x: -34, z: 0 },
  { block: 'ruby', mult: '25x', cost: 205, currency: 'gem', x: -33, z: -5.2 },
  { block: 'emerald', mult: '10x', cost: 10, currency: 'rebirth', x: -29.5, z: -9 },
  { block: 'gold', mult: '5x', cost: 5, currency: 'rebirth', x: -25, z: -12.5 },
]
export const TRAINING_PAD = { x: -32, z: 0, size: 8, top: 0.6 }

// Leaderboards stage on the east side.
export const LB_STAGE = { x0: 29, x1: 40, z0: -13, z1: 13, step: 0.8, top: 1.2 }
export const LB_BOARD_X = 38
export const LB_BOARDS = [
  { id: 'damage', title: 'Most Damage', icon: 'burst', z: -8.5 },
  { id: 'rebirths', title: 'Most Rebirths', icon: 'rebirth', z: 0 },
  { id: 'money', title: 'Most Money', icon: 'cash', z: 8.5 },
]

// North zone: a checkered start line where the hub ends, a bright-green field,
// then a wooden fence with the "Mine" arch (under the black "Desert" sign)
// opening onto the orange Desert Mine floor. The north wall sits behind it all.
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
export const DESERT_SIGN = { z: NORTH.fenceZ - 1.4, w: 11, y0: 6.8, y1: 13.6, price: '$12M' }
// Signboards fanned out in front of the fence, angled toward the plaza.
export const INFO_BOARDS = [
  { id: 'damage', x: -14, z: -37.6, rot: 0.42 },
  { id: 'secret', x: -8, z: -38.8, rot: 0.18 },
  { id: 'luck', x: 8, z: -38.8, rot: -0.18 },
  { id: 'deep', x: 14, z: -37.6, rot: -0.42 },
]
export const NORTH_TREES = [
  [-33, -46], [33, -47], [-33, -61], [34, -62],
  [-31, -72], [-16, -72.5], [0, -73], [16, -72.5], [31, -72],
]
// Walkable area (the player is clamped to it); the north edge is past the moved wall.
export const WORLD_BOUNDS = { minX: -49, maxX: 49, minZ: -85, maxZ: 49 }

export const TREES = [
  [-18.5, -18], [18.5, -18.5], [18.5, 18], [-18, 18.5],
  [-7.5, -18.5], [7.5, -18], [-18.5, 7], [18.5, -7],
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
  box(-W, W, NORTH.wallZ, -G, FLOOR_TOP),
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
  // west: training pad + targets + bleachers
  box(TRAINING_PAD.x - TRAINING_PAD.size / 2, TRAINING_PAD.x + TRAINING_PAD.size / 2, TRAINING_PAD.z - TRAINING_PAD.size / 2, TRAINING_PAD.z + TRAINING_PAD.size / 2, TRAINING_PAD.top),
  ...TARGETS.map((t) => circle(t.x, t.z, 1.5, 2.8)),
  box(-W, -W + 3, -G, G, 1.0),
  box(-W, -W + 1.5, -G, G, 1.6),
  // east: leaderboard stage
  box(LB_STAGE.x0, LB_STAGE.x1, LB_STAGE.z0, LB_STAGE.z1, LB_STAGE.step),
  box(LB_STAGE.x0 + 2, LB_STAGE.x1, LB_STAGE.z0, LB_STAGE.z1, LB_STAGE.top),
  ...LB_BOARDS.map((b) => box(LB_BOARD_X - 0.4, LB_BOARD_X + 1, b.z - 3.2, b.z + 3.2, 9)),
  // north: Mine arch pillars, Desert sign legs, signboards, fences, trees
  box(-GATE.halfW - 0.7, -GATE.halfW + 0.7, GATE.z - 0.7, GATE.z + 0.7, GATE.height),
  box(GATE.halfW - 0.7, GATE.halfW + 0.7, GATE.z - 0.7, GATE.z + 0.7, GATE.height),
  ...[-1, 1].map((sx) => box(sx * 4.5 - 0.3, sx * 4.5 + 0.3, DESERT_SIGN.z - 0.3, DESERT_SIGN.z + 0.3, DESERT_SIGN.y0)),
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
